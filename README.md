# TG Limitless Preview

This repo is a clean GitHub Pages preview package for the TG Limitless Integrated Technology Candidate.

It is not the active product.
It is not production.
It is not perfect.
It is not 2027/2033 achieved.

## Current Preview

- Candidate: `index_2027_integrated_technology_candidate.html`
- SHA: `34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD`
- Verdict: `YELLOW_LIMITLESS_2027_INTEGRATED_TECHNOLOGY_CANDIDATE_PARTIAL_ACCEPTED`

## Asset Audit

- Status: `PREVIEW_ASSETS_PARTIAL_WITH_MISSING_REFERENCES`
- Primary page load (HTML + CSS + ES modules): **complete**
- Optional lane SHA probes to other candidate HTML: **not included** (by design)
- Details: see `PREVIEW_ASSET_AUDIT.md`
- GitHub Pages: **ready to push** for integrated candidate at `index.html`

## Truth Boundaries

Allowed:

- Integrated candidate preview
- advanced lanes off-by-default / opt-in only
- legacy engine and WebM export remain default
- active TG product untouched

Forbidden:

- production ready
- perfect
- 2027 achieved
- 2033 achieved
- Safari/iOS GREEN
- AT GREEN
- product WAV GREEN
- AudioWorklet product-live
- OPFS default-on
- silent Service Worker
- medical/healing/therapy/entrainment claims

## Remaining Manual Gates

- Safari/iOS real-device smoke
- real mobile smoke
- manual AT screen-reader QA
- promotion decision packet

## Update Procedure

To update the preview:

1. Replace `index.html` with the newly accepted candidate.
2. Copy the candidate into `candidates/`.
3. Re-run asset audit: copy any newly referenced `src/`, `harnesses/`, favicon, manifest, or SW files (see `PREVIEW_ASSET_AUDIT.md`).
4. Update `VERSION.json`.
5. Replace `reports/latest/` with the latest 5 review files.
6. Commit and push.
