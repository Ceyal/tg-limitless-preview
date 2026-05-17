# TG Limitless Preview

GitHub Pages preview for the TG Limitless Integrated Technology Candidate — **candidate-only**, not production.

**Live site:** https://ceyal.github.io/tg-limitless-preview/

## Entry points

| Path | Purpose |
|------|---------|
| `/` | Clean landing — choose daily driver or diagnostics hub |
| `/daily-driver.html` | Manual QA entry — studio first, diagnostics collapsed |
| `/tech-diagnostics.html` | Full integrated technology / lane diagnostics |
| `/index_2027_integrated_technology_candidate.html` | SHA probe alias (same bytes as diagnostics hub) |

## Current candidate

- SHA: `34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD`
- Verdict: `YELLOW_LIMITLESS_2027_INTEGRATED_TECHNOLOGY_CANDIDATE_PARTIAL_ACCEPTED`

## Asset audit

- Status: `PREVIEW_ASSETS_COMPLETE` — see `PREVIEW_ASSET_AUDIT.md`
- QA report: `PREVIEW_QA_REPORT.md`

## Automation (preview repo only)

```bash
npm install
npx playwright install chromium
npm run qa:all
```

Scripts: `qa:preview` · `qa:links` · `qa:claims` · `qa:all`  
CI: `.github/workflows/preview-qa.yml` (no secrets)

## Manual QA packages

- `manual-qa/SAFARI_MACOS_IOS_REAL_DEVICE_QA_PACKAGE.md`
- `manual-qa/REAL_MOBILE_PWA_QA_PACKAGE.md`
- `manual-qa/AT_SCREEN_READER_MANUAL_QA_PACKAGE.md`

## Promotion decision

- `TG_LIMITLESS_2027_PROMOTION_DECISION_PACKET.md` — decision support only, not a promotion

## Truth boundaries

**Allowed:** integrated candidate preview; advanced lanes off-by-default; legacy engine + WebM default; active TG product untouched.

**Forbidden:** production ready; perfect; 2027/2033 achieved; Safari/iOS GREEN; AT GREEN; product WAV GREEN; AudioWorklet product-live; OPFS default-on; silent Service Worker; medical/healing/therapy/entrainment claims.

## Update procedure

1. Update `tech-diagnostics.html` from newly accepted candidate (and sync probe alias).
2. Re-copy `daily-driver.html` base from diagnostics; re-apply `preview/` CSS/JS hooks.
3. Refresh `src/`, `harnesses/`, manifests, SW files per `PREVIEW_ASSET_AUDIT.md`.
4. Update `VERSION.json`, `reports/latest/`, run `npm run qa:all`, commit, push.
