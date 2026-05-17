/**
 * Footer / visible provenance — LONG TAKE 2 audit paths (no stale Mission 2 reference).
 */
import {
  TG_LIMITLESS_FROZEN_FALLBACK_SHA,
  TG_LIMITLESS_SHA_AUDIT_REL,
  TG_LIMITLESS_TAKE_BASELINE_SHA,
} from './tg-limitless-provenance.js';

export function initLimitlessProvenanceFooter() {
  const frozenEl = document.querySelector('[data-tg-frozen-sha]');
  if (frozenEl) frozenEl.textContent = TG_LIMITLESS_FROZEN_FALLBACK_SHA;

  const forkEl = document.querySelector('[data-tg-active-fork-sha]');
  if (forkEl) {
    forkEl.textContent = `${TG_LIMITLESS_TAKE_BASELINE_SHA} (TAKE 2 accepted; TAKE 3 final QA in ${TG_LIMITLESS_SHA_AUDIT_REL})`;
  }

  const auditEl = document.querySelector('[data-tg-sha-audit-path]');
  if (auditEl) auditEl.textContent = TG_LIMITLESS_SHA_AUDIT_REL;
}
