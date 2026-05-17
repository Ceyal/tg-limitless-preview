# Preview QA Report

**Generated:** 2026-05-17  
**Campaign:** TG_LIMITLESS_PREVIEW_FINALIZATION_CAMPAIGN_v1.1  
**Commit (base):** `87210cb43cb589d7886e3cb16dfd90e8deee4058`  
**Repo:** https://github.com/Ceyal/tg-limitless-preview

## Live URLs

| Page | URL | HTTP verify |
|------|-----|-------------|
| Landing | https://ceyal.github.io/tg-limitless-preview/ | 200 — clean landing with Daily Driver link |
| Daily driver | https://ceyal.github.io/tg-limitless-preview/daily-driver.html | 200 |
| Tech diagnostics | https://ceyal.github.io/tg-limitless-preview/tech-diagnostics.html | 200 |

## Local QA results

| Check | Result | Classification |
|-------|--------|----------------|
| `npm run qa:claims` | PASS (0 forbidden positive hits) | PASS |
| `npm run qa:links` | PASS (27 refs, 0 missing on daily-driver) | PASS |
| Playwright `local-preview` (5 tests) | PASS (5/5) | PASS |
| Playwright `live-pages` | 3 FAIL / 2 PASS | YELLOW_TOOLING_LIMITATION |

**Live Playwright note:** Headless run received GitHub Pages “404 — There isn't a GitHub Pages site here” for some navigations; manual `Invoke-WebRequest` and WebFetch confirmed live content (landing title + Daily Driver link). Classified as tooling/network, not product failure.

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
| `details.tg-preview-diag-fold[open]` | 0 | — |

## Forbidden claims grep

Negated truth-boundary lines and `**Forbidden:**` documentation lists are allowed. No positive forbidden marketing claims detected in preview-controlled files.

## Foundation freeze

| File | SHA256 |
|------|--------|
| `foundations/index_2027_integrated_technology_candidate_FINAL_FOUNDATION.html` | `34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD` |

`VERSION.json`: `finalFoundationFrozen: true`

## Known limitations

- Safari/iOS, real mobile PWA, AT: **REQUIRES_DEVICE / REQUIRES_MANUAL** — see `manual-qa/`
- GitHub Actions may classify browser install as `YELLOW_ACTIONS_TOOLING_LIMITATION` on some runners
- Playwright live smoke may need `--project=live-pages` without local webServer (config updated)
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
| PERSONAL_MASTER reference | `8DDD0F475DC234CDC429E7F8E88FABCBDEB5BDB98963B0D6A1C732F6A8D9A49B` |
| Integrated candidate source | `34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD` |

## Campaign review bundle

`Reports for GPT & GROK/TG_LIMITLESS_PREVIEW_FINALIZATION_CAMPAIGN_*`

## Verdict token

`PREVIEW_FINALIZATION_PARTIAL_TOOLING_LIMITED`
