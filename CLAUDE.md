# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Uren" is a Dutch-language hour-registration PWA (proof of concept): book time per type per day, with a timer, list/CSV export, and offline support. Three views: Dag (booking), Lijst (report/CSV), and a gear tab Instellingen (storage, backups, install). It is a **single-file vanilla JS app** with no framework, no dependencies, no package.json, no build step, and no tests. All UI strings are Dutch; keep new UI text in Dutch.

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

Bumping `VERSION` in `sw.js` and `APP_VERSION` in `index.html` for every release is the safe default.

## Files

- `index.html` – the entire app: CSS, markup, and one IIFE of JS (~750 lines of script).
- `sw.js` – service worker. Navigations to `./` or `./index.html`: cache first, refresh in background. Every other same-origin GET (font, icons, manifest, `handleiding.html`): cache first, network fallback, successful responses cached. Old caches deleted on activate.
- `manifest.webmanifest`, `fonts/`, `icons/` – PWA assets. The app makes **no external requests**; the font is local. `icons/logo.png` (90 px, transparent) is the hospital logo used in the header and the splash; the launcher icons are a separate bar motif on the brand purple because the logo source is too small to scale to 512 px. Replace them when a vector or ≥1024 px logo is available.
- `handleiding.html` – standalone end-user install/usage manual. Not linked from the app, not preloaded by the worker (it is cached after the first visit). It is the one file that loads Google Fonts externally.
- `README.md` – plain-Dutch explanation for users and the pilot owner: what the app does, how to install it on Android/iPhone, where the hours live and how backups work, plus a short admin section (https hosting, version bumps, file format). Keep it in sync when user-visible behaviour changes; the timer rounding and the storage rules are described there and in the manual.

## Architecture of `index.html`

### State

Two objects:

- `state` – persisted. Shape: `{ version, seedVersion, entries[], types[], savedAt, timer, linkedFileName, changesSinceFile, fileSavedAt, iosNoticeSeen }`.
  - Entry: `{ id, date: 'YYYY-MM-DD', typeId, minutes, note, created, updated? }`. `created`/`updated` are epoch ms; `updated` is set on edit. Minutes created in the app are multiples of `STEP` (15), min 15, max `MAX_MIN` (24h); both the stepper (`setMinutes`) and the timer (`roundQuarter`) clamp. Entries from an imported backup are not validated per field, so do not assume the bounds hold for arbitrary data.
  - Type: `{ id, name, color, archived, created?, updated? }`. Colors come from `PALETTE` (16 entries, one per default type). **Users cannot add, edit, archive or delete types**; the set is fixed in `DEFAULT_TYPES` and changed only through seed migrations. `archived` is still honoured when rendering for data that predates this.
  - `timer`: `{ startedAt, typeId, date }` or null. Lives in `state` so it survives closing the app. Stopping rounds the elapsed time **up** to whole minutes and then **up** to the next quarter, min 0:15, capped at 24:00 (`roundQuarter`).
- `ui` – transient: current view, selected date, booking draft, edit mode, list filters, snapshot-restore arming, banner dismissal.

**Default types and migrations.** `DEFAULT_TYPES` seeds a fresh install. `upgradeSeed()` runs on *every* path that loads stored data (localStorage, IDB mirror, linked file, backup import) and steps `seedVersion` forward: v2 swapped four early placeholder types, v3 added five types to existing installs (matched by name, archived counts as present, inserted before "Overig", user-made types untouched). To add or rename defaults again: append to `DEFAULT_TYPES`, bump `SEED_VERSION`, and add a `from < N` step to `upgradeSeed`. Never edit an existing step.

### Storage layers (the part that needs care)

1. **localStorage** under `KEY` (`uren-poc-v1`) – read synchronously at startup.
2. **IndexedDB mirror** (db `uren-poc`, store `kv`, same key) – written on every persist. At startup `restoreFromMirror()` adopts it if its `savedAt` is newer. Losing either copy loses nothing.
3. **Linked file** (Chrome Android 132+/desktop, via File System Access API) – the user picks one `uren.json` once; the `FileSystemFileHandle` is stored in IDB under `fileHandle`. After every change the complete state is rewritten to it (`writeLinkedFile`, serialized through `writeChain`). At startup `loadLinkedFile()` reads the file and adopts its entries/types if newer (`adoptFileData`, device-bound fields stay) **only when read/write permission is already granted** (`filePermission(false)` never prompts); otherwise the file is left alone until the next user tap triggers a write. Safari/iOS has no FSA; there the fallback is share-sheet export (`shareOrDownload`) and `changesSinceFile` counts unsaved bookings to nag the user.
4. **Snapshots** – `saveSnapshot()` stores `{ at, savedAt, seedVersion, entries, types }` in the same IDB store under `snap:YYYY-MM-DD` (once per day at startup, `dailySnapshot`) or `snap:YYYY-MM-DDTHH-MM-SS-terugzetten` (right before every restore). `loadSnapshots()` prunes anything older than `SNAP_DAYS` and fills the in-memory `snapshots` list that `renderStorage` shows with a two-tap "Terugzetten" button (`ui.confirmSnap`, `data-snap`). This is an undo for mistakes on the same device, not a backup.

The export/share file is always named `uren.json` (`fileName()`), on every platform, so iOS Files offers "Vervangen" and there is one file. `fileJson()` adds `exportedAt` and `app` (with `APP_VERSION`) on top of `state`; those extra keys are dropped again on import because `replaceState`/`adoptFileData` only take `entries`, `types`, `seedVersion` (and `savedAt`/`fileSavedAt` for the linked file). Bump `APP_VERSION` on every release; it is shown under Gegevens en opslag.

Two save functions with different meaning:

- `persist()` – write localStorage + IDB only. Use for state that is not a booking change (timer start, `iosNoticeSeen`, changing the timer's type).
- `save()` – `persist()` plus write the linked file. Use after any change to entries or types.
- `markChanged()` increments `changesSinceFile`, which the UI shows as "N boekingen nog niet in een bestand". Call it **only before `save()` for booking changes** (add, edit, delete, timer stop). Type changes call `save()` alone; do not count them.

`writeLinkedFile(force)` is called from inside the user's tap (synchronously in the click handler, or right after an awaited file picker) because Chrome only allows the read/write permission prompt with user activation. Chrome on Android re-asks edit permission on a stored handle at **every page load, installed or not** (observed in the pilot); the app cannot make it persist. Mitigation: it asks on its own at most once per load (`permAsked`) and only when the file is older than `FILE_MAX_AGE` (24 h); otherwise the write is deferred (`fileDeferred`, hours stay in app storage, day notice shows 'volgt bij een volgende boeking' with a Nu bijwerken button). Once granted in a load, all writes are free. After a refusal, writes fail quietly into `fileError = 'permission'` and only Opnieuw / Nu bijwerken (`force = true`) prompt again. The permission decision and request start synchronously inside the tap; do not move them behind other awaits.

Conflict resolution between the local copies and the linked file is newest-wins by `savedAt`. The exception is an explicit restore, both "Bestand terugzetten" and a snapshot: `replaceState(data, source)` first takes a `-terugzetten` snapshot, then replaces entries and types regardless of age, keeps device-bound fields (running timer, linked file name, iOS notice), runs `upgradeSeed`, and rewrites the linked file if one is attached. With `source === 'file'` and no linked file the restored data counts as saved; a snapshot restore counts as an unsaved change. Route every future "replace everything" path through `replaceState`.

### Look and feel

- Colours are CSS custom properties on `:root` in `index.html`. Hospital brand: primary `#9B51E0` (`--accent`, primary buttons, selected preset, focus of attention), secondary `#0693E3` (`--info`, informational banners and focus ring). Text on light backgrounds uses the darker `--accent-text`/`--info-text` because the raw brand colours fall short of 4.5:1. Warning/error tints derive from `#FCB900`/`#FF6900` (`--warn-*`, `--err-*`). Neutrals are cool light greys. `PALETTE` (category colours) is deliberately independent of the brand colours; do not restyle it when the brand changes.
- `handleiding.html` carries its own copy of the palette; keep it in sync.
- A `#splash` overlay (logo on `--bg`) is in the markup from first paint and fades after the first render (~650 ms total); with `prefers-reduced-motion` it is removed at once. The manifest `background_color`/`theme_color` match `--bg` so the Android system splash blends into it.

### Rendering and events

- Rendering is imperative innerHTML templating, one function per region: `renderDay`, `renderBooking`, `renderTimer`, `renderList`, `renderSettings` (which is just `renderStorage`), `renderBanner`, `renderDayNotice`; `renderAll()` does everything. Always escape user text with `esc()`.
- Visibility is toggled with the `hidden` attribute everywhere; the global `[hidden]{display:none!important}` rule makes that win over display classes such as `.range`/`.quiet` (flex). Do not toggle `style.display`.
- Type chips live in a horizontal two-row `.strip > .chips` (booking panel and list filter); chip text is in `.chip-label` with ellipsis, `scroll-padding` keeps the first chip aligned with the gutter, and `updateStripFade()` handles the right-edge fade for both strips (`--fade` sets the fade colour per background).
- Almost all interaction goes through **one delegated `click` listener on `document`** that switches on `data-*` attributes of the nearest `<button>` (`data-view`, `data-type`, `data-preset`, `data-filter`, `data-edit`, `data-file-action`, `data-edit-type`, etc.). Add new actions there rather than attaching per-element listeners. Exceptions: a second delegated click listener handles `#installBtn` (the install prompt), and fixed elements (day nav, stepper, save/timer buttons, inputs) have direct listeners.
- Platform branching is by feature detection: `fsaAvailable()`, `isIOS`, `isStandalone()`, `isHttp`, `installPrompt`. `renderBanner()` walks a new device through install then file setup based on these; `renderStorage()` shows the same status under the gear tab (Instellingen) → Gegevens en opslag.

### Product rules baked into the code

- No default type: every booking requires an explicit type choice (`saveEntry` refuses without one, and the draft type resets after booking).
- Durations only in 15-minute steps via presets 15/30/45/60 or the ± stepper (long-press repeats after 600 ms).
- Deleting a **booking** is two-tap (arm, then confirm) via `ui.confirmDelete`; restoring a **snapshot** is two-tap via `ui.confirmSnap`. Armed buttons use the `.ghost.is-armed` style.
- CSV export uses `;` separator, `\r\n`, BOM, decimal comma, matching Dutch Excel, with `Aangemaakt`/`Gewijzigd` timestamp columns at the end.
