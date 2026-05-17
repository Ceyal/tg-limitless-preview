# Safari macOS / iOS Real Device QA Package

**Preview base URL:** https://ceyal.github.io/tg-limitless-preview/  
**Daily driver:** `/daily-driver.html`  
**Diagnostics hub:** `/tech-diagnostics.html`

**Rule:** Do not record GREEN without executed evidence on the listed device. Tooling PASS does not substitute for Safari/iOS GREEN.

## macOS Safari checklist

| # | Check | Pass | Fail | Notes / screenshot |
|---|--------|------|------|-------------------|
| 1 | Landing `/` loads, links work | | | |
| 2 | Daily driver loads; studio visible first | | | |
| 3 | User gesture unlocks audio context | | | |
| 4 | Play profile / Lab start audible | | | |
| 5 | Stop silences output | | | |
| 6 | WebM record + stop produces blob | | | |
| 7 | Download/share path behaves per Safari policy | | | |
| 8 | Reload: advanced lane checkboxes remain off | | | |
| 9 | Diagnostics hub reachable; panels expand manually | | | |
| 10 | No silent Service Worker on first load | | | |

## iPhone Safari checklist

| # | Check | Pass | Fail | Notes / screenshot |
|---|--------|------|------|-------------------|
| 1 | Portrait layout usable | | | |
| 2 | Landscape orientation | | | |
| 3 | Audio gesture on first play | | | |
| 4 | Play/Stop | | | |
| 5 | Export/share sheet reality | | | |
| 6 | Reload default-off lanes | | | |

## iPad Safari checklist

| # | Check | Pass | Fail | Notes / screenshot |
|---|--------|------|------|-------------------|
| 1 | Split view / resize | | | |
| 2 | Touch targets for transport | | | |
| 3 | Audio + export same as iPhone where applicable | | | |

## Evidence table

| Device | OS | Safari version | Tester | Date | Verdict |
|--------|-----|----------------|--------|------|---------|
| | | | | | REQUIRES_DEVICE |

## Diagnostics copy to capture

- Unified diagnostics JSON (optional) from tech-diagnostics hub only
- WebKit matrix panel output
- Export truth panel row for WebM
