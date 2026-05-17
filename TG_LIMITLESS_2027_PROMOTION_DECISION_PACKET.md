# TG Limitless 2027 — Promotion Decision Packet

**This is not a promotion.** Decision support for Eyal only.

**Current candidate:** Integrated Technology Candidate v1.1  
**Verdict:** `YELLOW_LIMITLESS_2027_INTEGRATED_TECHNOLOGY_CANDIDATE_PARTIAL_ACCEPTED`  
**Candidate SHA:** `34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD`

## Option A — Keep preview candidate only (recommended short-term)

| | |
|--|--|
| **Action** | Continue GitHub Pages preview; no change to `limitless_webapp/index.html` |
| **Risks** | Low product risk; live URL may be mistaken for production without clear landing |
| **Rollback** | Revert preview repo commits |
| **Requires Safari/iOS first** | No — for preview-only |
| **Requires AT first** | No — for preview-only |
| **Off-by-default** | All advanced lanes remain off |

## Option B — Promote safe UI / diagnostics chrome only

| | |
|--|--|
| **Action** | Port collapsed UX / landing patterns to product after manual QA |
| **Risks** | UI-only still touches large HTML surface; regression in layout/focus |
| **Rollback** | Restore active product SHA `07262E2…` |
| **Requires Safari/iOS first** | Yes — layout/audio chrome |
| **Requires AT first** | Yes — navigation order |
| **Off-by-default** | Must not enable lanes by default |

## Option C — Promote selected opt-in lanes

| | |
|--|--|
| **Action** | Cherry-pick OPFS / WAV / AW / PWA modules with explicit opt-in |
| **Risks** | Highest partial-route risk; SW/OPFS policy violations if default-on |
| **Rollback** | Lane flags + SW unregister tooling |
| **Requires Safari/iOS first** | Yes — per lane |
| **Requires AT first** | Yes — new controls |
| **Off-by-default** | OPFS, SW, WAV product-live, AudioWorklet route, spatial, WebGL |

## Option D — Full active product promotion

| | |
|--|--|
| **Action** | Replace active `index.html` with integrated candidate after full gate |
| **Risks** | Maximum — export, storage, audio graph, PWA |
| **Rollback** | Known SHA restore + SW cleanup |
| **Requires Safari/iOS first** | **Mandatory** |
| **Requires AT first** | **Mandatory** |
| **Off-by-default** | Non-negotiable |

## Recommended path

1. **Option A** now — fixed link + landing + daily driver + automation.  
2. Complete `manual-qa/` packages on real devices.  
3. Re-evaluate **Option B** only if Safari/iOS + AT evidence is YELLOW-or-better.  
4. Defer **C/D** until integrated candidate partial verdict advances.

## No-claim boundaries (all options)

Forbidden: production ready, perfect, 2027/2033 achieved, Safari/iOS GREEN, AT GREEN, product WAV GREEN, AudioWorklet product-live, OPFS default-on, silent SW, medical/healing/therapy/entrainment efficacy claims.

Allowed: integrated candidate preview, lanes unified off-by-default, legacy engine + WebM default, active product untouched during preview phase.
