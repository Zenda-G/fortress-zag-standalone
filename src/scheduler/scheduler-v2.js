/**
 * Task Scheduler v2
 * 
 * Enhanced scheduling with job persistence, retry logic,
 * dependency chains, and event-driven execution.
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class TaskSchedulerV2 extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.jobs = new Map();
        this.dependencies = new Map();
        this.history = [];
        this.maxHistory = options.maxHistory || 100;
        
        this.persistencePath = options.persistencePath || './data/scheduler-v2.json';
        this.workdir = options.workdir || './data';
        
        this.retryConfig = {
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 5000,
            exponentialBackoff: options.exponentialBackoff !== false
        };
        
        // Ensure directories exist
        this.ensureDirectories();
        
        // Load persisted jobs
        this.loadJobs();
    }

    ensureDirectories() {
        const dirs = [this.workdir, path.dirname(this.persistencePath)];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Schedule a new job
     */
    scheduleJob(id, expression, task, options = {}) {
        // Validate cron expression
        if (!cron.validate(expression)) {
            throw new Error(`Invalid cron expression: ${expression}`);
        }

        // Stop existing job if it exists
        if (this.jobs.has(id)) {
            this.unscheduleJob(id);
        }

        // Create job config
        const jobConfig = {
            id,
            expression,
            task,
            options: {
                enabled: options.enabled !== false,
                priority: options.priority || 0,
                dependencies: options.dependencies || [],
                retryCount: 0,
                maxRetries: options.maxRetries || this.retryConfig.maxRetries,
                description: options.description || '',
                tags: options.tags || [],
                timezone: options.timezone || 'UTC',
                ...options
            },
            status: 'scheduled',
            lastRun: null,
            nextRun: null,
            runCount: 0,
            failCount: 0,
            createdAt: new Date().toISOString()
        };

        // Store job config
        this.jobs.set(id, jobConfig);
        this.dependencies.set(id, new Set(options.dependencies || []));

        // Start the job if enabled
        if (jobConfig.options.enabled) {
            this.startJob(id);
        }

        // Persist jobs
        this.saveJobs();

        this.emit('jobScheduled', { id, expression });
        return jobConfig;
    }

    /**
     * Start a scheduled job
     */
    startJob(id) {
        const jobConfig = this.jobs.get(id);
        if (!jobConfig) {
            throw new Error(`Job not found: ${id}`);
        }

        if (jobConfig.taskInstance) {
            jobConfig.taskInstance.stop();
        }

        // Create cron task
        const taskInstance = cron.schedule(jobConfig.expression, async () => {
            await this.executeJob(id);
        }, {
            scheduled: true,
            timezone: jobConfig.options.timezone
        });

        jobConfig.taskInstance = taskInstance;
        jobConfig.status = 'active';
        jobConfig.nextRun = this.getNextRunTime(jobConfig.expression);

        this.emit('jobStarted', { id });
    }

    /**
     * Execute a job with retry logic and dependency checking
     */
    async executeJob(id) {
        const jobConfig = this.jobs.get(id);
        if (!jobConfig) {
            console.error(`Job not found: ${id}`);
            return;
        }

        // Check dependencies
        const dependencyCheck = this.checkDependencies(id);
        if (!dependencyCheck.satisfied) {
            console.log(`Job ${id} waiting for dependencies: ${dependencyCheck.missing.join(', ')}`);
            this.emit('jobWaiting', { id, missing: dependencyCheck.missing });
            return;
        }

        jobConfig.status = 'running';
        jobConfig.lastRun = new Date().toISOString();
        jobConfig.nextRun = this.getNextRunTime(jobConfig.expression);

        const startTime = Date.now();

        try {
            this.emit('jobExecuting', { id });

            // Execute the task
            const result = await this.runTask(jobConfig.task, jobConfig.options);

            const duration = Date.now() - startTime;

            // Update stats
            jobConfig.runCount++;
            jobConfig.retryCount = 0;
            jobConfig.status = 'active';

            // Record success
            this.recordHistory({
                jobId: id,
                status: 'success',
                duration,
                result: result,
                timestamp: new Date().toISOString()
            });

            this.emit('jobSuccess', { id, duration, result });

        } catch (error) {
            const duration = Date.now() - startTime;

            jobConfig.failCount++;
            jobConfig.status = 'failed';

            // Record failure
            this.recordHistory({
                jobId: id,
                status: 'failed',
                duration,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            this.emit('jobFailed', { id, duration, error: error.message });

            // Retry logic
            if (jobConfig.retryCount < jobConfig.options.maxRetries) {
                jobConfig.retryCount++;
                const delay = this.calculateRetryDelay(jobConfig.retryCount);
                
                console.log(`Job ${id} failed. Retrying in ${delay}ms (attempt ${jobConfig.retryCount}/${jobConfig.options.maxRetries})`);
                
                setTimeout(() => {
                    this.executeJob(id);
                }, delay);
            } else {
                jobConfig.status = 'error';
                jobConfig.retryCount = 0;
                this.emit('jobError', { id, error: error.message });
            }
        }

        this.saveJobs();
    }

    /**
     * Run the actual task function
     */
    async runTask(task, options) {
        if (typeof task === 'function') {
            return await task(options);
        }
        
        if (typeof task === 'string') {
            // Execute as command
            const { exec } = require('child_process');
            return new Promise((resolve, reject) => {
                exec(task, { timeout: options.timeout || 30000 }, (error, stdout, stderr) => {
                    if (error) reject(error);
                    else resolve({ stdout, stderr });
                });
            });
        }
        
        if (task.type === 'http') {
            // HTTP request task
            const fetch = require('node-fetch');
            const response = await fetch(task.url, task.options || {});
            return await response.text();
        }

        throw new Error('Unknown task type');
    }

    /**
     * Check if all dependencies are satisfied
     */
    checkDependencies(jobId) {
        const dependencies = this.dependencies.get(jobId);
        if (!dependencies || dependencies.size === 0) {
            return { satisfied: true, missing: [] };
        }

        const missing = [];
        for (const depId of dependencies) {
            const depJob = this.jobs.get(depId);
            if (!depJob || depJob.status !== 'active') {
                missing.push(depId);
            }
        }

        return {
            satisfied: missing.length === 0,
            missing
        };
    }

    /**
     * Calculate retry delay with optional exponential backoff
     */
    calculateRetryDelay(attempt) {
        if (this.retryConfig.exponentialBackoff) {
            return this.retryConfig.retryDelay * Math.pow(2, attempt - 1);
        }
        return this.retryConfig.retryDelay;
    }

    /**
     * Get next run time for a cron expression
     */
    getNextRunTime(expression) {
        // This is a simplified version - in production, use a proper cron parser
        const now = new Date();
        const parts = expression.split(' ');
        
        if (parts.length >= 5) {
            // Add appropriate time based on cron
            // For now, just return a placeholder
            return new Date(now.getTime() + 60000).toISOString();
        }
        
        return null;
    }

    /**
     * Record execution history
     */
    recordHistory(record) {
        this.history.unshift(record);
        
        // Trim history if too long
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }
    }

    /**
     * Unschedule a job
     */
    unscheduleJob(id) {
        const jobConfig = this.jobs.get(id);
        if (jobConfig && jobConfig.taskInstance) {
            jobConfig.taskInstance.stop();
        }
        
        this.jobs.delete(id);
        this.dependencies.delete(id);
        this.saveJobs();
        
        this.emit('jobUnscheduled', { id });
    }

    /**
     * Enable a job
     */
    enableJob(id) {
        const jobConfig = this.jobs.get(id);
        if (jobConfig) {
            jobConfig.options.enabled = true;
            this.startJob(id);
            this.saveJobs();
        }
    }

    /**
     * Disable a job
     */
    disableJob(id) {
        const jobConfig = this.jobs.get(id);
        if (jobConfig && jobConfig.taskInstance) {
            jobConfig.taskInstance.stop();
            jobConfig.options.enabled = false;
            jobConfig.status = 'disabled';
            this.saveJobs();
        }
    }

    /**
     * Get job details
     */
    getJob(id) {
        return this.jobs.get(id);
    }

    /**
     * Get all jobs
     */
    getAllJobs() {
        return Array.from(this.jobs.values());
    }

    /**
     * Get jobs by tag
     */
    getJobsByTag(tag) {
        return Array.from(this.jobs.values()).filter(job => 
            job.options.tags && job.options.tags.includes(tag)
        );
    }

    /**
     * Get execution history
     */
    getHistory(options = {}) {
        let filtered = this.history;
        
        if (options.jobId) {
            filtered = filtered.filter(h => h.jobId === options.jobId);
        }
        
        if (options.status) {
            filtered = filtered.filter(h => h.status === options.status);
        }
        
        if (options.limit) {
            filtered = filtered.slice(0, options.limit);
        }
        
        return filtered;
    }

    /**
     * Save jobs to disk
     */
    saveJobs() {
        try {
            const data = {
                jobs: Array.from(this.jobs.entries()).map(([id, config]) => ({
                    id,
                    ...config,
                    taskInstance: undefined // Don't serialize the cron instance
                })),
                history: this.history,
                savedAt: new Date().toISOString()
            };
            
            fs.writeFileSync(this.persistencePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving jobs:', error);
        }
    }

    /**
     * Load jobs from disk
     */
    loadJobs() {
        try {
            if (fs.existsSync(this.persistencePath)) {
                const data = JSON.parse(fs.readFileSync(this.persistencePath, 'utf8'));
                
                if (data.jobs) {
                    for (const jobData of data.jobs) {
                        const { id, ...config } = jobData;
                        this.jobs.set(id, config);
                        this.dependencies.set(id, new Set(config.options?.dependencies || []));
                        
                        // Restart job if it was active
                        if (config.status === 'active' && config.options?.enabled) {
                            this.startJob(id);
                        }
                    }
                }
                
                if (data.history) {
                    this.history = data.history;
                }
                
                console.log(`Loaded ${this.jobs.size} jobs from persistence`);
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
        }
    }

    /**
     * Get scheduler statistics
     */
    getStats() {
        const jobs = Array.from(this.jobs.values());
        
        return {
            totalJobs: jobs.length,
            activeJobs: jobs.filter(j => j.status === 'active').length,
            failedJobs: jobs.filter(j => j.status === 'failed' || j.status === 'error').length,
            disabledJobs: jobs.filter(j => j.status === 'disabled').length,
            totalRuns: jobs.reduce((sum, j) => sum + j.runCount, 0),
            totalFails: jobs.reduce((sum, j) => sum + j.failCount, 0),
            historySize: this.history.length,
            uptime: process.uptime()
        };
    }

    /**
     * Stop all jobs
     */
    stopAll() {
        for (const [id, jobConfig] of this.jobs) {
            if (jobConfig.taskInstance) {
                jobConfig.taskInstance.stop();
                jobConfig.status = 'stopped';
            }
        }
        this.saveJobs();
    }

    /**
     * Start all enabled jobs
     */
    startAll() {
        for (const [id, jobConfig] of this.jobs) {
            if (jobConfig.options.enabled && jobConfig.status !== 'active') {
                this.startJob(id);
            }
        }
    }
}

module.exports = { TaskSchedulerV2 };