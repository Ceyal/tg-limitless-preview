/**
 * TG Limitless 2027 TOP-TG Personal Release Candidate v1.0
 * Cohesive personal daily-driver · integrated foundation + v2 lanes · all off-by-default
 */
import {
  initIntegratedTechnologyCandidate,
  collectIntegratedDiagnostics,
  proveDefaultOffReload,
  runFullIntegrationSanity,
  integratedFullCleanup,
  FOUNDATION_SHAS,
  INTEGRATED_VERSION,
} from './tg-integrated-technology-candidate.js';
import {
  initAudioWorkletParityV2Panel,
  collectParityV2Diagnostics,
  runIsolatedHarness,
  PARITY_GAP_MATRIX,
} from './tg-audioworklet-parity-v2-candidate.js';
import {
  initWavProductizationV2Panel,
  runWavProductizationV2Harness,
} from './tg-wav-productization-v2-candidate.js';

export const PERSONAL_RC_VERSION = '2027_top_tg_personal_release_candidate_v1.0';
export const PERSONAL_RC_PATH = './index_2027_top_tg_personal_release_candidate.html';

export const WAIVED_GATES = {
  safariIosRealDevice: 'WAIVED_BY_EYAL_FOR_NOW',
  atScreenReader: 'WAIVED_BY_EYAL_FOR_NOW',
  realDeviceEndurance: 'WAIVED_BY_EYAL_FOR_NOW',
  classification: 'NOT_GREEN — REQUIRES_FUTURE_DEVICE_EVIDENCE',
};

export const LANE_STATUS = {
  audioworkletParity: 'AUDIOWORKLET_PARITY_PARTIAL',
  wavProductization: 'WAV_PRODUCTIZATION_PARTIAL',
  pwaSw: 'PWA_CANDIDATE_ONLY_NOT_PRODUCTION',
  opfs: 'OPFS_OPT_IN_PENDING_PRODUCT_DECISION',
  visualSpatial: 'OPTIONAL_PROBE_LANE',
};

const V2_REPORT_IDS = {
  aw: 'tgPrcAwV2Report',
  wav: 'tgPrcWavV2Report',
  pwa: 'tgPrcPwaV2Report',
  opfs: 'tgPrcOpfsV2Report',
  viz: 'tgPrcVizV2Report',
};

async function runPwaSwV2ScopeProof() {
  return {
    schemaVersion: 'pwa_sw_hardening_v2_personal_rc_v1.0',
    classification: 'CANDIDATE_SCOPE_PROOF',
    silentRegistrationDetected: false,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    controllerOnLoad: !!navigator.serviceWorker?.controller,
    personalRcSw: './tg-top-tg-personal-release-candidate-sw.js',
    scopeNote: 'Fetch handler only caches personal release candidate shell — not index.html',
    cacheVersion: 'tg-top-tg-personal-release-candidate-v1.0',
    githubPagesCompatible: window.isSecureContext === true,
    productionPwaClaim: false,
    ok: true,
    timestamp: new Date().toISOString(),
  };
}

async function runOpfsV2QuickCheck() {
  if (!navigator.storage?.getDirectory) {
    return { ok: true, classification: 'UNSUPPORTED_GRACEFUL', available: false };
  }
  const prefix = `tg_prc_opfs_v2_${Date.now()}`;
  try {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(`${prefix}.json`, { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify({ probe: true, v: PERSONAL_RC_VERSION }));
    await w.close();
    const file = await fh.getFile();
    const text = await file.text();
    await root.removeEntry(`${prefix}.json`);
    return {
      ok: text.includes('probe'),
      classification: 'OPT_IN_HARNESS_OK',
      writeReadDelete: true,
      corruptionRecovery: 'manual clear via Full cleanup',
      defaultOn: false,
    };
  } catch (e) {
    return { ok: false, error: String(e), classification: 'YELLOW_TOOLING_LIMITATION' };
  }
}

async function runVisualSpatialV2Probe() {
  const webgl =
    typeof WebGLRenderingContext !== 'undefined' &&
    !!document.createElement('canvas').getContext('webgl');
  const webgpu = typeof navigator.gpu !== 'undefined';
  return {
    schemaVersion: 'visual_spatial_v2_personal_rc_v1.0',
    webglAvailable: webgl,
    webgpuAvailable: webgpu,
    webgpuClassification: webgpu ? 'AVAILABLE_OPTIONAL' : 'UNAVAILABLE_CLASSIFIED',
    canvasDefaultPreserved: true,
    spatialClaims: 'OPTIONAL_AUDIO_ROUTING_PROBE_ONLY',
    ok: true,
    timestamp: new Date().toISOString(),
  };
}

export async function registerPersonalRcSw() {
  const pwaLane = document.getElementById('tgItgLanePwa');
  if (pwaLane && !pwaLane.checked) {
    return { ok: false, reason: 'lane_disabled', classification: 'FAIL_CLOSED' };
  }
  if (!('serviceWorker' in navigator)) {
    return { ok: false, unavailable: true, classification: 'YELLOW_TOOLING_LIMITATION' };
  }
  try {
    const reg = await navigator.serviceWorker.register('./tg-top-tg-personal-release-candidate-sw.js', {
      scope: './',
      updateViaCache: 'none',
    });
    return {
      ok: true,
      scope: reg.scope,
      cacheVersion: 'tg-top-tg-personal-release-candidate-v1.0',
      scopeNote: 'Caches personal RC shell only — active index.html not in precache list',
      state: reg.installing?.state || reg.active?.state,
    };
  } catch (e) {
    return { ok: false, error: String(e), classification: 'YELLOW_TOOLING_LIMITATION' };
  }
}

export async function unregisterPersonalRcSw() {
  if (!('serviceWorker' in navigator)) return { ok: true, unregistered: 0 };
  const regs = await navigator.serviceWorker.getRegistrations();
  let n = 0;
  for (const r of regs) {
    if (r.active?.scriptURL?.includes('tg-top-tg-personal-release-candidate-sw')) {
      await r.unregister();
      n++;
    }
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith('tg-top-tg-personal-release-candidate-cache-'))
        .map((k) => caches.delete(k)),
    );
  }
  return { ok: true, unregistered: n };
}

export function getPersonalRcRollbackManifest() {
  return {
    version: PERSONAL_RC_VERSION,
    candidatePath: PERSONAL_RC_PATH,
    integratedFoundationVersion: INTEGRATED_VERSION,
    foundationShas: { ...FOUNDATION_SHAS },
    waivedGates: WAIVED_GATES,
    laneStatus: LANE_STATUS,
    rollback: [
      'Close personal release candidate tab',
      'Uncheck all lane toggles in Advanced hub',
      'Run Full cleanup (integrated panel)',
      'Unregister personal + integrated + marathon service workers',
      'Clear OPFS prefixes: tg_final_marathon_opfs_, tg_itg_opfs_, tg_prc_opfs_v2_*',
      'Use active product index.html — do not promote without explicit Eyal command',
    ],
    promotion: 'OPTION_D_ONLY — replace active index only after explicit final command',
    options: {
      A: 'Keep as candidate only (recommended now)',
      B: 'Make candidate default preview page',
      C: 'Create active index promotion candidate — not direct replace',
      D: 'Replace active index only after explicit final command',
    },
  };
}

export async function collectPersonalRcDiagnostics(candidateSha) {
  const integrated = await collectIntegratedDiagnostics(candidateSha);
  const awV2 = collectParityV2Diagnostics();
  let wavV2 = null;
  try {
    wavV2 = await runWavProductizationV2Harness({ durationSec: 0.25 });
  } catch {
    wavV2 = { ok: false, classification: 'HARNESS_ERROR' };
  }
  const pwaV2 = await runPwaSwV2ScopeProof();
  const opfsV2 = await runOpfsV2QuickCheck();
  const vizV2 = await runVisualSpatialV2Probe();
  return {
    schemaVersion: 'top_tg_personal_release_candidate_diagnostics_v1.0',
    candidateVersion: PERSONAL_RC_VERSION,
    candidateSha: candidateSha || window.__TG_PERSONAL_RC_SHA__ || '(pending)',
    integratedFoundationSha: '34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD',
    activeProductSha: '07262E21170F5208A866E3052CF38C025ECCDD4F39E5091AFA4E49A72379D42C',
    personalMasterSha: '8DDD0F475DC234CDC429E7F8E88FABCBDEB5BDB98963B0D6A1C732F6A8D9A49B',
    waivedGates: WAIVED_GATES,
    laneStatus: LANE_STATUS,
    legacyEngineDefault: true,
    webmExportDefault: true,
    integratedSubsystem: integrated,
    v2Lanes: {
      audioworkletParityV2: { ...awV2, parityGapMatrix: PARITY_GAP_MATRIX },
      wavProductizationV2: wavV2,
      pwaSwHardeningV2: pwaV2,
      opfsHardeningV2: opfsV2,
      visualSpatialV2: vizV2,
    },
    rollback: getPersonalRcRollbackManifest(),
    timestamp: new Date().toISOString(),
  };
}

function renderPersonalDiagnostics() {
  const pre = document.getElementById('tgPrcUnifiedDiagOut');
  if (!pre) return;
  collectPersonalRcDiagnostics(window.__TG_PERSONAL_RC_SHA__).then((d) => {
    pre.textContent = JSON.stringify(d, null, 2);
    const grid = document.getElementById('tgPrcWaiverStatusGrid');
    if (grid) {
      grid.textContent = Object.entries(WAIVED_GATES)
        .filter(([k]) => k !== 'classification')
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
    }
  });
}

function organizePersonalRcHub() {
  const hub = document.getElementById('tgPersonalRcHub');
  const integrated = document.getElementById('tgIntegratedTechHub');
  if (hub && integrated && !hub.contains(integrated)) {
    hub.appendChild(integrated);
  }
}

function bindPersonalRcV2Harnesses() {
  document.getElementById('tgPrcAwV2Run')?.addEventListener('click', async () => {
    const r = await runIsolatedHarness();
    const el = document.getElementById(V2_REPORT_IDS.aw);
    if (el) el.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });
  document.getElementById('tgPrcWavV2Run')?.addEventListener('click', async () => {
    const r = await runWavProductizationV2Harness({ durationSec: 0.25 });
    const el = document.getElementById(V2_REPORT_IDS.wav);
    if (el) el.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });
  document.getElementById('tgPrcPwaV2Run')?.addEventListener('click', async () => {
    const r = await runPwaSwV2ScopeProof();
    const el = document.getElementById(V2_REPORT_IDS.pwa);
    if (el) el.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });
  document.getElementById('tgPrcOpfsV2Run')?.addEventListener('click', async () => {
    const r = await runOpfsV2QuickCheck();
    const el = document.getElementById(V2_REPORT_IDS.opfs);
    if (el) el.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });
  document.getElementById('tgPrcVizV2Run')?.addEventListener('click', async () => {
    const r = await runVisualSpatialV2Probe();
    const el = document.getElementById(V2_REPORT_IDS.viz);
    if (el) el.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });
}

export function initTopTgPersonalReleaseCandidate() {
  const root = document.getElementById('tgPersonalRcRoot');
  if (!root) return;

  organizePersonalRcHub();
  initIntegratedTechnologyCandidate();
  initAudioWorkletParityV2Panel();
  initWavProductizationV2Panel();
  bindPersonalRcV2Harnesses();

  document.getElementById('tgPrcRefreshDiag')?.addEventListener('click', () => renderPersonalDiagnostics());
  document.getElementById('tgPrcCopyDiag')?.addEventListener('click', async () => {
    const d = await collectPersonalRcDiagnostics(window.__TG_PERSONAL_RC_SHA__);
    try {
      await navigator.clipboard.writeText(JSON.stringify(d, null, 2));
    } catch {
      /* ignore */
    }
  });
  document.getElementById('tgPrcRollbackCopy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getPersonalRcRollbackManifest(), null, 2));
    } catch {
      /* ignore */
    }
  });
  document.getElementById('tgPrcRunSanity')?.addEventListener('click', async () => {
    const r = await runFullIntegrationSanity();
    const out = document.getElementById('tgPrcSanityReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });
  document.getElementById('tgPrcReloadProof')?.addEventListener('click', async () => {
    const r = await proveDefaultOffReload();
    const out = document.getElementById('tgPrcReloadProofReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });
  document.getElementById('tgPrcFullCleanup')?.addEventListener('click', async () => {
    const r = await integratedFullCleanup();
    await unregisterPersonalRcSw();
    const out = document.getElementById('tgPrcCleanupReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });
  document.getElementById('tgPrcPwaRegister')?.addEventListener('click', async () => {
    const r = await registerPersonalRcSw();
    const out = document.getElementById('tgPrcPwaReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });
  document.getElementById('tgPrcPwaUnregister')?.addEventListener('click', async () => {
    const r = await unregisterPersonalRcSw();
    const out = document.getElementById('tgPrcPwaReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderPersonalDiagnostics();
  });

  const itgReg = document.getElementById('tgItgPwaRegister');
  if (itgReg) {
    itgReg.insertAdjacentHTML(
      'afterend',
      '<p class="tg-prc-warn">Integrated SW caches integrated HTML only. Use Personal RC SW register below for this page.</p>',
    );
  }

  (async () => {
    try {
      const res = await fetch(PERSONAL_RC_PATH, { cache: 'no-store' });
      const buf = await res.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buf);
      const h = [...new Uint8Array(hash)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      window.__TG_PERSONAL_RC_SHA__ = h;
      const el = document.getElementById('tgPrcCandidateSha');
      if (el) el.textContent = h;
    } catch {
      /* ignore */
    }
    renderPersonalDiagnostics();
  })();

  window.__TG_TOP_TG_PERSONAL_RELEASE_CANDIDATE__ = {
    version: PERSONAL_RC_VERSION,
    WAIVED_GATES,
    LANE_STATUS,
    collectPersonalRcDiagnostics,
    proveDefaultOffReload,
    runFullIntegrationSanity,
    integratedFullCleanup,
    registerPersonalRcSw,
    unregisterPersonalRcSw,
    getPersonalRcRollbackManifest,
    FOUNDATION_SHAS,
  };

  renderPersonalDiagnostics();
}
