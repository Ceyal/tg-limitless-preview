/** TG_WEB_APP_LIMITLESS — provenance constants (no product logic). */

export const TG_LIMITLESS_FROZEN_FALLBACK_SHA =

  '8DDD0F475DC234CDC429E7F8E88FABCBDEB5BDB98963B0D6A1C732F6A8D9A49B';



export const TG_LIMITLESS_PROTOTYPE_LABEL = 'TG_WEB_APP_LIMITLESS Prototype v0.1';



export const TG_LIMITLESS_ACTIVE_FORK_VERSION = 'v0.3';



/** Mission 5 accepted baseline (historical). */

export const TG_LIMITLESS_MISSION_5_ACTIVE_FORK_SHA =

  'FD515AD23F1F0B794E7E85300DD177C601D5D79067662397495592A5AB9A245C';



/** LONG TAKE 1 accepted baseline — LONG TAKE 2 immersive UI starts here. */

export const TG_LIMITLESS_TAKE_1_ACCEPTED_SHA =

  'EE61FBD3D3B4B19A1A4D1F90A858D9621BFE97DBAB71DD5E1587703A26658BE0';



/** LONG TAKE 2 accepted baseline — LONG TAKE 3 final QA starts here. */

export const TG_LIMITLESS_TAKE_2_ACCEPTED_SHA =

  '838EC860217B7769720A3B07933C242E7AD0ADBA7CD2203941646807043E78FD';

export const TG_LIMITLESS_TAKE_BASELINE_SHA = TG_LIMITLESS_TAKE_2_ACCEPTED_SHA;



/** Mission 4 baseline (historical). */

export const TG_LIMITLESS_MISSION_4_ACTIVE_FORK_SHA =

  '80058F6E88D28391A9DA753C33BC8201DA77D1A43EF6589C13044DAEE7464F75';



/** Current provenance audit paths (LONG TAKE 3). */

export const TG_LIMITLESS_SHA_AUDIT_REL =

  'Reports for GPT & GROK/TG_LIMITLESS_LONG_TAKE_3_FINAL_QA_SHA_AND_TOUCH_AUDIT.json';

/** LONG TAKE 2 audit path (historical). */

export const TG_LIMITLESS_SHA_AUDIT_TAKE_2_REL =

  'Reports for GPT & GROK/TG_LIMITLESS_LONG_TAKE_2_SHA_AND_TOUCH_AUDIT.json';

/** LONG TAKE 1 audit path (historical). */

export const TG_LIMITLESS_SHA_AUDIT_TAKE_1_REL =

  'Reports for GPT & GROK/TG_LIMITLESS_LONG_TAKE_1_SHA_AND_TOUCH_AUDIT.json';



export const TG_LIMITLESS_SHA_AUDIT_MISSION_5_REL =

  'Reports for GPT & GROK/TG_LIMITLESS_MISSION_5_SHA_AND_TOUCH_AUDIT.json';



/** Stale path — must not appear in active provenance UI. */

export const TG_LIMITLESS_STALE_SHA_AUDIT_REL = 'LIMITLESS_MISSION_2_SHA_AUDIT_FINAL.json';



export function detectRuntimeMode() {

  const o = location.origin;

  if (location.protocol === 'file:') return 'file://';

  if (/^https:$/i.test(location.protocol)) return 'https';

  if (/^http:$/i.test(location.protocol)) {

    const h = location.hostname;

    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return 'localhost';

    return 'http-other';

  }

  return 'other';

}



export function isAllowedLocalOrigin() {

  const mode = detectRuntimeMode();

  if (mode === 'file://') return true;

  if (mode === 'localhost') return true;

  return false;

}



export function detectBrowserLabel() {

  const ua = navigator.userAgent || '';

  if (/Edg\//.test(ua)) return 'Edge';

  if (/Firefox\//.test(ua)) return 'Firefox';

  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chromium';

  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari/WebKit';

  return 'unknown';

}

