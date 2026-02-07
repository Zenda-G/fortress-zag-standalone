/**
 * FORTRESS ZAG - Layer 3: Execution Sandbox
 * 
 * Isolates tool execution in sandboxed environments:
 * - Docker containers (Linux/Mac)
 * - Process isolation with restricted permissions
 * - Resource limits (CPU, memory, time)
 * - Filesystem isolation (bind mounts, read-only)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CONFIG = {
  // Sandbox mode: 'docker', 'firejail', 'chroot', or 'process'
  mode: detectSandboxMode(),
  
  // Resource limits
  timeout: 30000,        // 30 seconds
  maxMemory: 256,        // 256 MB
  maxCpuPercent: 50,     // 50% CPU
  
  // Filesystem isolation
  workspaceMount: '/workspace',
  readOnlyMounts: ['/etc/resolv.conf'],
  
  // Network isolation
  networkMode: 'none',   // 'none', 'bridge', 'host'
  
  // Cleanup
  autoCleanup: true
};

function detectSandboxMode() {
  // Detect available sandboxing tools
  if (process.platform === 'linux') {
    // Check for Docker
    try {
      fs.accessSync('/var/run/docker.sock', fs.constants.R_OK);
      return 'docker';
    } catch {}
    
    // Check for Firejail
    try {
      fs.accessSync('/usr/bin/firejail', fs.constants.X_OK);
      return 'firejail';
    } catch {}
    
    // Fall back to process isolation
    return 'process';
  }
  
  if (process.platform === 'darwin') {
    // macOS - limited sandboxing options
    try {
      fs.accessSync('/var/run/docker.sock', fs.constants.R_OK);
      return 'docker';
    } catch {}
    
    return 'process';
  }
  
  if (process.platform === 'win32') {
    // Windows - use process isolation or WSL2 Docker
    return 'process';
  }
  
  return 'process';
}

/**
 * Execute a command in sandboxed environment
 */
async function sandboxExecute(command, options = {}) {
  const sandbox = {
    id: generateSandboxId(),
    command: command,
    mode: options.mode || CONFIG.mode,
    started: Date.now(),
    status: 'pending',
    result: null
  };
  
  switch (sandbox.mode) {
    case 'docker':
      sandbox.result = await executeDocker(sandbox, options);
      break;
    case 'firejail':
      sandbox.result = await executeFirejail(sandbox, options);
      break;
    case 'process':
      sandbox.result = await executeProcess(sandbox, options);
      break;
    default:
      throw new Error(`Unknown sandbox mode: ${sandbox.mode}`);
  }
  
  sandbox.status = sandbox.result.success ? 'completed' : 'failed';
  sandbox.duration = Date.now() - sandbox.started;
  
  return sandbox;
}

/**
 * Execute in Docker container
 */
async function executeDocker(sandbox, options) {
  const workspace = options.workspace || process.cwd();
  
  const dockerArgs = [
    'run',
    '--rm',                          // Remove after exit
    '--network', CONFIG.networkMode,  // Network isolation
    '--memory', `${CONFIG.maxMemory}m`, // Memory limit
    '--memory-swap', `${CONFIG.maxMemory}m`, // No swap
    '--cpus', '0.5',                 // CPU limit
    '--pids-limit', '100',           // Process limit
    '-v', `${workspace}:${CONFIG.workspaceMount}:rw`, // Mount workspace
    '-w', CONFIG.workspaceMount,     // Working directory
    '--read-only',                   // Read-only root filesystem
    ...(CONFIG.readOnlyMounts.flatMap(m => ['-v', `${m}:${m}:ro`])),
    'alpine:latest',                 // Minimal container
    'sh', '-c', sandbox.command
  ];
  
  return executeWithTimeout('docker', dockerArgs, CONFIG.timeout);
}

/**
 * Execute in Firejail sandbox
 */
async function executeFirejail(sandbox, options) {
  const workspace = options.workspace || process.cwd();
  
  const firejailArgs = [
    '--noprofile',                   // No default profile
    '--private=' + workspace,        // Private home
    '--net=none',                    // No network
    '--rlimit-cpu=30',              // CPU time limit
    '--rlimit-as=' + (CONFIG.maxMemory * 1024 * 1024), // Memory limit
    '--rlimit-nproc=50',            // Process limit
    '--rlimit-nofile=32',           // File descriptor limit
    '--seccomp',                     // System call filtering
    '--shell=none',                  // No shell access
    sandbox.command
  ];
  
  return executeWithTimeout('firejail', firejailArgs, CONFIG.timeout);
}

/**
 * Execute with process-level restrictions (fallback)
 */
async function executeProcess(sandbox, options) {
  const child = spawn('sh', ['-c', sandbox.command], {
    cwd: options.workspace || process.cwd(),
    env: sanitizeEnv(process.env),
    detached: false,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let killed = false;
    
    // Collect output
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      // Limit output size
      if (stdout.length > 100000) {
        stdout = stdout.substring(0, 100000) + '\n... (truncated)';
      }
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 100000) {
        stderr = stderr.substring(0, 100000) + '\n... (truncated)';
      }
    });
    
    // Timeout handler
    const timeout = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      // Force kill after grace period
      setTimeout(() => child.kill('SIGKILL'), 5000);
    }, CONFIG.timeout);
    
    // Completion handler
    child.on('close', (code) => {
      clearTimeout(timeout);
      
      resolve({
        success: code === 0 && !killed,
        exitCode: code,
        killed: killed,
        stdout: stdout,
        stderr: stderr,
        duration: Date.now() - sandbox.started
      });
    });
    
    // Error handler
    child.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        exitCode: -1,
        error: error.message,
        stdout: stdout,
        stderr: stderr
      });
    });
  });
}

/**
 * Execute with timeout wrapper
 */
function executeWithTimeout(command, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    let killed = false;
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const timeout = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000);
    }, timeoutMs);
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        success: code === 0 && !killed,
        exitCode: code,
        killed: killed,
        stdout: stdout,
        stderr: stderr
      });
    });
    
    child.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        exitCode: -1,
        error: error.message,
        stdout: stdout,
        stderr: stderr
      });
    });
  });
}

/**
 * Sanitize environment variables
 */
function sanitizeEnv(env) {
  const sensitive = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AZURE_CLIENT_SECRET',
    'GCP_SERVICE_ACCOUNT_KEY',
    'GITHUB_TOKEN',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'SSH_PRIVATE_KEY',
    'DOCKER_AUTH_CONFIG',
    'KUBECONFIG'
  ];
  
  const sanitized = { ...env };
  
  for (const key of sensitive) {
    delete sanitized[key];
  }
  
  // Set safe defaults
  sanitized.PATH = '/usr/local/bin:/usr/bin:/bin';
  sanitized.HOME = '/tmp';
  
  return sanitized;
}

/**
 * Generate unique sandbox ID
 */
function generateSandboxId() {
  return `sandbox-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Check if sandbox environment is available
 */
function checkSandboxAvailability() {
  const checks = {
    docker: false,
    firejail: false,
    process: true // Always available
  };
  
  // Check Docker
  try {
    fs.accessSync('/var/run/docker.sock', fs.constants.R_OK);
    checks.docker = true;
  } catch {}
  
  // Check Firejail
  try {
    fs.accessSync('/usr/bin/firejail', fs.constants.X_OK);
    checks.firejail = true;
  } catch {}
  
  return checks;
}

/**
 * Create temporary sandbox directory
 */
function createTempSandbox() {
  const tmpDir = path.join(os.tmpdir(), `zag-sandbox-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true, mode: 0o700 });
  return tmpDir;
}

/**
 * Cleanup sandbox directory
 */
function cleanupSandbox(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Export API
module.exports = {
  sandboxExecute,
  executeDocker,
  executeFirejail,
  executeProcess,
  checkSandboxAvailability,
  createTempSandbox,
  cleanupSandbox,
  sanitizeEnv,
  CONFIG,
  detectSandboxMode
};

// CLI
if (require.main === module) {
  const command = process.argv.slice(2).join(' ') || 'echo "Sandbox test"';
  
  console.log('Sandbox availability:', checkSandboxAvailability());
  console.log('Selected mode:', CONFIG.mode);
  console.log('\nExecuting:', command);
  
  sandboxExecute(command).then(result => {
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
  });
}
