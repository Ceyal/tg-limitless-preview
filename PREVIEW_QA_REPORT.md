# Preview QA Report

**Generated:** 2026-05-17  
**Commit:** _(updated after push)_  
**Repo:** https://github.com/Ceyal/tg-limitless-preview

## Live URLs

| Page | URL |
|------|-----|
| Landing | https://ceyal.github.io/tg-limitless-preview/ |
| Daily driver | https://ceyal.github.io/tg-limitless-preview/daily-driver.html |
| Tech diagnostics | https://ceyal.github.io/tg-limitless-preview/tech-diagnostics.html |

**Pages verification:** Live URL smoke **pending deploy** of this commit (pre-push run showed legacy root still serving integrated candidate). Re-run `npm run qa:preview -- --project=live-pages` after push + Pages propagation (~1–3 min).

## Local QA results

| Check | Result | Classification |
|-------|--------|----------------|
| `npm run qa:claims` | PASS (0 forbidden positive hits) | PASS |
| `npm run qa:links` | PASS (27 refs, 0 missing on daily-driver) | PASS |
| Playwright `local-preview` (5 tests) | PASS | PASS |
| Playwright `live-pages` (pre-push) | 4 FAIL (pages not yet deployed) | FAIL_INFRA (expected until push) |

## Screenshots (local)

- `qa-artifacts/screenshots/local-preview-landing.png`
- `qa-artifacts/screenshots/local-preview-daily-driver.png`
- `qa-artifacts/screenshots/local-preview-tech-diagnostics.png`

## Default-off / reload proof (local daily-driver)

| Control | After load | After reload |
|---------|------------|--------------|
| OPFS lanes (mega/itg) | off | off |
| PWA/SW lane checkbox | off | off |
| WAV / Worklet / Viz / Spatial (mega) | off | off |
| WAV live tap | off | off |
| AudioWorklet arm | off | off |
| `navigator.serviceWorker.controller` | none | none |

## Forbidden claims grep

Negated truth-boundary lines and `**Forbidden:**` documentation lists are allowed. No positive forbidden marketing claims detected in preview-controlled files.

## Known limitations

- Safari/iOS, real mobile PWA, AT: **REQUIRES_DEVICE / REQUIRES_MANUAL** — see `manual-qa/`
- GitHub Actions may classify browser install as `YELLOW_ACTIONS_TOOLING_LIMITED` on some runners
- Live smoke must be re-run after each Pages deploy
- Daily-driver collapses diagnostics via preview-only JS; does not change engine defaults

## Allowed claims

- Integrated Technology Candidate v1.1 preview
- Advanced lanes off-by-default / opt-in only
- Legacy engine and WebM export remain default
- Active product and accepted foundations untouched (outside this repo)

## Forbidden claims

- production ready · perfect · 2027/2033 achieved
- Safari/iOS GREEN · AT GREEN · product WAV GREEN
- AudioWorklet product-live · OPFS default-on · silent Service Worker
- medical / healing / therapy / entrainment efficacy claims

## GitHub Actions

Workflow: `.github/workflows/preview-qa.yml` — runs on push to `main`, no secrets, uploads `qa-artifacts/` when present.

## Protected source check (TG root, unchanged)

| Asset | SHA256 |
|-------|--------|
| Active product | `07262E21170F5208A866E3052CF38C025ECCDD4F39E5091AFA4E49A72379D42C` |
| Integrated candidate source | `34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD` |
