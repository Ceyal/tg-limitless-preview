# TG Limitless 2027 — Personal Release Candidate Decision Packet v1.0

**Candidate:** `limitless_webapp/index_2027_top_tg_personal_release_candidate.html`  
**Verdict:** `YELLOW_LIMITLESS_500H_TOP_TG_PERSONAL_RELEASE_CANDIDATE_PARTIAL_READY_FOR_GROK`

## Integrated (safe)

- Integrated technology foundation (marathon, WAV live tap, AW partial route, mega lanes hidden/collapsed)
- Daily-driver layout with collapsed advanced hub
- v2 harness lanes: AudioWorklet parity, WAV productization, PWA/SW scope, OPFS quick check, WebGL/Spatial probe
- Personal RC scoped Service Worker (user-click only)
- Waiver truth banner (Safari/iOS, AT, endurance)
- Rollback/cleanup manifest in diagnostics

## Off-by-default (required)

- All integrated master lane toggles
- AudioWorklet full route and parity v2 arm
- WAV live tap and WAV productization v2 lane
- OPFS writes
- PWA/SW registration
- WebGL/WebGPU overlay and Spatial/HRTF probe

## Partial (honest)

| Lane | Status |
|------|--------|
| AudioWorklet | `AUDIOWORKLET_PARITY_PARTIAL` — harmonics/LFO harness; noise/E-mode blocked |
| WAV | `WAV_PRODUCTIZATION_PARTIAL` — ScriptProcessor replacement blocked |
| PWA | Candidate-only — not production PWA |
| OPFS | Opt-in — product decision pending |

## Waived by Eyal for now (NOT GREEN)

- Safari/iOS real-device QA
- AT screen reader manual QA
- Real-device endurance

## Cannot be called GREEN

- Safari/iOS, AT, product WAV, AudioWorklet product-live, production PWA, OPFS default-on, 2027/2033 achieved, perfect/production

## Rollback

1. Full cleanup in personal RC panel  
2. Unregister personal + integrated + marathon SW  
3. Clear OPFS prefixes (`tg_final_marathon_opfs_*`, `tg_itg_opfs_*`, `tg_prc_opfs_v2_*`)  
4. Close tab; use active `index.html`

## Promotion options (Eyal only)

| Option | Action |
|--------|--------|
| **A** | Keep as candidate only (**recommended now**) |
| **B** | Make personal RC default preview landing page |
| **C** | Create separate promotion candidate HTML — do not replace active index directly |
| **D** | Replace active `index.html` only after explicit final command with SHA audit |

## Next commands (if promoting later)

```text
# Option B — preview default (after Grok review)
# Update tg-limitless-preview-repo/index.html primary link to personal-release-candidate.html

# Option C — promotion candidate copy
# Copy index_2027_top_tg_personal_release_candidate.html → index_2027_promotion_staging_candidate.html
# Run full SHA audit + device/AT QA before Option D

# Option D — active product (explicit only)
# NEVER without: device evidence, AT evidence, Eyal written approval, SHA lock verification
```
