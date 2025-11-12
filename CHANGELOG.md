## 2025-11-13 — Universal URL + Local Compiler Integration (Patches 1‑5)

### Patch 1 — Input Prompt and URL Handling
- Replaced the hard-coded repo root with an interactive URL prompt, capturing `targetUrl` for later steps.
- Added validation/fallback logic so blank or invalid input defaults to the local repo while still logging the user’s request.
- Ensured downstream logging records when a URL was provided, even if the workflow later falls back to local files.

### Patch 2 — Wget Site Scraper Integration
- Added `child_process` spawning plus mirror workspace setup under `scripts/sync-docs/mirrors`.
- Implemented `ensureWgetAvailable`, wget argument construction, and `runWget` with live console output and structured log entries.
- Added helpers to normalize mirror folder names, detect the appropriate host subdirectory, and gracefully fall back when wget fails.

### Patch 3 — Finder “Save As” Dialog Integration
- Introduced AppleScript + CLI fallback prompts that let users pick where mirrored files should live.
- Added sanitization helpers (`escapeForAppleScriptString`, `runAppleScript`, `promptUserForDirectoryInput`, `promptUserForSavePath`) and persisted the chosen directory for the wget run.
- Logged picker results (Finder selection, default fallback, or failures) so the compile log tells the full story of where assets were stored.

### Patch 4 — Decouple Compiler from Script Directory
- Replaced static output paths with `updateOutputTargets()`, which redirects compiled artifacts, logs, and archives into the active `targetDir`.
- Ensured every workflow (URL mirror or local path) updates the output destinations before crawling so results land alongside the selected source tree.
- Kept the legacy `scripts/sync-docs` layout as a fallback by resolving to `defaultSourceDir` only when necessary.

### Patch 5 — Modular Function Split
- Refactored the monolithic `main()` into reusable stages: `compileDocs(sourceDir)` and `zipOutput(content)` now own traversal/write and archiving respectively.
- Added timing, reset counters per run, and richer log messages per stage for easier testing and reuse.
- Simplified `main()` to orchestrate prompts → wget download → compilation → zipping, making future patches (skip wget, metadata, config) easier to slot in.
