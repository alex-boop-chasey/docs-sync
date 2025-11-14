#!/usr/bin/env node

/**
 * Entry point shim so `node init.js` runs the ESM compiler script.
 * Uses dynamic import to preserve native ESM execution semantics.
 */

const path = require("path");
const { pathToFileURL } = require("url");

async function main() {
  const scriptPath = path.resolve(__dirname, "sync-docs-universal.mjs");
  try {
    await import(pathToFileURL(scriptPath).href);
  } catch (err) {
    console.error("Failed to launch sync-docs-universal.mjs:", err);
    process.exitCode = 1;
  }
}

main();
