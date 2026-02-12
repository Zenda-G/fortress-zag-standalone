/**
 * Bat-Gadget Protocol (BGP) Module Index
 * 
 * Main entry point for the Bat-Gadget Protocol.
 * Loads and manages specialized capabilities from GADGET.md files.
 */

const { BatGadgetLoader } = require('./bat-gadget-loader');
const { BatGadgetRegistry } = require('./bat-gadget-registry');

module.exports = {
  BatGadgetLoader,
  BatGadgetRegistry
};