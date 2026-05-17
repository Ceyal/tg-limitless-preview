# Preview Asset Audit

**Generated:** 2026-05-17 (updated — optional probe HTML patch)  
**Preview root:** `tg-limitless-preview-repo/`  
**Entry:** `index.html` (Integrated Technology Candidate v1.1)

## Verdict

**`PREVIEW_ASSETS_COMPLETE`**

| Scope | Status |
|-------|--------|
| Primary page load (HTML + CSS + ES module graph + harness deps) | **COMPLETE** |
| Integrated candidate path + integrated SW shell | **COMPLETE** |
| Optional lane SHA probes (foundation candidate HTML) | **COMPLETE** |
| Marathon / Mega SW offline shells | **COMPLETE** |
| GitHub Pages preview package | **READY TO PUSH** |

## Detected References (from `index.html`)

### Head / static links

| Reference | Resolved | Notes |
|-----------|----------|-------|
| `./favicon.svg` | Yes | Copied to root |
| `./tg-mega-candidate.webmanifest` | Yes | `start_url` → `index_2027_mega_tech_candidate.html` (present) |
| `./src/tg-limitless-immersive-ui.css` | Yes | |
| `./src/tg-limitless-ux-acceptance.css` | Yes | |

### ES module imports (`<script type="module">`)

All 19 modules imported from `index.html` and their transitive `./` / `../harnesses/` dependencies are present under `src/` and `harnesses/`.

### Document-base runtime paths (from loaded JS)

| Reference | Resolved | Notes |
|-----------|----------|-------|
| `./index_2027_integrated_technology_candidate.html` | Yes | Root alias copy of `index.html` |
| `./index_2027_mega_tech_candidate.html` | Yes | Mega foundation SHA probe |
| `./index_2027_wav_live_tap_candidate.html` | Yes | WAV foundation SHA probe |
| `./index_2027_audioworklet_full_route_candidate.html` | Yes | AudioWorklet partial SHA probe |
| `./index_2027_final_technology_marathon_candidate.html` | Yes | Marathon foundation / SW cache |
| `./src/tg-audioworklet-processor.js` | Yes | AudioWorklet `addModule` (opt-in lane) |
| `./tg-integrated-technology-candidate-sw.js` | Yes | User-click SW register |
| `./tg-final-marathon-candidate-sw.js` | Yes | User-click SW register |
| `./tg-mega-candidate-sw.js` | Yes | User-click SW register |
| `./tg-integrated-technology-candidate.webmanifest` | Yes | Integrated SW cache shell |
| `./tg-final-marathon-candidate.webmanifest` | Yes | Marathon SW cache shell |

## Optional Probe HTML (root — patch 2026-05-17)

| File | Source | SHA256 | Foundation |
|------|--------|--------|------------|
| `index_2027_mega_tech_candidate.html` | `limitless_webapp/` | `7AC5389A4CCA12436C1A2A2189F3469DD927BC401FDA1EFBC357631FD936B125` | Mega |
| `index_2027_wav_live_tap_candidate.html` | `limitless_webapp/` | `982AC64307B3DAB2A3E4E7D0173743F16FAECD91C23E44379BFAB171F3240ACF` | WAV |
| `index_2027_audioworklet_full_route_candidate.html` | `limitless_webapp/` | `9BCB3B81EBECB4FE12613002C6B59685A761846190F8B87823432699943EEF33` | AudioWorklet partial |
| `index_2027_final_technology_marathon_candidate.html` | `limitless_webapp/` | `38859AC344AED5BFCB49DF102472D7CE29E11EFDDF22D5BD5D2FEE46CE8E3FED` | Final Technology Marathon |

## Copied Assets Summary

- **Root:** favicon, 3 webmanifests, 3 service workers, 5 candidate HTML files (integrated alias + 4 foundation probes)
- **`src/`:** 27 files (CSS + JS/MJS modules)
- **`harnesses/`:** 2 files (`wav_pcm/wav_core.js`, `storage_migration/validator-core.mjs`)

## Missing References

None. All local `href` / `src` / `import` / `fetch` / SW shell paths detected in the preview package resolve.

## Intentionally Excluded

- Full `limitless_webapp/` tree
- Full TG project
- `PERSONAL_MASTER` / `reference/` files
- `node_modules`
- Parent `.git`
- Secrets / tokens
- Unrelated reports / evidence
- CDN / network dependencies (none added)

## Protected Source Verification

Post-patch SHAs in main project (unchanged):

| Asset | SHA256 |
|-------|--------|
| Active `limitless_webapp/index.html` | `07262E21170F5208A866E3052CF38C025ECCDD4F39E5091AFA4E49A72379D42C` |
| Integrated candidate source | `34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD` |
| PERSONAL_MASTER / reference | `8DDD0F475DC234CDC429E7F8E88FABCBDEB5BDB98963B0D6A1C732F6A8D9A49B` |

## GitHub Pages Readiness

**Ready to push.** Full reference-complete preview package for GitHub Pages at `/` (`index.html`) with all lane SHA probes and SW cache shells resolvable.
