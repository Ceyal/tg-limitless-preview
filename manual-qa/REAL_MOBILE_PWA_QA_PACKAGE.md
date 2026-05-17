# Real Mobile PWA QA Package

**Preview URLs:** https://ceyal.github.io/tg-limitless-preview/

## Rules

- Service Worker registration is **user-click only** — no silent SW.
- OPFS remains **opt-in** — not default-on.
- Offline behavior is evaluated only **after** explicit user registration.

## iPhone (Safari / installed shortcut)

| # | Check | Pass | Fail | Notes |
|---|--------|------|------|-------|
| 1 | Add to Home Screen available | | | |
| 2 | Launched shortcut opens daily driver or landing per manifest | | | |
| 3 | No SW controller before user clicks Register | | | |
| 4 | Register integrated SW (explicit) | | | |
| 5 | Offline shell behavior after register | | | |
| 6 | Unregister + cache clear | | | |

## Android (Chrome)

| # | Check | Pass | Fail | Notes |
|---|--------|------|------|-------|
| 1 | Install prompt / shortcut | | | |
| 2 | No SW until explicit register | | | |
| 3 | Register / unregister cycle | | | |

## Evidence table

| Platform | Device | Browser | Date | Verdict |
|----------|--------|---------|------|---------|
| | | | | REQUIRES_DEVICE |
