/**
 * FORTRESS ZAG - Scheduled Tasks Module
 * 
 * Cron-like scheduling for automated tasks.
 */

const fs = require('fs');
const path = require('path');

const SCHEDULE_FILE = path.join(process.cwd(), 'data', 'schedules.json');
const LOG_FILE = path.join(process.cwd(), 'data', 'cron-log.jsonl');

// In-memory job store
let jobs = new Map();
let intervals = [];

/**
 * Load saved schedules
 */
function loadSchedules() {
  if (fs.existsSync(SCHEDULE_FILE)) {
    const data = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
    return data.schedules || [];
  }
  return [];
}

/**
 * Save schedules
 */
function saveSchedules(schedules) {
  fs.mkdirSync(path.dirname(SCHEDULE_FILE), { recursive: true });
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify({ schedules }, null, 2));
}

/**
 * Log job execution
 */
function logJobExecution(jobId, status, result) {
  const entry = {
    timestamp: new Date().toISOString(),
    jobId,
    status,
    result: result ? String(result).substring(0, 200) : null
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}

/**
 * Parse cron-like expression
 * Supports: "* * * * *" (min hour day month dow)
 * Or: "every 5 minutes", "every hour", "daily at 9am"
 */
function parseSchedule(expression) {
  const now = new Date();
  
  // Simple natural language parsing
  if (expression.includes('every')) {
    if (expression.includes('minute')) {
      return { type: 'interval', ms: 60000 };
    }
    if (expression.match(/(\d+)\s*minutes?/)) {
      const mins = parseInt(expression.match(/(\d+)\s*minutes?/)[1]);
      return { type: 'interval', ms: mins * 60000 };
    }
    if (expression.includes('hour')) {
      return { type: 'interval', ms: 3600000 };
    }
    if (expression.includes('day')) {
      return { type: 'interval', ms: 86400000 };
    }
  }
  
  if (expression.includes('daily')) {
    const timeMatch = expression.match(/(\d+):?(\d*)?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]) || 0;
      const ampm = timeMatch[3];
      
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      
      return { type: 'daily', hour, minute };
    }
  }
  
  // Default: interval in minutes
  const minutes = parseInt(expression);
  if (!isNaN(minutes)) {
    return { type: 'interval', ms: minutes * 60000 };
  }
  
  return { type: 'interval', ms: 3600000 }; // Default: hourly
}

/**
 * Schedule a new job
 */
function scheduleJob(id, expression, task, options = {}) {
  const schedule = parseSchedule(expression);
  
  const job = {
    id,
    expression,
    schedule,
    task,
    enabled: true,
    created: new Date().toISOString(),
    lastRun: null,
    runCount: 0,
    options
  };
  
  // Save to file
  const schedules = loadSchedules();
  const existingIndex = schedules.findIndex(s => s.id === id);
  if (existingIndex >= 0) {
    schedules[existingIndex] = job;
  } else {
    schedules.push(job);
  }
  saveSchedules(schedules);
  
  // Start the job
  startJob(job);
  
  return job;
}

/**
 * Start a job
 */
function startJob(job) {
  // Clear existing interval for this job
  stopJob(job.id);
  
  if (!job.enabled) return;
  
  let intervalMs;
  
  if (job.schedule.type === 'interval') {
    intervalMs = job.schedule.ms;
  } else if (job.schedule.type === 'daily') {
    // Calculate next run time
    const now = new Date();
    let nextRun = new Date(now);
    nextRun.setHours(job.schedule.hour, job.schedule.minute, 0, 0);
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    intervalMs = nextRun - now;
    
    // After first run, switch to 24-hour interval
    setTimeout(() => {
      if (jobs.has(job.id)) {
        const dailyInterval = setInterval(() => {
          executeJob(job);
        }, 86400000);
        intervals.push({ id: job.id, interval: dailyInterval });
      }
    }, intervalMs);
    
    return;
  }
  
  // Set up interval
  const interval = setInterval(() => {
    executeJob(job);
  }, intervalMs);
  
  intervals.push({ id: job.id, interval });
  jobs.set(job.id, job);
}

/**
 * Execute a job
 */
async function executeJob(job) {
  console.log(`[SCHEDULER] Executing job: ${job.id}`);
  
  job.lastRun = new Date().toISOString();
  job.runCount++;
  
  try {
    let result;
    
    if (typeof job.task === 'function') {
      result = await job.task();
    } else if (typeof job.task === 'string') {
      // Execute as shell command
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      result = await execPromise(job.task, { timeout: 30000 });
    } else if (job.task.type === 'message') {
      // Send message to interface
      result = { sent: true, text: job.task.text };
    }
    
    logJobExecution(job.id, 'success', result);
    
    // Update schedule file
    const schedules = loadSchedules();
    const idx = schedules.findIndex(s => s.id === job.id);
    if (idx >= 0) {
      schedules[idx].lastRun = job.lastRun;
      schedules[idx].runCount = job.runCount;
      saveSchedules(schedules);
    }
    
    return result;
  } catch (error) {
    console.error(`[SCHEDULER] Job ${job.id} failed:`, error.message);
    logJobExecution(job.id, 'error', error.message);
    throw error;
  }
}

/**
 * Stop a job
 */
function stopJob(id) {
  // Clear interval
  const idx = intervals.findIndex(i => i.id === id);
  if (idx >= 0) {
    clearInterval(intervals[idx].interval);
    intervals.splice(idx, 1);
  }
  
  // Remove from active jobs
  jobs.delete(id);
}

/**
 * Disable a job
 */
function disableJob(id) {
  stopJob(id);
  
  const schedules = loadSchedules();
  const job = schedules.find(s => s.id === id);
  if (job) {
    job.enabled = false;
    saveSchedules(schedules);
  }
}

/**
 * Enable a job
 */
function enableJob(id) {
  const schedules = loadSchedules();
  const job = schedules.find(s => s.id === id);
  if (job) {
    job.enabled = true;
    saveSchedules(schedules);
    startJob(job);
  }
}

/**
 * Remove a job
 */
function removeJob(id) {
  stopJob(id);
  
  const schedules = loadSchedules().filter(s => s.id !== id);
  saveSchedules(schedules);
}

/**
 * Get all jobs
 */
function getJobs() {
  return loadSchedules();
}

/**
 * Get job logs
 */
function getJobLogs(jobId, limit = 50) {
  if (!fs.existsSync(LOG_FILE)) return [];
  
  const lines = fs.readFileSync(LOG_FILE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
  
  if (jobId) {
    return lines.filter(l => l.jobId === jobId).slice(-limit);
  }
  
  return lines.slice(-limit);
}

/**
 * Initialize scheduler - load and start all saved jobs
 */
function initializeScheduler() {
  console.log('[SCHEDULER] Initializing...');
  
  const schedules = loadSchedules();
  let started = 0;
  
  for (const job of schedules) {
    if (job.enabled) {
      // Note: Functions can't be restored from JSON, so tasks must be re-registered
      // For now, only string commands and message types are auto-restored
      if (typeof job.task === 'string' || job.task?.type) {
        startJob(job);
        started++;
      }
    }
  }
  
  console.log(`[SCHEDULER] Started ${started}/${schedules.length} jobs`);
}

/**
 * Shutdown scheduler
 */
function shutdownScheduler() {
  console.log('[SCHEDULER] Shutting down...');
  
  for (const { interval } of intervals) {
    clearInterval(interval);
  }
  intervals = [];
  jobs.clear();
}

module.exports = {
  scheduleJob,
  stopJob,
  enableJob,
  disableJob,
  removeJob,
  getJobs,
  getJobLogs,
  initializeScheduler,
  shutdownScheduler,
  executeJob
};
