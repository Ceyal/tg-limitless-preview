# Limitations and Next Steps — Preview Finalization v1.1

## Tooling limitations (YELLOW)

| Item | Classification | Notes |
|------|----------------|-------|
| Playwright `live-pages` project | `YELLOW_TOOLING_LIMITATION` | Intermittent GitHub Pages 404 in headless run; manual HTTP 200 + content verified |
| GitHub Actions browser matrix | `YELLOW_ACTIONS_TOOLING_LIMITATION` | Workflow installs Chromium only; full matrix optional |
| PWA register/unregister automation | `TOOLING_LIMITED` | Requires real device + user gesture |
| Safari/iOS export/share truth | `REQUIRES_DEVICE` | No simulated GREEN |

## Product preview limitations (expected)

- Integrated candidate is **partial accepted** — not production promotion
- AudioWorklet: partial route only in candidate harness
- WAV lane: opt-in only, not product default
- OPFS: opt-in only, not default-on
- Service Worker: user-click register only in preview; no silent registration

## Manual / device gates before promotion

1. **Safari macOS + iOS** — `manual-qa/SAFARI_MACOS_IOS_REAL_DEVICE_QA_PACKAGE.md`
2. **Real mobile PWA** — `manual-qa/REAL_MOBILE_PWA_QA_PACKAGE.md`
3. **AT (NVDA / VoiceOver)** — `manual-qa/AT_SCREEN_READER_MANUAL_QA_PACKAGE.md`

## Recommended next actions (ordered)

1. Eyal: complete Safari/iOS manual package with evidence table (no fake GREEN).
2. Eyal: complete AT manual package before any accessibility claims.
3. Re-run `npm run qa:preview -- --project=live-pages` after Playwright config fix if CI/live smoke needed.
4. Review `TG_LIMITLESS_2027_PROMOTION_DECISION_PACKET.md` — choose Option A (preview only) until device evidence exists.
5. Do **not** promote `limitless_webapp/index.html` until Option D criteria met.

## Safest path

**Option A** from promotion packet: keep preview candidate isolated; use daily-driver for manual QA entry; use tech-diagnostics for lane probes only.
