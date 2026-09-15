# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Uren" is a Dutch-language hour-registration PWA (proof of concept): book time per type per day, with a timer, list/CSV export, and offline support. It is a **single-file vanilla JS app** with no framework, no dependencies, no package.json, no build step, and no tests. All UI strings are Dutch; keep new UI text in Dutch.

## Running locally

Service worker, install prompt and the File System Access API need a **secure context: https or localhost**. They do not work from `file://`, and not from plain http on a LAN address either (the `isHttp` gate in the code lets plain http through, but the browser then refuses to register the worker and the failure is swallowed). Serve the folder statically:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. There is nothing to build or lint. For a quick syntax check of the script inside `index.html`, cut it out between the `<script>` tags and run `node --check` on it.

## Deploying a new version

Upload the whole folder to any static host (README describes GitHub Pages / Azure Static Web Apps).

- **`index.html` only, no `VERSION` bump:** the service worker serves the cached copy and fetches the new one in the background, so users see the change on the *second* start after deploy. No toast appears, because the "Nieuwe versie klaar" toast only fires when `sw.js` itself changed.
- **Anything in `fonts/`, `icons/`, the manifest, or `sw.js`:** bump `VERSION` in `sw.js`, otherwise clients keep the old cached asset. The changed worker installs, old caches are dropped, users see the toast and get everything fresh at the next start.

Bumping `VERSION` for every release is the safe default.

## Files

- `index.html` – the entire app: CSS, markup, and one IIFE of JS (~750 lines of script).
- `sw.js` – service worker. Navigations to `./` or `./index.html`: cache first, refresh in background. Every other same-origin GET (font, icons, manifest, `handleiding.html`): cache first, network fallback, successful responses cached. Old caches deleted on activate.
- `manifest.webmanifest`, `fonts/`, `icons/` – PWA assets. The app makes **no external requests**; the font is local.
- `handleiding.html` – standalone end-user install/usage manual. Not linked from the app, not preloaded by the worker (it is cached after the first visit). It is the one file that loads Google Fonts externally.
- `README.md` – Dutch deployment and user-facing behaviour notes (storage model, Android linked file, iPhone limitations). Keep it in sync when behaviour changes; the timer rounding and default types are described there and in the manual.

## Architecture of `index.html`

### State

Two objects:

- `state` – persisted. Shape: `{ version, seedVersion, entries[], types[], savedAt, timer, linkedFileName, changesSinceFile, fileSavedAt, iosNoticeSeen }`.
  - Entry: `{ id, date: 'YYYY-MM-DD', typeId, minutes, note, created }`. Minutes created in the app are multiples of `STEP` (15), min 15, max `MAX_MIN` (24h); both the stepper (`setMinutes`) and the timer (`roundQuarter`) clamp. Entries from an imported backup are not validated per field, so do not assume the bounds hold for arbitrary data.
  - Type: `{ id, name, color, archived }`. Colors come from `PALETTE` (16 entries, one per default type). Types with bookings can only be archived, never deleted.
  - `timer`: `{ startedAt, typeId, date }` or null. Lives in `state` so it survives closing the app. Stopping rounds the elapsed time **up** to whole minutes and then **up** to the next quarter, min 0:15, capped at 24:00 (`roundQuarter`).
- `ui` – transient: current view, selected date, booking draft, edit mode, list filters, type editor fields, banner dismissal.

**Default types and migrations.** `DEFAULT_TYPES` seeds a fresh install. `upgradeSeed()` runs on *every* path that loads stored data (localStorage, IDB mirror, linked file, backup import) and steps `seedVersion` forward: v2 swapped four early placeholder types, v3 added five types to existing installs (matched by name, archived counts as present, inserted before "Overig", user-made types untouched). To add or rename defaults again: append to `DEFAULT_TYPES`, bump `SEED_VERSION`, and add a `from < N` step to `upgradeSeed`. Never edit an existing step.

### Storage layers (the part that needs care)

1. **localStorage** under `KEY` (`uren-poc-v1`) – read synchronously at startup.
2. **IndexedDB mirror** (db `uren-poc`, store `kv`, same key) – written on every persist. At startup `restoreFromMirror()` adopts it if its `savedAt` is newer. Losing either copy loses nothing.
3. **Linked file** (Chrome Android 132+/desktop, via File System Access API) – the user picks one `uren.json` once; the `FileSystemFileHandle` is stored in IDB under `fileHandle`. After every change the complete state is rewritten to it (`writeLinkedFile`, serialized through `writeChain`). At startup `loadLinkedFile()` reads the file and adopts it if newer (`adoptFileData`) **only when read/write permission is already granted** (`filePermission(false)` never prompts); otherwise the file is left alone until the next user tap triggers a write. Safari/iOS has no FSA; there the fallback is share-sheet export (`shareOrDownload`) and `changesSinceFile` counts unsaved bookings to nag the user.

Two save functions with different meaning:

- `persist()` – write localStorage + IDB only. Use for state that is not a booking change (timer start, `iosNoticeSeen`, changing the timer's type).
- `save()` – `persist()` plus write the linked file. Use after any change to entries or types.
- `markChanged()` increments `changesSinceFile`, which the UI shows as "N boekingen nog niet in een bestand". Call it **only before `save()` for booking changes** (add, edit, delete, timer stop). Type changes call `save()` alone; do not count them.

`writeLinkedFile()` is called from inside the user's tap (synchronously in the click handler, or right after an awaited file picker) because Chrome only allows the read/write permission prompt with user activation.

Conflict resolution between the local copies and the linked file is newest-wins by `savedAt`. The one exception is the explicit "Bestand terugzetten" import: the chosen backup replaces entries and types regardless of age, keeps device-bound fields (running timer, linked file name, iOS notice), runs `upgradeSeed`, and rewrites the linked file if one is attached.

### Rendering and events

- Rendering is imperative innerHTML templating, one function per region: `renderDay`, `renderBooking`, `renderTimer`, `renderList`, `renderTypes`, `renderStorage`, `renderBanner`, `renderDayNotice`; `renderAll()` does everything. Always escape user text with `esc()`.
- Almost all interaction goes through **one delegated `click` listener on `document`** that switches on `data-*` attributes of the nearest `<button>` (`data-view`, `data-type`, `data-preset`, `data-filter`, `data-edit`, `data-file-action`, `data-edit-type`, etc.). Add new actions there rather than attaching per-element listeners. Exceptions: a second delegated click listener handles `#installBtn` (the install prompt), delegated `input`/`keydown` listeners handle the type-name fields, and fixed elements (day nav, stepper, save/timer buttons, inputs) have direct listeners.
- Platform branching is by feature detection: `fsaAvailable()`, `isIOS`, `isStandalone()`, `isHttp`, `installPrompt`. `renderBanner()` walks a new device through install then file setup based on these; `renderStorage()` shows the same status under Types → Gegevens en opslag.

### Product rules baked into the code

- No default type: every booking requires an explicit type choice (`saveEntry` refuses without one, and the draft type resets after booking).
- Durations only in 15-minute steps via presets 15/30/45/60 or the ± stepper (long-press repeats after 600 ms).
- Deleting a **booking** is two-tap (arm, then confirm) via `ui.confirmDelete`. Deleting a **type** is a single tap, guarded only by "no bookings use it"; types with bookings are archived instead.
- CSV export uses `;` separator, `\r\n`, BOM, decimal comma, matching Dutch Excel.
