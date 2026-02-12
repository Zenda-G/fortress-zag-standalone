/**
 * Bat-Gadget Registry
 * 
 * Manages active Bat-Gadgets and matches them to missions.
 * Part of the Bat-Gadget Protocol (BGP).
 */

const { BatGadgetLoader } = require('./bat-gadget-loader');

class BatGadgetRegistry {
  constructor(options = {}) {
    this.loader = new BatGadgetLoader(options);
    this.activeGadgets = new Set();
    this.availableTools = options.availableTools || [];
  }

  /**
   * Initialize and load all gadgets
   */
  initialize() {
    console.log('[BatGadgetRegistry] Initializing Bat-Gadget Protocol...');
    
    const gadgets = this.loader.loadAllGadgets();
    
    // Auto-equip gadgets that have all required tools
    for (const gadget of gadgets) {
      const validation = this.loader.validateGadget(gadget, this.availableTools);
      if (validation.valid) {
        this.equipGadget(gadget.name);
      } else {
        console.log(`[BatGadgetRegistry] Cannot equip ${gadget.name} - missing: ${validation.missing.join(', ')}`);
      }
    }

    console.log(`[BatGadgetRegistry] Equipped ${this.activeGadgets.size} gadgets`);
    return this.getEquippedGadgets();
  }

  /**
   * Equip a gadget by name
   */
  equipGadget(gadgetName) {
    const gadget = this.loader.getGadget(gadgetName);
    if (!gadget) {
      console.warn(`[BatGadgetRegistry] Gadget not found: ${gadgetName}`);
      return false;
    }

    this.activeGadgets.add(gadgetName);
    console.log(`[BatGadgetRegistry] Equipped: ${gadgetName}`);
    return true;
  }

  /**
   * Unequip a gadget
   */
  unequipGadget(gadgetName) {
    this.activeGadgets.delete(gadgetName);
    console.log(`[BatGadgetRegistry] Unequipped: ${gadgetName}`);
  }

  /**
   * Get all equipped gadgets
   */
  getEquippedGadgets() {
    const gadgets = [];
    for (const name of this.activeGadgets) {
      const gadget = this.loader.getGadget(name);
      if (gadget) gadgets.push(gadget);
    }
    return gadgets;
  }

  /**
   * Get equipped gadgets as system prompt addition
   */
  getSystemPromptAdditions() {
    const sections = [];
    
    for (const name of this.activeGadgets) {
      const prompt = this.loader.getGadgetPrompt(name);
      if (prompt) {
        sections.push(prompt);
      }
    }

    if (sections.length === 0) return '';

    return `
# Utility Belt - Equipped Bat-Gadgets

The following gadgets are equipped on your Utility Belt and ready for use:

${sections.join('\n---\n')}
`;
  }

  /**
   * Find best gadget for a mission based on keywords/tags
   */
  findGadgetForMission(mission) {
    const missionLower = mission.toLowerCase();
    const scores = new Map();

    for (const name of this.activeGadgets) {
      const gadget = this.loader.getGadget(name);
      if (!gadget) continue;

      let score = 0;
      
      // Check tags
      for (const tag of gadget.metadata.tags) {
        if (missionLower.includes(tag.toLowerCase())) {
          score += 2;
        }
      }

      // Check description
      if (gadget.metadata.description) {
        const words = gadget.metadata.description.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 3 && missionLower.includes(word)) {
            score += 1;
          }
        }
      }

      // Check name
      if (missionLower.includes(gadget.metadata.name.toLowerCase())) {
        score += 3;
      }

      if (score > 0) {
        scores.set(name, score);
      }
    }

    // Return highest scoring gadget
    let bestGadget = null;
    let bestScore = 0;
    
    for (const [name, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestGadget = this.loader.getGadget(name);
      }
    }

    return bestGadget;
  }

  /**
   * List all available gadgets (equipped and unequipped)
   */
  listAllGadgets() {
    const all = this.loader.loadAllGadgets();
    return all.map(gadget => ({
      name: gadget.name,
      description: gadget.metadata.description,
      equipped: this.activeGadgets.has(gadget.name),
      tags: gadget.metadata.tags,
      tools: gadget.metadata.tools
    }));
  }

  /**
   * Get gadgets that can be equipped (have required tools)
   */
  getEquippableGadgets() {
    const all = this.loader.loadAllGadgets();
    const equippable = [];

    for (const gadget of all) {
      if (!this.activeGadgets.has(gadget.name)) {
        const validation = this.loader.validateGadget(gadget, this.availableTools);
        if (validation.valid) {
          equippable.push(gadget);
        }
      }
    }

    return equippable;
  }

  /**
   * Check if a gadget is equipped
   */
  isEquipped(gadgetName) {
    return this.activeGadgets.has(gadgetName);
  }

  /**
   * Get gadget details
   */
  getGadgetDetails(gadgetName) {
    const gadget = this.loader.getGadget(gadgetName);
    if (!gadget) return null;

    return {
      ...gadget,
      equipped: this.activeGadgets.has(gadgetName),
      validation: this.loader.validateGadget(gadget, this.availableTools)
    };
  }

  /**
   * Get registry status
   */
  getStatus() {
    return {
      totalLoaded: this.loader.cache.size,
      equipped: this.activeGadgets.size,
      availableTools: this.availableTools.length,
      gadgets: Array.from(this.activeGadgets)
    };
  }
}

module.exports = { BatGadgetRegistry };