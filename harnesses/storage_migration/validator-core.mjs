/**
 * Browser + Node shared storage validator (no Node built-ins).
 */
let _sha256Digest = null;
export function setSha256Digest(fn) { _sha256Digest = fn; }

export const SUPPORTED_SCHEMA = 1;
export const FROZEN_SHA = '8DDD0F475DC234CDC429E7F8E88FABCBDEB5BDB98963B0D6A1C732F6A8D9A49B';
export const ROLLBACK_STORAGE_KEY = 'tg_limitless_rollback_snapshot_v1';

export const STORAGE_KEY_MAP = {
  prayer_slots: 'chelli_tg_v12_personal_prayer_slots',
  profiles: 'privateToneProfiles_v10',
  mask: 'tg_v12_3_respectful_mask',
  sym: 'tg_v12_3_symbolic_light',
  breath_eyal: 'chelli_tg_v12_breath_eyal',
  breath_tamar: 'chelli_tg_v12_breath_tamar',
  breath_shared: 'chelli_tg_v12_breath_shared',
  breath_last_cal: 'chelli_tg_v12_breath_last_cal',
  nikud_prefs: 'tg_limitless_nikud_prefs_v1',
};

export const MACRO_SLOT_IDS = ['1', '2', '3'];
export const MACRO_PREFIX = 'tg6_macro_slot_';

export function canonicalJson(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort(), 0);
}

/** Canonical JSON payload for SHA-256 (integrity.bundle_sha256 cleared). */
export function canonicalBundlePayload(obj) {
  const copy = JSON.parse(JSON.stringify(obj));
  if (copy.integrity) {
    copy.integrity = { ...copy.integrity, bundle_sha256: '' };
  }
  return canonicalJson(copy);
}

export function bundleSha256(obj) {
  const payload = canonicalBundlePayload(obj);
  if (!_sha256Digest) return '';
  return _sha256Digest(payload);
}

const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFB4F]/;

export function containsHebrew(str) {
  return typeof str === 'string' && HEBREW_RE.test(str);
}

export function walkHebrewFields(obj, path = '', out = []) {
  if (obj == null) return out;
  if (typeof obj === 'string') {
    if (containsHebrew(obj)) out.push({ path, length: obj.length, sample: obj.slice(0, 40) });
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walkHebrewFields(v, `${path}[${i}]`, out));
    return out;
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach((k) => walkHebrewFields(obj[k], path ? `${path}.${k}` : k, out));
  }
  return out;
}

export function validateBundle(bundle) {
  const errors = [];
  const warnings = [];

  if (!bundle || typeof bundle !== 'object') {
    return { ok: false, errors: ['Root must be an object'], warnings, dryRun: true };
  }
  if (bundle.schema_version !== SUPPORTED_SCHEMA) {
    errors.push(`Unsupported schema_version: ${bundle.schema_version}`);
  }
  if (bundle.export_kind !== 'tg_limitless_bundle') {
    errors.push(`Invalid export_kind: ${bundle.export_kind}`);
  }
  if (!bundle.exported_at || Number.isNaN(Date.parse(bundle.exported_at))) {
    errors.push('exported_at must be ISO8601');
  }
  const src = bundle.source;
  if (!src || typeof src !== 'object') {
    errors.push('Missing source object');
  } else {
    if (!src.lane) errors.push('source.lane required');
    if (src.source_sha && src.source_sha !== FROZEN_SHA) {
      warnings.push(`source_sha differs from frozen fallback: ${src.source_sha}`);
    }
    if (!src.app_version_label) errors.push('source.app_version_label required');
    if (!src.origin) errors.push('source.origin required');
  }
  for (const key of ['presets', 'macros', 'profiles']) {
    if (!Array.isArray(bundle[key])) errors.push(`${key} must be an array`);
  }
  if (!bundle.prayer || typeof bundle.prayer !== 'object') {
    errors.push('prayer object required');
  } else {
    if (!Array.isArray(bundle.prayer.customizations)) errors.push('prayer.customizations must be array');
    if (!Array.isArray(bundle.prayer.text_overrides)) errors.push('prayer.text_overrides must be array');
  }
  if (!bundle.nikud || typeof bundle.nikud !== 'object') {
    errors.push('nikud object required');
  }
  if (typeof bundle.settings !== 'object' || bundle.settings === null) {
    errors.push('settings must be object');
  }
  if (typeof bundle.metadata !== 'object' || bundle.metadata === null) {
    errors.push('metadata must be object');
  }

  let computedSha = null;
  if (errors.length === 0) {
    computedSha = bundleSha256(bundle);
    if (bundle.integrity?.bundle_sha256 && bundle.integrity.bundle_sha256 !== computedSha) {
      warnings.push('integrity.bundle_sha256 mismatch (dry-run only)');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    dryRun: true,
    destructiveWrites: false,
    sourceSha: src?.source_sha ?? null,
    computedBundleSha256: computedSha,
    schema_version: bundle.schema_version,
    export_kind: bundle.export_kind,
  };
}

/** Byte-integrity check for Hebrew prayer payloads (NFC normalize compare). */
export function verifyHebrewByteIntegrity(originalText, importedText) {
  const enc = new TextEncoder();
  const a = enc.encode(originalText ?? '');
  const b = enc.encode(importedText ?? '');
  if (a.length !== b.length) {
    return { ok: false, reason: 'byte_length_mismatch', originalBytes: a.length, importedBytes: b.length };
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return { ok: false, reason: 'byte_mismatch', offset: i };
    }
  }
  return { ok: true, byteLength: a.length };
}

export function analyzeImport(bundle, options = {}) {
  const { currentLocalKeys = {}, hasRollbackSnapshot = false } = options;
  const validation = validateBundle(bundle);
  const keysToImport = [];
  const keysIgnored = [];
  const destructiveChanges = [];
  const hebrewFields = walkHebrewFields(bundle.prayer, 'prayer').concat(
    walkHebrewFields(bundle.nikud, 'nikud')
  );

  if (!validation.ok) {
    return {
      ...validation,
      valid: false,
      keysToImport,
      keysIgnored: ['(bundle invalid — nothing imported)'],
      hebrewFields,
      destructiveChanges,
      rollbackAvailable: hasRollbackSnapshot,
    };
  }

  if (bundle.profiles?.length) {
    keysToImport.push(STORAGE_KEY_MAP.profiles);
    if (currentLocalKeys[STORAGE_KEY_MAP.profiles]) {
      destructiveChanges.push({ key: STORAGE_KEY_MAP.profiles, action: 'overwrite profiles array' });
    }
  } else {
    keysIgnored.push('profiles (empty)');
  }

  if (Array.isArray(bundle.prayer?.customizations) && bundle.prayer.customizations.length) {
    keysToImport.push(STORAGE_KEY_MAP.prayer_slots);
    destructiveChanges.push({ key: STORAGE_KEY_MAP.prayer_slots, action: 'overwrite personal prayer slots' });
  }

  MACRO_SLOT_IDS.forEach((slot) => {
    const macro = bundle.macros?.find((m) => String(m.slot) === slot);
    if (macro) {
      const k = MACRO_PREFIX + slot;
      keysToImport.push(k);
      if (currentLocalKeys[k]) destructiveChanges.push({ key: k, action: 'overwrite macro slot ' + slot });
    }
  });

  const settings = bundle.settings || {};
  Object.entries(settings).forEach(([logical, val]) => {
    if (logical === 'storage_keys' && typeof val === 'object') {
      Object.keys(val).forEach((k) => {
        keysToImport.push(k);
        if (currentLocalKeys[k]) destructiveChanges.push({ key: k, action: 'overwrite from settings.storage_keys' });
      });
      return;
    }
    const mapped = STORAGE_KEY_MAP[logical];
    if (mapped && val != null && val !== '') {
      keysToImport.push(mapped);
      if (currentLocalKeys[mapped]) destructiveChanges.push({ key: mapped, action: 'overwrite ' + logical });
    }
  });

  if (bundle.nikud && Object.keys(bundle.nikud).length) {
    keysToImport.push(STORAGE_KEY_MAP.nikud_prefs);
  }

  if (Array.isArray(bundle.presets) && bundle.presets.length === 0) {
    keysIgnored.push('presets (empty — v1 not mapped to localStorage)');
  }

  return {
    ...validation,
    valid: true,
    keysToImport: [...new Set(keysToImport)],
    keysIgnored,
    hebrewFields,
    destructiveChanges,
    rollbackAvailable: hasRollbackSnapshot,
    hebrewFieldCount: hebrewFields.length,
  };
}

export function buildExportBundle(fromLocal, meta = {}) {
  const macros = MACRO_SLOT_IDS.map((slot) => {
    const raw = fromLocal[MACRO_PREFIX + slot];
    if (!raw) return null;
    try {
      return { slot, config: JSON.parse(raw) };
    } catch {
      return { slot, config_raw: raw };
    }
  }).filter(Boolean);

  let prayerSlots = [];
  try {
    prayerSlots = JSON.parse(fromLocal[STORAGE_KEY_MAP.prayer_slots] || '[]');
  } catch {
    prayerSlots = [];
  }

  let profiles = [];
  try {
    profiles = JSON.parse(fromLocal[STORAGE_KEY_MAP.profiles] || '[]');
  } catch {
    profiles = [];
  }

  let nikud = { read_along: {}, display_rules: {} };
  try {
    if (fromLocal[STORAGE_KEY_MAP.nikud_prefs]) nikud = JSON.parse(fromLocal[STORAGE_KEY_MAP.nikud_prefs]);
  } catch {
    /* keep default */
  }

  const bundle = {
    schema_version: SUPPORTED_SCHEMA,
    export_kind: 'tg_limitless_bundle',
    exported_at: new Date().toISOString(),
    source: {
      lane: 'TG_WEB_APP_LIMITLESS',
      source_sha: FROZEN_SHA,
      app_version_label: meta.app_version_label || 'TG_WEB_APP_LIMITLESS v0.2',
      origin: meta.origin || (typeof location !== 'undefined' ? location.origin : 'unknown'),
    },
    integrity: {
      bundle_sha256: '',
      sections_present: ['presets', 'macros', 'profiles', 'prayer', 'nikud', 'settings', 'metadata'],
    },
    presets: [],
    macros,
    profiles,
    prayer: {
      customizations: prayerSlots,
      text_overrides: [],
    },
    nikud,
    settings: {
      respectful_mask: fromLocal[STORAGE_KEY_MAP.mask] ?? null,
      symbolic_light: fromLocal[STORAGE_KEY_MAP.sym] ?? null,
      breath_eyal: fromLocal[STORAGE_KEY_MAP.breath_eyal] ?? null,
      breath_tamar: fromLocal[STORAGE_KEY_MAP.breath_tamar] ?? null,
      breath_shared: fromLocal[STORAGE_KEY_MAP.breath_shared] ?? null,
      breath_last_cal: fromLocal[STORAGE_KEY_MAP.breath_last_cal] ?? null,
    },
    metadata: {
      locale: 'he',
      rtl_default: true,
      notes: meta.notes || 'User export — Mission 3',
    },
  };
  bundle.integrity.bundle_sha256 = bundleSha256(bundle);
  return bundle;
}

export function applyBundleToLocalStorage(bundle, localStorageRef, { saveRollbackFirst = true } = {}) {
  const validation = validateBundle(bundle);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, applied: false };
  }

  const snapshot = {};
  for (let i = 0; i < localStorageRef.length; i++) {
    const k = localStorageRef.key(i);
    if (k) snapshot[k] = localStorageRef.getItem(k);
  }

  if (saveRollbackFirst) {
    const rollbackBundle = buildExportBundle(snapshot, {
      origin: 'rollback',
      notes: 'Auto snapshot before import',
    });
    localStorageRef.setItem(ROLLBACK_STORAGE_KEY, JSON.stringify(rollbackBundle));
  }

  if (Array.isArray(bundle.profiles)) {
    localStorageRef.setItem(STORAGE_KEY_MAP.profiles, JSON.stringify(bundle.profiles));
  }
  if (Array.isArray(bundle.prayer?.customizations)) {
    localStorageRef.setItem(STORAGE_KEY_MAP.prayer_slots, JSON.stringify(bundle.prayer.customizations));
  }
  bundle.macros?.forEach((m) => {
    if (m?.slot && m.config) {
      localStorageRef.setItem(MACRO_PREFIX + m.slot, JSON.stringify(m.config));
    }
  });
  const s = bundle.settings || {};
  if (s.respectful_mask != null) localStorageRef.setItem(STORAGE_KEY_MAP.mask, String(s.respectful_mask));
  if (s.symbolic_light != null) localStorageRef.setItem(STORAGE_KEY_MAP.sym, String(s.symbolic_light));
  if (s.breath_eyal != null) localStorageRef.setItem(STORAGE_KEY_MAP.breath_eyal, String(s.breath_eyal));
  if (s.breath_tamar != null) localStorageRef.setItem(STORAGE_KEY_MAP.breath_tamar, String(s.breath_tamar));
  if (s.breath_shared != null) localStorageRef.setItem(STORAGE_KEY_MAP.breath_shared, String(s.breath_shared));
  if (s.breath_last_cal != null) localStorageRef.setItem(STORAGE_KEY_MAP.breath_last_cal, String(s.breath_last_cal));
  if (bundle.nikud) {
    localStorageRef.setItem(STORAGE_KEY_MAP.nikud_prefs, JSON.stringify(bundle.nikud));
  }

  return { ok: true, applied: true, rollbackSaved: saveRollbackFirst };
}

export function restoreRollback(localStorageRef) {
  const raw = localStorageRef.getItem(ROLLBACK_STORAGE_KEY);
  if (!raw) return { ok: false, error: 'No rollback snapshot' };
  let bundle;
  try {
    bundle = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Rollback corrupt' };
  }
  return applyBundleToLocalStorage(bundle, localStorageRef, { saveRollbackFirst: false });
}

