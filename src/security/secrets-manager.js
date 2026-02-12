/**
 * Two-Tier Secrets Manager
 * 
 * SECRETS:     Filtered from LLM's bash subprocess (API keys, tokens)
 * LLM_SECRETS: Accessible to LLM (browser logins, skill API keys)
 */

const { execSync } = require('child_process');

class SecretsManager {
  constructor() {
    this.secrets = {};      // Filtered secrets
    this.llmSecrets = {};   // LLM-accessible secrets
    this.filteredKeys = [
      'GITHUB_TOKEN',
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY',
      'GOOGLE_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'TELEGRAM_BOT_TOKEN',
      'MOONSHOT_API_KEY',
      'DISCORD_BOT_TOKEN',
      'SLACK_BOT_TOKEN',
      'NOTION_API_KEY',
      'LINEAR_API_KEY',
      // Add more protected keys here
    ];
  }

  /**
   * Load secrets from base64-encoded JSON
   */
  loadFromEnv() {
    // Load SECRETS (filtered from LLM)
    if (process.env.SECRETS) {
      try {
        const decoded = Buffer.from(process.env.SECRETS, 'base64').toString('utf-8');
        this.secrets = JSON.parse(decoded);
      } catch (e) {
        console.error('Failed to decode SECRETS:', e.message);
      }
    }

    // Load LLM_SECRETS (accessible to LLM)
    if (process.env.LLM_SECRETS) {
      try {
        const decoded = Buffer.from(process.env.LLM_SECRETS, 'base64').toString('utf-8');
        this.llmSecrets = JSON.parse(decoded);
      } catch (e) {
        console.error('Failed to decode LLM_SECRETS:', e.message);
      }
    }

    return this;
  }

  /**
   * Get a secret (for system use only)
   */
  getSecret(key) {
    return this.secrets[key] || this.llmSecrets[key];
  }

  /**
   * Get an LLM-accessible secret
   */
  getLLMSecret(key) {
    return this.llmSecrets[key];
  }

  /**
   * Get all LLM-accessible secrets (for injecting into agent context)
   */
  getAllLLMSecrets() {
    return { ...this.llmSecrets };
  }

  /**
   * Export secrets as environment variables
   * For use in system processes (not LLM bash)
   */
  exportForSystem() {
    const allSecrets = { ...this.secrets, ...this.llmSecrets };
    return allSecrets;
  }

  /**
   * Export environment for LLM bash subprocess
   * Filters out protected secrets
   */
  exportForLLM() {
    const env = { ...process.env };
    
    // Remove filtered secrets
    for (const key of this.filteredKeys) {
      delete env[key];
    }
    
    // Add LLM-accessible secrets
    for (const [key, value] of Object.entries(this.llmSecrets)) {
      env[key] = value;
    }
    
    // Clear the base64 encoded versions
    delete env.SECRETS;
    delete env.LLM_SECRETS;
    
    return env;
  }

  /**
   * Check if a key is filtered
   */
  isFiltered(key) {
    return this.filteredKeys.includes(key);
  }

  /**
   * Add a key to the filter list
   */
  addFilteredKey(key) {
    if (!this.filteredKeys.includes(key)) {
      this.filteredKeys.push(key);
    }
    return this;
  }

  /**
   * Validate secrets are present
   */
  validate() {
    const required = ['GITHUB_TOKEN'];
    const missing = required.filter(key => !this.secrets[key] && !process.env[key]);
    
    if (missing.length > 0) {
      console.warn('Missing required secrets:', missing.join(', '));
      return false;
    }
    
    return true;
  }
}

// Extension for Pi to filter secrets from bash subprocess
const envSanitizerExtension = {
  name: 'env-sanitizer',
  async beforeToolCall(toolName, params, context) {
    // If exec tool, sanitize environment
    if (toolName === 'exec' || toolName === 'bash') {
      const secretsManager = context.secretsManager;
      if (secretsManager) {
        // Mark that this exec should use filtered env
        params._useFilteredEnv = true;
      }
    }
    return params;
  }
};

module.exports = {
  SecretsManager,
  envSanitizerExtension
};