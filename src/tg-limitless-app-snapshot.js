/**
 * Non-destructive capture/apply of tone UI settings (presets / session snapshots).
 */
const TONE_FIELD_IDS = [
  'freqL',
  'freqR',
  'freqNumL',
  'freqNumR',
  'waveL',
  'waveR',
  'volL',
  'volR',
];

function el(id) {
  return document.getElementById(id);
}

function activeProfileChipId() {
  const chips = document.querySelectorAll('#profileTargetRail .profile-chip.active');
  if (chips.length) return chips[0].id || null;
  return null;
}

export function captureToneSnapshot() {
  const fields = {};
  for (const id of TONE_FIELD_IDS) {
    const node = el(id);
    if (node) fields[id] = node.value;
  }
  return {
    schema_version: 1,
    captured_at: new Date().toISOString(),
    fields,
    profile_chip_id: activeProfileChipId(),
    freq_display_l: el('freqDisplayL')?.textContent?.trim() || null,
    freq_display_r: el('freqDisplayR')?.textContent?.trim() || null,
  };
}

export function applyToneSnapshot(snapshot) {
  if (!snapshot?.fields) return { ok: false, error: 'Invalid snapshot' };
  for (const [id, value] of Object.entries(snapshot.fields)) {
    const node = el(id);
    if (!node || value == null) continue;
    node.value = String(value);
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (snapshot.profile_chip_id) {
    const chip = document.getElementById(snapshot.profile_chip_id);
    chip?.click();
  }
  return { ok: true, applied: Object.keys(snapshot.fields).length };
}

export function summarizeToneSnapshot(snapshot) {
  if (!snapshot?.fields) return '—';
  const l = snapshot.fields.freqNumL || snapshot.fields.freqL || '?';
  const r = snapshot.fields.freqNumR || snapshot.fields.freqR || '?';
  return `L ${l} Hz · R ${r} Hz · wave ${snapshot.fields.waveL || '?'}/${snapshot.fields.waveR || '?'}`;
}
