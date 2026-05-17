# Preview Asset Audit

**Generated:** 2026-05-17  
**Preview root:** `tg-limitless-preview-repo/`  
**Entry:** `index.html` (Integrated Technology Candidate v1.1)

## Verdict

**`PREVIEW_ASSETS_PARTIAL_WITH_MISSING_REFERENCES`**

| Scope | Status |
|-------|--------|
| Primary page load (HTML + CSS + ES module graph + harness deps) | **COMPLETE** |
| Integrated candidate path + integrated SW shell | **COMPLETE** |
| Optional lane SHA probes (other candidate HTML pages) | **MISSING** (intentional) |
| Marathon / Mega SW offline shells (other candidate HTML) | **MISSING** (intentional) |
| GitHub Pages primary preview | **READY TO PUSH** |

## Detected References (from `index.html`)

### Head / static links

| Reference | Resolved | Notes |
|-----------|----------|-------|
| `./favicon.svg` | Yes | Copied to root |
| `./tg-mega-candidate.webmanifest` | Yes | Copied; `start_url` points to mega candidate HTML (not in preview) |
| `./src/tg-limitless-immersive-ui.css` | Yes | |
| `./src/tg-limitless-ux-acceptance.css` | Yes | |

### ES module imports (`<script type="module">`)

All 19 modules imported from `index.html` and their transitive `./` / `../harnesses/` dependencies are present under `src/` and `harnesses/`.

### Document-base runtime paths (from loaded JS)

| Reference | Resolved | Notes |
|-----------|----------|-------|
| `./index_2027_integrated_technology_candidate.html` | Yes | Root alias copy of `index.html` |
| `./src/tg-audioworklet-processor.js` | Yes | AudioWorklet `addModule` (opt-in lane) |
| `./tg-integrated-technology-candidate-sw.js` | Yes | User-click SW register |
| `./tg-final-marathon-candidate-sw.js` | Yes | User-click SW register |
| `./tg-mega-candidate-sw.js` | Yes | User-click SW register |
| `./tg-integrated-technology-candidate.webmanifest` | Yes | Integrated SW cache shell |
| `./tg-final-marathon-candidate.webmanifest` | Yes | Marathon SW cache shell |

## Copied Files (37 assets + 1 alias)

### Root

- `favicon.svg`
- `index_2027_integrated_technology_candidate.html` (alias of `index.html`)
- `tg-mega-candidate.webmanifest`
- `tg-integrated-technology-candidate.webmanifest`
- `tg-final-marathon-candidate.webmanifest`
- `tg-integrated-technology-candidate-sw.js`
- `tg-final-marathon-candidate-sw.js`
- `tg-mega-candidate-sw.js`

### `src/` (27 files)

- `tg-limitless-immersive-ui.css`
- `tg-limitless-ux-acceptance.css`
- `tg-limitless-ux-layout.js`
- `tg-limitless-provenance-footer.js`
- `tg-limitless-capability-panel.js`
- `tg-limitless-storage-bridge.js`
- `tg-limitless-opfs-cache.js`
- `tg-limitless-presets-library.js`
- `tg-limitless-session-logger.js`
- `tg-limitless-integrity-audit.js`
- `tg-limitless-view-modes.js`
- `tg-limitless-pwa-install.js`
- `tg-limitless-export-truth-panel.js`
- `tg-limitless-a11y-modals.js`
- `tg-limitless-webkit-matrix.js`
- `tg-limitless-first-run.js`
- `tg-limitless-performance.js`
- `tg-limitless-app-snapshot.js`
- `tg-limitless-provenance.js`
- `tg-limitless-webcrypto-sha.mjs`
- `tg-limitless-zero-network-guard.js`
- `tg-mega-tech-candidate.js`
- `tg-wav-live-tap-candidate.js`
- `tg-audioworklet-full-route-candidate.js`
- `tg-audioworklet-processor.js`
- `tg-integrated-technology-candidate.js`
- `tg-final-tech-marathon-candidate.js`

### `harnesses/` (2 files)

- `wav_pcm/wav_core.js`
- `storage_migration/validator-core.mjs`

## Missing References (not copied — not faked)

| Reference | Used by | Impact |
|-----------|---------|--------|
| `./index_2027_mega_tech_candidate.html` | Mega lane SHA probe / mega SW cache | Optional lane tooling only |
| `./index_2027_wav_live_tap_candidate.html` | WAV lane SHA probe | Optional lane tooling only |
| `./index_2027_audioworklet_full_route_candidate.html` | AudioWorklet lane SHA probe | Optional lane tooling only |
| `./index_2027_final_technology_marathon_candidate.html` | Marathon SW cache shell | Marathon SW install cache only |

`tg-mega-candidate.webmanifest` `start_url` targets mega candidate HTML (missing at preview root). Primary Pages entry remains `index.html`.

## Intentionally Excluded

- Full `limitless_webapp/` tree
- Full TG project
- `PERSONAL_MASTER` / `reference/` files
- `node_modules`
- Parent `.git`
- Secrets / tokens
- Unrelated reports / evidence
- Other candidate HTML pages (separate lane artifacts)
- CDN / network dependencies (none added)

## Protected Source Verification

Post-copy SHAs in main project (unchanged):

| Asset | SHA256 |
|-------|--------|
| Active `limitless_webapp/index.html` | `07262E21170F5208A866E3052CF38C025ECCDD4F39E5091AFA4E49A72379D42C` |
| Integrated candidate source | `34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD` |
| PERSONAL_MASTER / reference | `8DDD0F475DC234CDC429E7F8E88FABCBDEB5BDB98963B0D6A1C732F6A8D9A49B` |

## GitHub Pages Readiness

**Ready to push** for the integrated candidate preview at `/` (`index.html`). Styling, modules, favicon, and primary integrated path resolve locally. Optional multi-lane SHA probes and non-integrated SW cache HTML shells will 404 if invoked — expected for this minimal isolated package.
