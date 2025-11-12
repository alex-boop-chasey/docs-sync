/*
============================================================
🧭 UNIVERSAL DOCUMENTATION COMPILER — SETUP INSTRUCTIONS
============================================================

📁 1. SCRIPT LOCATION
------------------------------------------------------------
- Place this script inside the following folder structure:

  /your-repo/
  ├── scripts/
  │   └── sync-docs/
  │       └── sync-docs-universal.mjs
  ├── src/
  ├── docs/
  └── package.json

- The script automatically steps two levels up (to the repo
  root) and crawls all folders and subfolders from there.

- The compiled output files will be written into:
      /scripts/sync-docs/

------------------------------------------------------------
📦 2. INSTALL DEV DEPENDENCIES
------------------------------------------------------------
Run these commands in /scripts/sync-docs:

    npm init -y
    npm install jsdom js-yaml archiver
    npm pkg set type=module

------------------------------------------------------------
▶️ 3. RUNNING
------------------------------------------------------------
From repo root:
    node scripts/sync-docs/sync-docs-universal.mjs

or from /scripts/sync-docs:
    node sync-docs-universal.mjs

------------------------------------------------------------
💡  NOTES
------------------------------------------------------------
- No folder creation—ensure /scripts/sync-docs exists.
- Safe to re-run; overwrites existing outputs.
============================================================
*/

import fs from "fs";
import path from "path";
import zlib from "zlib";
import readline from "readline";
import { JSDOM } from "jsdom";
import yaml from "js-yaml";
import archiver from "archiver";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const defaultSourceDir = path.resolve(__dirname, "../..");

// outputs live beside the script
const outputDir = __dirname;
const outputFile = path.join(outputDir, "compiled-docs.txt");
const logFile = path.join(outputDir, "compile-log.txt");
const zipFile = `${outputFile}.zip`; // Changed from gzipFile to zipFile

const includeExts = [
  ".md", ".mdx", ".html", ".htm", ".txt",
  ".js", ".jsx", ".ts", ".tsx", ".json",
  ".yaml", ".yml"
];

const excludeDirs = [
  "node_modules", ".git", "dist", "build",
  ".next", ".astro", ".cache"
];

const skipExts = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
  ".mp4", ".mov", ".avi", ".zip", ".pdf",
  ".woff", ".woff2", ".ttf", ".eot", ".ico"
];

let processed = 0;
let skipped = 0;
let targetUrl = "";
const logEntries = [];

function promptUserForURL() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(
      "Enter the URL to scrape (e.g., https://developers.openai.com or GitHub repo URL): ",
      answer => {
        rl.close();
        resolve(answer.trim());
      }
    );
  });
}

function resolveSourceDirectory(userInput) {
  if (userInput) {
    try {
      const candidate = path.resolve(userInput);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      // swallow and fall through to default
    }
    console.warn(
      "⚠️  Provided input does not map to a local directory yet; defaulting to the script repo root."
    );
  }

  return defaultSourceDir;
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function extractReadableContent(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".html" || ext === ".htm") {
    const dom = new JSDOM(content);
    const document = dom.window.document;
    document.querySelectorAll("nav, footer, header, menu, aside").forEach(el => el.remove());
    document.querySelectorAll("iframe[src*='youtube']").forEach(el => {
      const src = el.getAttribute("src");
      el.replaceWith(`[YouTube video link]: ${src}`);
    });
    return document.body?.textContent?.trim() ?? "";
  }

  if (ext === ".yaml" || ext === ".yml") {
    try {
      const parsed = yaml.load(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }

  if (ext === ".json") {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }

  return content;
}

function crawlDir(dir, output, rootDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) continue;
      crawlDir(fullPath, output, rootDir);
    } else {
      const ext = path.extname(entry.name).toLowerCase();

      if (skipExts.includes(ext)) {
        skipped++;
        logEntries.push(`⏭ Skipped: ${relPath}`);
        continue;
      }

      if (includeExts.includes(ext)) {
        const content = safeRead(fullPath);
        const cleaned = extractReadableContent(fullPath, content);

        if (typeof cleaned === "string" && cleaned.trim().length > 0) {
          output.push(
            `\n============================================\nFILE: ${relPath}\n============================================\n${cleaned}\n`
          );
          processed++;
          console.log(`✅ Processed: ${relPath}`);
          logEntries.push(`✅ Processed: ${relPath}`);
        } else {
          skipped++;
          logEntries.push(`⏭ Skipped (empty or invalid): ${relPath}`);
        }
      } else {
        skipped++;
        logEntries.push(`⏭ Skipped (ext): ${relPath}`);
      }
    }
  }
}

async function main() {
  console.log("🧭 Starting universal docs compile...");
  targetUrl = await promptUserForURL();
  if (!targetUrl) {
    console.log("ℹ️  No URL entered; continuing with local default path.");
  } else {
    console.log(`🌐 Target captured: ${targetUrl}`);
  }

  const repoRoot = resolveSourceDirectory(targetUrl);
  const output = [];
  const start = Date.now();

  crawlDir(repoRoot, output, repoRoot);

  fs.writeFileSync(outputFile, output.join("\n"));
  const archive = archiver("zip", { zlib: { level: 9 } }); // Changed to use archiver for ZIP
  const outputStream = fs.createWriteStream(zipFile);
  archive.pipe(outputStream);
  archive.append(output.join("\n"), { name: "compiled-docs.txt" }); // Add content to ZIP
  archive.finalize();

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const summary = `
🎉 Compilation complete!
✅ Files processed: ${processed}
⏭ Files skipped: ${skipped}
🕒 Duration: ${duration}s
📝 Output: ${outputFile}
🗜  Zipped: ${zipFile}
`;

  console.log(summary);
  const targetDetails = targetUrl
    ? `🌐 Requested URL: ${targetUrl}`
    : "🌐 Requested URL: (not provided)";
  fs.writeFileSync(logFile, [summary, targetDetails, ...logEntries].join("\n"));
}

main().catch(err => {
  console.error("❌ Compilation failed.", err);
  process.exit(1);
});
