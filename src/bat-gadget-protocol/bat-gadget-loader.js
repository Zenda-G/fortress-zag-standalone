/**
 * Bat-Gadget Loader Module
 * 
 * Loads and manages Bat-Gadgets from GADGET.md files.
 * Part of the Bat-Gadget Protocol (BGP).
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

class BatGadgetLoader {
  constructor(options = {}) {
    this.gadgetsDir = options.gadgetsDir || './bat-gadgets';
    this.cache = new Map();
    this.watchers = new Map();
  }

  /**
   * Load all available gadgets from gadgets directory
   */
  loadAllGadgets() {
    const gadgets = [];
    
    if (!fs.existsSync(this.gadgetsDir)) {
      console.log(`[BatGadgetLoader] Gadgets directory not found: ${this.gadgetsDir}`);
      return gadgets;
    }

    const entries = fs.readdirSync(this.gadgetsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const gadget = this.loadGadget(entry.name);
        if (gadget) {
          gadgets.push(gadget);
        }
      }
    }

    console.log(`[BatGadgetLoader] Loaded ${gadgets.length} gadgets`);
    return gadgets;
  }

  /**
   * Load a single gadget by name
   */
  loadGadget(gadgetName) {
    const gadgetPath = path.join(this.gadgetsDir, gadgetName, 'GADGET.md');
    
    if (!fs.existsSync(gadgetPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(gadgetPath, 'utf-8');
      const gadget = this.parseGadget(gadgetName, content);
      
      if (gadget) {
        this.cache.set(gadgetName, gadget);
      }
      
      return gadget;
    } catch (error) {
      console.error(`[BatGadgetLoader] Error loading gadget ${gadgetName}:`, error.message);
      return null;
    }
  }

  /**
   * Parse GADGET.md content
   * Format: YAML frontmatter + Markdown content
   */
  parseGadget(name, content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      console.warn(`[BatGadgetLoader] Invalid GADGET.md format for ${name}`);
      return null;
    }

    try {
      const metadata = yaml.parse(match[1]);
      const body = match[2].trim();

      return {
        name: name,
        metadata: {
          name: metadata.name || name,
          description: metadata.description || '',
          version: metadata.version || '1.0.0',
          author: metadata.author || '',
          tags: metadata.tags || [],
          tools: metadata.tools || [],
          models: metadata.models || [],
          requires: metadata.requires || []
        },
        content: body,
        path: path.join(this.gadgetsDir, name),
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[BatGadgetLoader] Error parsing YAML for ${name}:`, error.message);
      return null;
    }
  }

  /**
   * Get cached gadget
   */
  getGadget(gadgetName) {
    return this.cache.get(gadgetName);
  }

  /**
   * Find gadgets by tag
   */
  findByTag(tag) {
    const results = [];
    for (const [name, gadget] of this.cache) {
      if (gadget.metadata.tags.includes(tag)) {
        results.push(gadget);
      }
    }
    return results;
  }

  /**
   * Find gadgets by tool requirement
   */
  findByTool(toolName) {
    const results = [];
    for (const [name, gadget] of this.cache) {
      if (gadget.metadata.tools.includes(toolName)) {
        results.push(gadget);
      }
    }
    return results;
  }

  /**
   * Check if all required tools are available
   */
  validateGadget(gadget, availableTools = []) {
    const missing = gadget.metadata.tools.filter(
      tool => !availableTools.includes(tool)
    );
    
    return {
      valid: missing.length === 0,
      missing: missing
    };
  }

  /**
   * Get gadget as system prompt addition
   */
  getGadgetPrompt(gadgetName) {
    const gadget = this.cache.get(gadgetName);
    if (!gadget) return null;

    return `
## Bat-Gadget: ${gadget.metadata.name}

${gadget.metadata.description}

### Usage
${gadget.content}
`;
  }

  /**
   * Reload a gadget (for development)
   */
  reloadGadget(gadgetName) {
    this.cache.delete(gadgetName);
    return this.loadGadget(gadgetName);
  }

  /**
   * Watch gadgets directory for changes
   */
  watch(callback) {
    if (!fs.existsSync(this.gadgetsDir)) return;

    const watcher = fs.watch(this.gadgetsDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('GADGET.md')) {
        const gadgetName = path.dirname(filename).split(path.sep)[0];
        console.log(`[BatGadgetLoader] Gadget changed: ${gadgetName}`);
        this.reloadGadget(gadgetName);
        if (callback) callback(gadgetName, eventType);
      }
    });

    this.watchers.set('main', watcher);
  }

  /**
   * Stop watching
   */
  unwatch() {
    for (const [name, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
  }

  /**
   * Get all loaded gadgets summary
   */
  getSummary() {
    const summary = [];
    for (const [name, gadget] of this.cache) {
      summary.push({
        name: gadget.metadata.name,
        description: gadget.metadata.description,
        tags: gadget.metadata.tags,
        tools: gadget.metadata.tools
      });
    }
    return summary;
  }
}

module.exports = { BatGadgetLoader };