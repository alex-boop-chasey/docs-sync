## 2025-11-13 — Patch Series 1‑5: Mirror-Aware Compiler Foundation

### Patch 1 — Input Prompt & URL Handling
- Added an interactive prompt that captures a requested docs URL while logging whether the run stayed local or mirrored remotely.
- Hardened validation so blank, malformed, or unresolved inputs gracefully fall back to the bundled repo while still documenting the user intent.

### Patch 2 — wget Site Scraper Integration
- Introduced the `mirrors/` workspace plus helper utilities to normalize hostnames and choose the correct mirrored root.
- Wrapped wget execution with `runWget`, live console streaming, and structured log output so failures fall back to local files without crashing the run.

### Patch 3 — Finder “Save As” Dialog Integration
- Added an AppleScript-powered directory picker (with CLI fallback) so users can decide where mirrored assets are stored.
- Sanitized user input, persisted Finder selections, and logged the decision path (Finder success, cancel, or CLI fallback) for replayability.

### Patch 4 — Decoupled Output Targets
- Replaced hard-coded output paths with `updateOutputTargets()`, ensuring `compiled-docs.txt`, `compile-log.txt`, and the ZIP land inside the active target directory (either the repo or a mirrored site).
- Maintained a safe fallback to the script root when no override is supplied.

### Patch 5 — Modular Compiler & Archiver Stages
- Split the monolithic workflow into `compileDocs()` and `zipOutput()` so crawling, writing, and archiving can be re-run independently.
- Added per-run timing, reset counters, and richer summary logging to prepare for advanced flags (skip docs/force docs) planned in later patch sets.

## 2025-11-15 — Dependency & Runtime Stabilization

- Investigated repeated `ERR_MODULE_NOT_FOUND` failures for `jsdom`, `js-yaml`, and `archiver` even after local installs.
- Verified packages via `npm list` and direct `node --input-type=module` imports, leading to the discovery that launch context, not missing deps, blocked resolution.
- Planned instrumentation (`process.cwd()` / `import.meta.url` logging) to confirm when the runtime shifts away from `/Users/home/Development/Scripts/docs-sync`.

## 2025-11-15 — Launcher & Streaming Compiler Upgrades

- Added a CommonJS `init.js` shim so `node init.js` reliably dynamic-imports the ESM compiler and surfaces downstream failures with correct exit codes.
- Limited scraped runs to HTML/text payloads, preventing mirrored bundles and assets from flooding `compiled-docs.txt`.
- Converted compilation and zipping to streaming writers: files append directly to disk and the ZIP process streams the text file, eliminating the multi-GB in-memory buffers that previously caused heap OOMs.

## 2025-11-16 — Logging & Memory Guardrails

- Replaced the in-memory log accumulator with a buffered, file-backed logger so long runs no longer retain every message in RAM.
- Ensured every JSDOM instance calls `window.close()` after parsing to avoid detached DOM leaks.
- Captured run telemetry (`run1.txt`, `run2.txt`, `run5.txt`) to document successful multi-stage crawls after the streaming rewrite.

## 2025-11-17 — Patch 3.1 / 3.2 Rollback

- Removed `core/config/docs-sources.json` and the bootstrapping logic that attempted to preload it via environment variables.
- Dropped the `init.js` wget preflight guard; `ensureWgetAvailable()` now runs only inside the ESM workflow where error handling already exists.
- Restored the slimmer launcher so future patch-series work (3.3‑3.6) can rebuild the docs-source registry with a cleaner integration path.

## Next Steps

- Implement Patch 3.3 onward from `patches.txt` (automatic mirroring per project, logging structure, CLI flags) using the current stable base.
- Re-introduce docs-source metadata once the runtime flow for per-framework mirroring is finalized.
