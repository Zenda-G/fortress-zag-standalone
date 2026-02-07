/**
 * FORTRESS ZAG - Layer 2: Pre-Execution Validation
 * 
 * Validates tool inputs before execution to prevent:
 * - Command injection
 * - Path traversal
 * - Privilege escalation
 * - Unauthorized network access
 */

const path = require('path');

// Configuration
const CONFIG = {
  workspaceRoot: process.cwd(),
  
  // Filesystem restrictions
  allowedPaths: [
    '~/workspace',
    '~/.openclaw',
    '/tmp/agent',
    './'  // Relative to workspace
  ],
  
  blockedPaths: [
    '/etc/ssh',
    '/etc/passwd',
    '~/.ssh',
    '~/.aws',
    '~/.config',
    '/var/log',
    '/proc',
    '/sys',
    '/dev',
    'C:\\Windows',
    'C:\\Program Files',
    'C:\\ProgramData'
  ],
  
  // Command restrictions
  blockedCommands: [
    // Privilege escalation
    'sudo', 'su', 'doas', 'pkexec',
    
    // Destructive operations
    'mkfs', 'format', 'fdisk', 'dd',
    'shred', 'wipe', 'scrub',
    
    // System modification
    'chmod', 'chown', 'chgrp',
    'usermod', 'useradd', 'passwd',
    
    // Network exfiltration risks
    'nc', 'netcat', 'ncat',
    'telnet',
    
    // Reverse shell patterns
    'bash -i', 'sh -i', 'zsh -i',
    
    // Process manipulation
    'kill', 'killall', 'pkill',
    
    // Package installation (risky)
    'pip install', 'npm install -g',
    
    // Windows-specific
    'powershell -enc', 'powershell -encoded',
    'cmd /c', 'cmd /k',
    'rundll32', 'regsvr32',
    'msiexec'
  ],
  
  // Allowed commands (if using allowlist mode)
  allowedCommands: [
    'ls', 'dir', 'cat', 'type',
    'head', 'tail', 'less', 'more',
    'grep', 'find', 'findstr',
    'wc', 'sort', 'uniq',
    'diff', 'cmp',
    'git', 'npm', 'node', 'python',
    'echo', 'printf', 'pwd', 'cd',
    'mkdir', 'rmdir', 'touch',
    'cp', 'copy', 'mv', 'move', 'rm', 'del',
    'tar', 'zip', 'unzip', 'gzip'
  ],
  
  // Network restrictions
  blockedDomains: [
    'pastebin.com',
    'hastebin.com',
    'ghostbin.co',
    'termbin.com',
    'requestbin.net'
  ],
  
  allowedDomains: [
    'github.com',
    'api.github.com',
    'raw.githubusercontent.com',
    'pypi.org',
    'registry.npmjs.org',
    'api.openai.com',
    'api.moonshot.cn',
    'api.anthropic.com'
  ]
};

/**
 * Validate a command before execution
 */
function validateCommand(command, options = {}) {
  const result = {
    valid: true,
    command: command,
    normalized: normalizeCommand(command),
    issues: [],
    riskLevel: 'low'
  };
  
  // Check 1: Blocked command patterns
  const blocked = checkBlockedCommands(result.normalized);
  if (blocked.length > 0) {
    result.issues.push({
      type: 'blocked-command',
      severity: 'critical',
      message: 'Command contains blocked patterns',
      patterns: blocked
    });
    result.valid = false;
    result.riskLevel = 'critical';
  }
  
  // Check 2: Path traversal
  const traversal = detectPathTraversal(result.normalized);
  if (traversal.length > 0) {
    result.issues.push({
      type: 'path-traversal',
      severity: 'critical',
      message: 'Path traversal attempt detected',
      paths: traversal
    });
    result.valid = false;
    result.riskLevel = 'critical';
  }
  
  // Check 3: Command chaining (injection risk)
  const chaining = detectCommandChaining(result.normalized);
  if (chaining.length > 0) {
    result.issues.push({
      type: 'command-chaining',
      severity: 'high',
      message: 'Command chaining detected (injection risk)',
      operators: chaining
    });
    result.riskLevel = 'high';
  }
  
  // Check 4: Environment variable access
  const envVars = detectEnvVarAccess(result.normalized);
  if (envVars.length > 0) {
    result.issues.push({
      type: 'environment-access',
      severity: 'medium',
      message: 'Environment variable access detected',
      variables: envVars
    });
  }
  
  // Check 5: Credential patterns in command
  const credentials = detectCredentialPatterns(result.normalized);
  if (credentials.length > 0) {
    result.issues.push({
      type: 'credential-exposure',
      severity: 'critical',
      message: 'Potential credential exposure in command',
      patterns: credentials
    });
    result.valid = false;
    result.riskLevel = 'critical';
  }
  
  // Check 6: URL/domain validation (for curl, wget, etc)
  if (result.normalized.match(/\b(curl|wget|Invoke-WebRequest)\b/i)) {
    const urlCheck = validateNetworkCommand(result.normalized);
    if (!urlCheck.valid) {
      result.issues.push({
        type: 'blocked-domain',
        severity: 'high',
        message: urlCheck.message,
        url: urlCheck.url
      });
      result.valid = false;
      result.riskLevel = 'high';
    }
  }
  
  return result;
}

function normalizeCommand(command) {
  // Convert to lowercase for comparison
  let normalized = command.toLowerCase();
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Expand ~ to home directory
  normalized = normalized.replace(/\b~\//g, process.env.HOME || process.env.USERPROFILE + '/');
  
  return normalized;
}

function checkBlockedCommands(command) {
  const found = [];
  for (const blocked of CONFIG.blockedCommands) {
    // Check for exact match or as start of command
    const pattern = new RegExp(`(^|\\s|;)${blocked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$|;|\\|)`, 'i');
    if (pattern.test(command)) {
      found.push(blocked);
    }
  }
  return found;
}

function detectPathTraversal(command) {
  const found = [];
  
  // Check for blocked paths
  for (const blocked of CONFIG.blockedPaths) {
    const expanded = expandPath(blocked);
    if (command.includes(expanded.toLowerCase())) {
      found.push(blocked);
    }
  }
  
  // Check for traversal patterns
  const traversalPattern = /\.\.[\/\\]/;
  if (traversalPattern.test(command)) {
    found.push('relative-traversal');
  }
  
  // Check for absolute paths outside workspace
  const absolutePattern = /^\/[a-z]+|^C:\\/i;
  if (absolutePattern.test(command)) {
    // Extract potential paths and check them
    const paths = command.match(/[\/~]?[\w\/.-]+/g) || [];
    for (const p of paths) {
      if (p.startsWith('/') || p.startsWith('C:')) {
        const resolved = path.resolve(p);
        const workspace = path.resolve(CONFIG.workspaceRoot);
        if (!resolved.startsWith(workspace)) {
          found.push(`absolute-outside-workspace: ${p}`);
        }
      }
    }
  }
  
  return found;
}

function expandPath(inputPath) {
  if (inputPath.startsWith('~/')) {
    return (process.env.HOME || process.env.USERPROFILE) + inputPath.slice(1);
  }
  return inputPath;
}

function detectCommandChaining(command) {
  const operators = [';', '&&', '||', '|', '$', '`', '$('];
  const found = [];
  
  for (const op of operators) {
    if (command.includes(op)) {
      found.push(op);
    }
  }
  
  return found;
}

function detectEnvVarAccess(command) {
  const patterns = [
    /\$[A-Z_]+/,           // $VAR
    /\$\{[A-Z_]+\}/,       // ${VAR}
    /%[A-Z_]+%/,           // %VAR% (Windows)
    /\$env:[A-Z_]+/i       // $env:VAR (PowerShell)
  ];
  
  const found = [];
  for (const pattern of patterns) {
    const matches = command.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  }
  
  return [...new Set(found)]; // Deduplicate
}

function detectCredentialPatterns(command) {
  const patterns = [
    /password\s*=\s*\S+/i,
    /token\s*=\s*\S+/i,
    /secret\s*=\s*\S+/i,
    /key\s*=\s*[a-zA-Z0-9]{20,}/i,
    /api[_-]?key\s*=\s*\S+/i,
    /auth[_-]?token\s*=\s*\S+/i,
    /bearer\s+[a-zA-Z0-9\-_]{20,}/i,
    /sk-[a-zA-Z0-9]{20,}/i,  // OpenAI key pattern
    /ghp_[a-zA-Z0-9]{20,}/i  // GitHub token pattern
  ];
  
  const found = [];
  for (const pattern of patterns) {
    if (pattern.test(command)) {
      found.push(pattern.toString());
    }
  }
  
  return found;
}

function validateNetworkCommand(command) {
  // Extract URLs from command
  const urlPattern = /(https?:\/\/[^\s\"]+)/gi;
  const urls = command.match(urlPattern) || [];
  
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.toLowerCase();
      
      // Check blocked domains
      for (const blocked of CONFIG.blockedDomains) {
        if (domain === blocked || domain.endsWith('.' + blocked)) {
          return {
            valid: false,
            message: `Blocked domain: ${domain}`,
            url: url
          };
        }
      }
      
      // Check private IP ranges (if blocking private IPs)
      if (isPrivateIP(parsed.hostname)) {
        return {
          valid: false,
          message: 'Private IP access blocked',
          url: url
        };
      }
      
    } catch (e) {
      return {
        valid: false,
        message: 'Invalid URL in command',
        url: url
      };
    }
  }
  
  return { valid: true };
}

function isPrivateIP(hostname) {
  // Simple check for common private IP patterns
  const privatePatterns = [
    /^127\./,           // Loopback
    /^10\./,            // Class A private
    /^172\.(1[6-9]|2[0-9]|3[01])\./,  // Class B private
    /^192\.168\./,      // Class C private
    /^169\.254\./,      // Link-local
    /^0\./,             // Current network
    /^fc00:/i,          // IPv6 unique local
    /^fe80:/i           // IPv6 link-local
  ];
  
  for (const pattern of privatePatterns) {
    if (pattern.test(hostname)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate file path access
 */
function validateFilePath(filePath, operation = 'read') {
  const result = {
    valid: true,
    resolved: null,
    issues: []
  };
  
  // Resolve to absolute path
  const resolved = path.resolve(filePath);
  result.resolved = resolved;
  
  // Check workspace boundary
  const workspace = path.resolve(CONFIG.workspaceRoot);
  if (!resolved.startsWith(workspace)) {
    result.issues.push({
      type: 'outside-workspace',
      severity: 'high',
      message: `Path outside workspace: ${resolved}`
    });
    result.valid = false;
  }
  
  // Check blocked paths
  for (const blocked of CONFIG.blockedPaths) {
    const expanded = expandPath(blocked);
    if (resolved.toLowerCase().startsWith(expanded.toLowerCase())) {
      result.issues.push({
        type: 'blocked-path',
        severity: 'critical',
        message: `Access to ${blocked} is blocked`
      });
      result.valid = false;
    }
  }
  
  // Check for traversal
  if (filePath.includes('..')) {
    result.issues.push({
      type: 'traversal-attempt',
      severity: 'high',
      message: 'Path contains traversal characters'
    });
    result.valid = false;
  }
  
  return result;
}

// Export API
module.exports = {
  validateCommand,
  validateFilePath,
  normalizeCommand,
  checkBlockedCommands,
  detectPathTraversal,
  detectCommandChaining,
  detectEnvVarAccess,
  detectCredentialPatterns,
  validateNetworkCommand,
  isPrivateIP,
  CONFIG
};

// CLI
if (require.main === module) {
  const command = process.argv.slice(2).join(' ') || 'ls -la';
  const result = validateCommand(command);
  console.log(JSON.stringify(result, null, 2));
}
