/**
 * FORTRESS ZAG - Model Connectors
 * 
 * Unified interface for multiple LLM providers.
 */

class ModelRouter {
  constructor(config = {}) {
    this.config = config;
    this.providers = {
      openai: new OpenAIConnector(config.openai),
      anthropic: new AnthropicConnector(config.anthropic),
      moonshot: new MoonshotConnector(config.moonshot),
      ollama: new OllamaConnector(config.ollama)
    };
  }
  
  async complete(messages, options = {}) {
    const provider = options.provider || this.config.defaultProvider || 'openai';
    const connector = this.providers[provider];
    
    if (!connector) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
    return await connector.complete(messages, options);
  }
  
  async completeWithFallback(messages, options = {}) {
    const providers = [options.provider, 'openai', 'anthropic', 'ollama'].filter(Boolean);
    
    for (const provider of providers) {
      try {
        const result = await this.complete(messages, { ...options, provider });
        return { ...result, provider };
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All providers failed');
  }
}

class OpenAIConnector {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4';
  }
  
  async complete(messages, options = {}) {
    const axios = require('axios');
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: options.model || this.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    
    return {
      text: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model
    };
  }
}

class AnthropicConnector {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.model = config.model || 'claude-3-sonnet-20240229';
  }
  
  async complete(messages, options = {}) {
    const axios = require('axios');
    const response = await axios.post(
      `${this.baseUrl}/messages`,
      {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.maxTokens || 2000
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 60000
      }
    );
    
    return {
      text: response.data.content[0].text,
      usage: response.data.usage,
      model: response.data.model
    };
  }
}

class MoonshotConnector {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.MOONSHOT_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.moonshot.cn/v1';
    this.model = config.model || 'moonshot-v1-8k';
  }
  
  async complete(messages, options = {}) {
    const axios = require('axios');
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: options.model || this.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    
    return {
      text: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model
    };
  }
}

class OllamaConnector {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama2';
  }
  
  async complete(messages, options = {}) {
    const axios = require('axios');
    // Convert messages to prompt format for Ollama
    const prompt = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n\n') + '\n\nAssistant:';
    
    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: options.model || this.model,
        prompt: prompt,
        stream: false
      },
      {
        timeout: 120000
      }
    );
    
    return {
      text: response.data.response,
      usage: {
        prompt_tokens: response.data.prompt_eval_count,
        completion_tokens: response.data.eval_count
      },
      model: this.model
    };
  }
}

module.exports = { ModelRouter, OpenAIConnector, AnthropicConnector, MoonshotConnector, OllamaConnector };
