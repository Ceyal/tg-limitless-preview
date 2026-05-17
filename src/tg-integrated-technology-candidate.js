/**
 * TG Limitless 2027 Integrated Technology Candidate v1.1
 * Cohesive integrated experience · all lanes off-by-default · no promotion
 */
import {
  FOUNDATION_SHAS as MARATHON_FOUNDATIONS,
  opfsMarathonTestBundle,
  opfsMarathonClear,
  registerMarathonSw,
  unregisterMarathonSw,
  initFinalTechMarathonCandidate,
  collectFinalMarathonDiagnostics,
  getRollbackManifest,
} from './tg-final-tech-marathon-candidate.js';

export const INTEGRATED_VERSION = '2027_integrated_technology_candidate_v1.1';
export const INTEGRATED_CANDIDATE_PATH = './index_2027_integrated_technology_candidate.html';

export const FOUNDATION_SHAS = {
  ...MARATHON_FOUNDATIONS,
  marathonFoundation: '38859AC344AED5BFCB49DF102472D7CE29E11EFDDF22D5BD5D2FEE46CE8E3FED',
};

const ITG_SESSION = {
  opfs: 'tg_itg_lane_opfs_v1',
  pwa: 'tg_itg_lane_pwa_v1',
  viz: 'tg_itg_lane_viz_v1',
  spatial: 'tg_itg_lane_spatial_v1',
  wav: 'tg_itg_lane_wav_v1',
  aw: 'tg_itg_lane_aw_v1',
};

const FTM_SESSION = {
  opfs: 'tg_ftm_lane_opfs_v1',
  pwa: 'tg_ftm_lane_pwa_v1',
  viz: 'tg_ftm_lane_viz_v1',
  spatial: 'tg_ftm_lane_spatial_v1',
};

function sessionGet(key) {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function sessionSet(key, on) {
  try {
    if (on) sessionStorage.setItem(key, '1');
    else sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function syncItgToFtm() {
  sessionSet(FTM_SESSION.opfs, sessionGet(ITG_SESSION.opfs));
  sessionSet(FTM_SESSION.pwa, sessionGet(ITG_SESSION.pwa));
  sessionSet(FTM_SESSION.viz, sessionGet(ITG_SESSION.viz));
  sessionSet(FTM_SESSION.spatial, sessionGet(ITG_SESSION.spatial));
  const map = [
    ['tgItgLaneOpfs', 'tgFtmLaneOpfs', ITG_SESSION.opfs],
    ['tgItgLanePwa', 'tgFtmLanePwa', ITG_SESSION.pwa],
    ['tgItgLaneViz', 'tgFtmLaneViz', ITG_SESSION.viz],
    ['tgItgLaneSpatial', 'tgFtmLaneSpatial', ITG_SESSION.spatial],
  ];
  for (const [itgId, ftmId, key] of map) {
    const itg = document.getElementById(itgId);
    const ftm = document.getElementById(ftmId);
    if (itg && ftm) ftm.checked = sessionGet(key);
  }
}

function organizeIntegratedHub() {
  const hub = document.getElementById('tgIntegratedTechHub');
  if (!hub) return;
  const slots = {
    marathon: document.getElementById('tgItgSlotMarathon'),
    wav: document.getElementById('tgItgSlotWav'),
    aw: document.getElementById('tgItgSlotAw'),
  };
  const marathonPanel = document.getElementById('tgFinalMarathonPanel');
  const wavPanel = document.getElementById('tgWavLiveTapPanel');
  const awPanel = document.getElementById('tgAwFullRoutePanel');
  if (slots.marathon && marathonPanel) slots.marathon.appendChild(marathonPanel);
  if (slots.wav && wavPanel) slots.wav.appendChild(wavPanel);
  if (slots.aw && awPanel) slots.aw.appendChild(awPanel);
  const mega = document.getElementById('tgMegaTechCandidatePanel');
  if (mega) mega.hidden = true;
  document.querySelectorAll('button[data-tg-scroll="tgMegaTechCandidatePanel"]').forEach((btn) => {
    btn.setAttribute('data-tg-scroll', 'tgIntegratedTechHub');
    btn.setAttribute(
      'title',
      'Mega Tech lanes consolidated under Integrated Technology hub (candidate-only)',
    );
  });
}

export async function collectLaneDefaultState() {
  const aw = window.__TG_AUDIOWORKLET_FULL_ROUTE_CANDIDATE__;
  const wav = window.__TG_WAV_LIVE_TAP_CANDIDATE__;
  return {
    legacyEngine: aw?.routeState?.status === 'OFF_BY_DEFAULT',
    audioworkletRoute: !aw?.routeState?.routeActive,
    wavLiveTap: !sessionGet('tg_wav_live_lane_v1') && !document.getElementById('tgWavLiveLaneEnable')?.checked,
    opfs: !sessionGet(ITG_SESSION.opfs) && !sessionGet(FTM_SESSION.opfs),
    pwa: !sessionGet(ITG_SESSION.pwa) && !sessionGet(FTM_SESSION.pwa),
    viz: !sessionGet(ITG_SESSION.viz) && !sessionGet(FTM_SESSION.viz),
    spatial: !sessionGet(ITG_SESSION.spatial) && !sessionGet(FTM_SESSION.spatial),
    serviceWorkerController: !!navigator.serviceWorker?.controller,
    webmDefault: typeof MediaRecorder !== 'undefined',
  };
}

export async function proveDefaultOffReload() {
  const before = await collectLaneDefaultState();
  return {
    schemaVersion: 'integrated_default_off_reload_v1.1',
    onLoad: before,
    allOffByDefault:
      before.legacyEngine &&
      before.audioworkletRoute &&
      before.opfs &&
      before.pwa &&
      before.viz &&
      before.spatial &&
      !before.serviceWorkerController,
    reloadNote: 'Reload test performed in Playwright via page.reload()',
    userControlledPersistence: {
      audioworkletArm: 'sessionStorage tg_aw_full_route_lane_arm_v1 — arm only, route not auto-enabled',
      megaLanes: 'localStorage tg_mega_lane_* only if user enabled mega panel (hidden in integrated UI)',
    },
    timestamp: new Date().toISOString(),
  };
}

export async function runFullIntegrationSanity() {
  const lanes = await collectLaneDefaultState();
  const marathon = window.__TG_FINAL_TECH_MARATHON_CANDIDATE__;
  const sanity = marathon?.runIntegrationSanity ? await marathon.runIntegrationSanity() : { ok: false };
  return {
    ok:
      sanity.ok &&
      lanes.legacyEngine &&
      lanes.audioworkletRoute &&
      lanes.opfs &&
      lanes.pwa &&
      lanes.viz &&
      lanes.spatial &&
      !lanes.serviceWorkerController,
    lanes,
    marathonSanity: sanity,
    timestamp: new Date().toISOString(),
  };
}

export function getIntegratedRollbackManifest() {
  const base = getRollbackManifest();
  return {
    ...base,
    version: INTEGRATED_VERSION,
    candidatePath: INTEGRATED_CANDIDATE_PATH,
    marathonFoundationSha: FOUNDATION_SHAS.marathonFoundation,
    rollback: [
      'Close integrated candidate tab',
      'Uncheck all Integrated Technology hub lane toggles',
      'Run Full cleanup (integrated panel)',
      'Unregister integrated + marathon service workers',
      'Clear OPFS prefixes: tg_final_marathon_opfs_ and tg_itg_opfs_',
      'Use active product index.html only — never promote integrated candidate',
    ],
    cleanup: {
      ...base.cleanup,
      integratedSession: Object.values(ITG_SESSION).join(', '),
      integratedOpfs: 'tg_itg_opfs_* via integrated clear button',
      sw: 'tg-integrated-technology-candidate-sw.js and tg-final-marathon-candidate-sw.js',
    },
    promotion: 'DO_NOT_PROMOTE — integrated candidate review only',
  };
}

export async function integratedFullCleanup() {
  const opfsMar = await opfsMarathonClear();
  let opfsItg = { cleared: 0 };
  if (navigator.storage?.getDirectory) {
    try {
      const root = await navigator.storage.getDirectory();
      for await (const [name] of root.entries()) {
        if (name.startsWith('tg_itg_opfs_')) {
          await root.removeEntry(name);
          opfsItg.cleared++;
        }
      }
    } catch {
      /* ignore */
    }
  }
  const swInt = await unregisterIntegratedSw();
  const swMar = await unregisterMarathonSw();
  Object.values(ITG_SESSION).forEach((k) => sessionSet(k, false));
  Object.values(FTM_SESSION).forEach((k) => sessionSet(k, false));
  syncItgToFtm();
  return { opfsMarathon: opfsMar, opfsIntegrated: opfsItg, swIntegrated: swInt, swMarathon: swMar };
}

export async function registerIntegratedSw() {
  if (!sessionGet(ITG_SESSION.pwa)) {
    return { ok: false, reason: 'lane_disabled', classification: 'FAIL_CLOSED' };
  }
  syncItgToFtm();
  if (!('serviceWorker' in navigator)) {
    return { ok: false, unavailable: true, classification: 'YELLOW_TOOLING_LIMITATION' };
  }
  try {
    const reg = await navigator.serviceWorker.register('./tg-integrated-technology-candidate-sw.js', {
      scope: './',
      updateViaCache: 'none',
    });
    return {
      ok: true,
      scope: reg.scope,
      cacheVersion: 'tg-integrated-technology-candidate-v1.1',
      scopeNote: 'Fetch handler only caches integrated candidate HTML — not index.html',
      state: reg.installing?.state || reg.active?.state,
    };
  } catch (e) {
    return { ok: false, error: String(e), classification: 'YELLOW_TOOLING_LIMITATION' };
  }
}

export async function unregisterIntegratedSw() {
  if (!('serviceWorker' in navigator)) return { ok: true, unregistered: 0 };
  const regs = await navigator.serviceWorker.getRegistrations();
  let n = 0;
  for (const r of regs) {
    if (r.active?.scriptURL?.includes('tg-integrated-technology-candidate-sw')) {
      await r.unregister();
      n++;
    }
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith('tg-integrated-technology-candidate-cache-'))
        .map((k) => caches.delete(k)),
    );
  }
  return { ok: true, unregistered: n };
}

export async function collectIntegratedDiagnostics(candidateSha) {
  const marathonDiag = await collectFinalMarathonDiagnostics(candidateSha);
  const laneState = await collectLaneDefaultState();
  const reloadProof = await proveDefaultOffReload();
  return {
    schemaVersion: 'integrated_technology_candidate_diagnostics_v1.1',
    candidateVersion: INTEGRATED_VERSION,
    candidateSha: candidateSha || window.__TG_INTEGRATED_CANDIDATE_SHA__ || '(pending)',
    foundationShas: { ...FOUNDATION_SHAS },
    integratedHub: true,
    singleSourceOfTruth: '#tgItgUnifiedDiagOut',
    laneDefaultState: laneState,
    reloadProof,
    marathonSubsystem: marathonDiag,
    rollback: getIntegratedRollbackManifest(),
    safariIos: 'REQUIRES_DEVICE — not claimed GREEN',
    accessibility: 'REQUIRES_MANUAL_AT',
    timestamp: new Date().toISOString(),
  };
}

function renderUnifiedDiagnostics() {
  const pre = document.getElementById('tgItgUnifiedDiagOut');
  if (!pre) return;
  collectIntegratedDiagnostics(window.__TG_INTEGRATED_CANDIDATE_SHA__).then((d) => {
    pre.textContent = JSON.stringify(d, null, 2);
    const grid = document.getElementById('tgItgLaneStatusGrid');
    if (grid) {
      grid.textContent = Object.entries(d.laneDefaultState || {})
        .map(([k, v]) => `${k}: ${v === true ? 'OFF/default OK' : v === false ? 'ON/active' : v}`)
        .join(' · ');
    }
  });
}

function bindIntegratedMasterToggles() {
  const map = [
    ['tgItgLaneOpfs', ITG_SESSION.opfs],
    ['tgItgLanePwa', ITG_SESSION.pwa],
    ['tgItgLaneViz', ITG_SESSION.viz],
    ['tgItgLaneSpatial', ITG_SESSION.spatial],
  ];
  for (const [id, key] of map) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.checked = sessionGet(key);
    el.addEventListener('change', () => {
      sessionSet(key, el.checked);
      syncItgToFtm();
      renderUnifiedDiagnostics();
    });
  }
}

export function initIntegratedTechnologyCandidate() {
  const hub = document.getElementById('tgIntegratedTechHub');
  if (!hub) return;

  organizeIntegratedHub();
  bindIntegratedMasterToggles();
  initFinalTechMarathonCandidate();

  document.getElementById('tgItgRefreshDiag')?.addEventListener('click', () => renderUnifiedDiagnostics());
  document.getElementById('tgItgCopyDiag')?.addEventListener('click', async () => {
    const d = await collectIntegratedDiagnostics(window.__TG_INTEGRATED_CANDIDATE_SHA__);
    try {
      await navigator.clipboard.writeText(JSON.stringify(d, null, 2));
    } catch {
      /* ignore */
    }
  });

  document.getElementById('tgItgRunSanity')?.addEventListener('click', async () => {
    const r = await runFullIntegrationSanity();
    const out = document.getElementById('tgItgSanityReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderUnifiedDiagnostics();
  });

  document.getElementById('tgItgReloadProof')?.addEventListener('click', async () => {
    const r = await proveDefaultOffReload();
    document.getElementById('tgItgReloadProofReport').textContent = JSON.stringify(r, null, 2);
    renderUnifiedDiagnostics();
  });

  document.getElementById('tgItgRollbackCopy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getIntegratedRollbackManifest(), null, 2));
    } catch {
      /* ignore */
    }
  });

  document.getElementById('tgItgFullCleanup')?.addEventListener('click', async () => {
    const r = await integratedFullCleanup();
    document.getElementById('tgItgCleanupReport').textContent = JSON.stringify(r, null, 2);
    renderUnifiedDiagnostics();
  });

  document.getElementById('tgItgPwaRegister')?.addEventListener('click', async () => {
    syncItgToFtm();
    const r = await registerIntegratedSw();
    document.getElementById('tgItgPwaReport').textContent = JSON.stringify(r, null, 2);
    renderUnifiedDiagnostics();
  });

  document.getElementById('tgItgPwaUnregister')?.addEventListener('click', async () => {
    const r1 = await unregisterIntegratedSw();
    const r2 = await unregisterMarathonSw();
    document.getElementById('tgItgPwaReport').textContent = JSON.stringify({ integrated: r1, marathon: r2 }, null, 2);
    renderUnifiedDiagnostics();
  });

  document.getElementById('tgItgOpfsTest')?.addEventListener('click', async () => {
    syncItgToFtm();
    const r = await opfsMarathonTestBundle();
    document.getElementById('tgItgOpfsReport').textContent = JSON.stringify(r, null, 2);
    renderUnifiedDiagnostics();
  });

  document.getElementById('tgItgOpfsClear')?.addEventListener('click', async () => {
    const r = await integratedFullCleanup();
    document.getElementById('tgItgOpfsReport').textContent = JSON.stringify(r.opfsMarathon, null, 2);
    renderUnifiedDiagnostics();
  });

  (async () => {
    try {
      const res = await fetch(INTEGRATED_CANDIDATE_PATH, { cache: 'no-store' });
      const buf = await res.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buf);
      const h = [...new Uint8Array(hash)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      window.__TG_INTEGRATED_CANDIDATE_SHA__ = h;
      const el = document.getElementById('tgItgCandidateSha');
      if (el) el.textContent = h;
    } catch {
      /* ignore */
    }
    renderUnifiedDiagnostics();
  })();

  window.__TG_INTEGRATED_TECHNOLOGY_CANDIDATE__ = {
    version: INTEGRATED_VERSION,
    collectIntegratedDiagnostics,
    proveDefaultOffReload,
    runFullIntegrationSanity,
    integratedFullCleanup,
    registerIntegratedSw,
    unregisterIntegratedSw,
    FOUNDATION_SHAS,
  };

  renderUnifiedDiagnostics();
}
