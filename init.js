#!/usr/bin/env node

/**
 * Entry point shim so `node init.js` runs the ESM compiler script.
 * Uses dynamic import to preserve native ESM execution semantics.
 */

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

function bootstrapDocsSources() {
  const configPath = path.resolve(__dirname, "core/config/docs-sources.json");
  process.env.DOCS_SOURCES_PATH = configPath;

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    globalThis.rebirthDocsSources = parsed;
    process.env.DOCS_SOURCES_JSON = raw;
    console.log(`📚 Loaded docs sources from ${configPath}`);
  } catch (err) {
    console.warn(
      `⚠️  Unable to load docs sources config at ${configPath}: ${err.message}`
    );
  }
}

async function main() {
  const scriptPath = path.resolve(__dirname, "sync-docs-universal.mjs");
  bootstrapDocsSources();
  try {
    await import(pathToFileURL(scriptPath).href);
  } catch (err) {
    console.error("Failed to launch sync-docs-universal.mjs:", err);
    process.exitCode = 1;
  }
}

main();
