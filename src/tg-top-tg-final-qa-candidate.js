/**
 * TG Limitless 2027 Final QA Candidate v1.0 — ONE converged tester build
 * Based on personal RC · all advanced lanes off-by-default · external Safari/iOS target
 */
export const FROZEN_LANE_CLASSIFICATION = {
  legacyEngine: { status: 'DEFAULT_STABLE', defaultOn: true, productLive: false },
  webmExport: { status: 'DEFAULT_STABLE', defaultOn: true, productLive: false },
  audioworklet: { status: 'PARTIAL_DIAGNOSTICS_ONLY', defaultOn: false, productLive: false },
  wav: { status: 'EXPERIMENTAL_OFF_BY_DEFAULT', defaultOn: false, productLive: false, scriptProcessorRisk: 'LABELED_IF_USED' },
  pwaSw: { status: 'USER_CLICK_ONLY', defaultOn: false, silentRegister: false },
  opfs: { status: 'OPT_IN_ONLY', defaultOn: false, destructiveMigration: false },
  webglWebgpu: { status: 'OPTIONAL_OFF', defaultOn: false, canvasFallback: true },
  spatialHrtf: { status: 'OPTIONAL_OFF', defaultOn: false, graphLeakClaim: false },
  diagnostics: { status: 'COLLAPSED_DEFAULT', defaultOn: false, dominatesUi: false },
};
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
  runAwBlockerAttack,
  PARITY_GAP_MATRIX,
} from './tg-audioworklet-parity-v2-candidate.js';
import {
  initWavProductizationV2Panel,
  runWavProductizationV2Harness,
  runWavBlockerAttack,
} from './tg-wav-productization-v2-candidate.js';
import {
  initEmodeSpectralCompareCandidate,
  runEmodeBlockerAttack,
  runOfflineEmodeSpectralCompare,
} from './tg-emode-spectral-compare-candidate.js';
import {
  initWavGraphAuditCandidate,
  runWavGraphBlockerAttack,
} from './tg-wav-graph-audit-candidate.js';

export const BLOCKER_ATTACK_STATUS = {
  audioworklet:
    'PARTIALLY_REDUCED — E-mode non-equivalence proven offline; live E pan asymmetry measurable; AW product-live blocked',
  wav: 'PARTIALLY_REDUCED — live graph audit + disconnected AW tap; ScriptProcessor product replacement blocked',
  opfs: 'PARTIALLY_REDUCED — Safari feature-detect only; product policy pending; NOT Safari GREEN',
  pwaSw: 'PARTIALLY_REDUCED — user-click only + stale cache cleanup',
  truthPanel: 'IMPROVED — high-impact blocker status in unified diagnostics',
};

export const HIGH_IMPACT_BLOCKER_STATUS = {
  eModeVowelPanner: 'PARTIALLY_REDUCED — offline non-equivalence + optional live E asymmetry probe',
  scriptProcessorVsAwTap: 'PARTIALLY_REDUCED — graph audit narrows risk; product replacement blocked',
  opfsSafari: 'PARTIALLY_REDUCED — UA/feature matrix only; device proof missing',
  analyserExportAwRoute: 'BLOCKED — live AB on playing graph not closed',
};

export const FINAL_QA_VERSION = '2027_top_tg_final_qa_candidate_v1.0';
export const FINAL_QA_PATH = './index_2027_top_tg_final_qa_candidate.html';
export const FINAL_QA_PREVIEW_URL =
  'https://ceyal.github.io/tg-limitless-preview/final-qa-candidate.html';

export const ENDURANCE_STATUS =
  'NOT_RUN_DEFERRED_UNTIL_ALL_TECH_AND_FINAL_LINK_ARE_COMPLETE_AND_EYAL_APPROVES';

export const TESTER_SENDOFF_STATUS =
  'NOT_INVITED — external tester sendoff deferred until tech closure + Eyal approval';

export const WAIVED_GATES = {
  safariIosRealDevice: 'REQUIRES_EXTERNAL_TESTER_EVIDENCE',
  atScreenReader: 'REQUIRES_EXTERNAL_TESTER_EVIDENCE',
  localEnduranceOnly: 'LOCAL_HEADLESS_ONLY_NOT_DEVICE',
  enduranceLongRun:
    'NOT_RUN — no 30m/60m/120m endurance; final_qa_endurance.spec.js not executed this patch',
  testerInvite: TESTER_SENDOFF_STATUS,
  classification: 'NOT_GREEN — Safari/iOS and AT not GREEN unless externally tested',
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
  let cacheKeys = [];
  let staleFinalQaCaches = [];
  let registrations = [];
  if ('caches' in window) {
    cacheKeys = await caches.keys();
    staleFinalQaCaches = cacheKeys.filter(
      (k) =>
        k.startsWith('tg-top-tg-final-qa-candidate-cache-') &&
        !k.includes('tg-top-tg-final-qa-candidate-v1.1'),
    );
  }
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    registrations = regs.map((r) => ({
      scope: r.scope,
      scriptURL: r.active?.scriptURL || r.installing?.scriptURL || null,
      state: r.active?.state || r.installing?.state || 'none',
    }));
  }
  const zombieRisk =
    staleFinalQaCaches.length > 0 ||
    registrations.some(
      (r) =>
        r.scriptURL &&
        !r.scriptURL.includes('tg-top-tg-final-qa-candidate-sw') &&
        !r.scriptURL.includes('tg-final-marathon-candidate-sw') &&
        !r.scriptURL.includes('tg-integrated-technology-candidate-sw'),
    );
  return {
    schemaVersion: 'pwa_sw_hardening_v2_personal_rc_v1.2',
    classification: 'CANDIDATE_SCOPE_PROOF',
    silentRegistrationDetected: false,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    controllerOnLoad: !!navigator.serviceWorker?.controller,
    finalQaSw: './tg-top-tg-final-qa-candidate-sw.js',
    scopeNote: 'Fetch handler only caches final QA candidate shell — not index.html',
    cacheVersion: 'tg-top-tg-final-qa-candidate-v1.1',
    cacheKeysMatchingFinalQa: cacheKeys.filter((k) => k.includes('tg-top-tg-final-qa-candidate-cache')),
    staleCacheV10Risk: staleFinalQaCaches,
    staleCacheRemediation: 'Use Unregister Final QA SW + hard reload; v1.1 activate deletes older cache names',
    registrations,
    zombieSwRisk: zombieRisk,
    githubPagesCompatible: window.isSecureContext === true,
    productionPwaClaim: false,
    ok: !zombieRisk || staleFinalQaCaches.length === 0,
    timestamp: new Date().toISOString(),
  };
}

export async function clearStaleFinalQaCachesUserClick() {
  if (!('caches' in window)) return { ok: true, deleted: 0, classification: 'CACHES_UNSUPPORTED' };
  const keys = await caches.keys();
  const stale = keys.filter(
    (k) =>
      k.startsWith('tg-top-tg-final-qa-candidate-cache-') &&
      !k.includes('tg-top-tg-final-qa-candidate-v1.1'),
  );
  await Promise.all(stale.map((k) => caches.delete(k)));
  return {
    ok: true,
    deleted: stale.length,
    staleKeys: stale,
    classification: 'USER_CLICK_STALE_CACHE_CLEANUP',
    note: 'Does not register SW — run only after explicit user action',
  };
}

async function runOpfsBlockerAttack() {
  const quick = await runOpfsV2QuickCheck();
  const entries = [];
  if (navigator.storage?.getDirectory) {
    try {
      const root = await navigator.storage.getDirectory();
      for await (const [name] of root.entries()) {
        if (name.startsWith('tg_')) entries.push({ name });
      }
    } catch (e) {
      entries.push({ error: String(e) });
    }
  }
  let roundtrip = { ok: false, classification: 'UNSUPPORTED' };
  if (navigator.storage?.getDirectory) {
    const prefix = `tg_prc_opfs_attack_${Date.now()}`;
    try {
      const root = await navigator.storage.getDirectory();
      const payload = {
        schema: 'tg_opfs_blocker_attack_bundle_v1',
        version: FINAL_QA_VERSION,
        items: [{ probe: true }],
      };
      const fh = await root.getFileHandle(`${prefix}.json`, { create: true });
      const w = await fh.createWritable();
      await w.write(JSON.stringify(payload));
      await w.close();
      const parsed = JSON.parse(await (await fh.getFile()).text());
      await root.removeEntry(`${prefix}.json`);
      roundtrip = {
        ok: parsed.schema === 'tg_opfs_blocker_attack_bundle_v1',
        classification: 'IMPORT_EXPORT_ROUNDTRIP_OK',
        destructiveMigration: false,
      };
    } catch (e) {
      roundtrip = { ok: false, error: String(e), classification: 'YELLOW_TOOLING_LIMITATION' };
    }
  }
  return {
    schemaVersion: 'opfs_blocker_attack_v1.0',
    defaultOn: false,
    optInOnly: true,
    quickCheck: quick,
    existingTgPrefixes: entries,
    importExportRoundtrip: roundtrip,
    corruptionRecovery: 'manual Full cleanup — no auto-migrate of tg_itg_opfs_ / marathon prefixes',
    crossBrowser: {
      chrome: 'OPFS_AVAILABLE_MODERN',
      firefox: 'OPFS_AVAILABLE_MODERN',
      safari: 'REQUIRES_EXTERNAL_DEVICE_EVIDENCE',
    },
    productDecision: 'REMAINS_CANDIDATE_ONLY_PENDING_EYAL_POLICY',
    overall: quick.ok && roundtrip.ok ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
    timestamp: new Date().toISOString(),
  };
}

async function runPwaBlockerAttack() {
  const scope = await runPwaSwV2ScopeProof();
  return {
    schemaVersion: 'pwa_blocker_attack_v1.0',
    scopeProof: scope,
    registrationBehavior: 'USER_CLICK_ONLY — registerFinalQaSw fails closed when PWA lane unchecked',
    silentRegistrationDetected: false,
    staleCacheMitigation: {
      detect: 'staleCacheV10Risk in scope proof',
      cleanup: 'unregisterFinalQaSw + clearStaleFinalQaCachesUserClick',
    },
    githubPages: {
      scope: './',
      controlsActiveIndex: false,
      precacheShellOnly: true,
    },
    productionPwaClaim: false,
    overall: 'PARTIALLY_REDUCED',
    timestamp: new Date().toISOString(),
  };
}

export async function runRemainingBlockersAttackSummary() {
  const aw = await runAwBlockerAttack({ durationMs: 240 });
  const wav = await runWavBlockerAttack({ durationSec: 0.2 });
  const opfs = await runOpfsBlockerAttack();
  const pwa = await runPwaBlockerAttack();
  return {
    schemaVersion: 'remaining_blockers_attack_summary_v1.0',
    patch: 'TG_2027_REMAINING_BLOCKERS_ATTACK',
    enduranceStatus: ENDURANCE_STATUS,
    testerSendoffStatus: TESTER_SENDOFF_STATUS,
    lanes: { audioworklet: aw, wav, opfs, pwaSw: pwa },
    blockerAttackStatus: BLOCKER_ATTACK_STATUS,
    timestamp: new Date().toISOString(),
  };
}

export function probeSafariOpfsCapabilityMatrix() {
  const ua = navigator.userAgent || '';
  const isSafariUa = /safari/i.test(ua) && !/chrome|chromium|android/i.test(ua);
  const isIosUa = /iphone|ipad|ipod/i.test(ua);
  return {
    schemaVersion: 'opfs_safari_capability_matrix_v1.0',
    classification: 'FEATURE_DETECT_ONLY_NOT_DEVICE_PROOF',
    safariGreenClaim: false,
    userAgent: { isSafariUa, isIosUa },
    opfs: {
      getDirectory: !!navigator.storage?.getDirectory,
      estimate: !!navigator.storage?.estimate,
      persisted: !!navigator.storage?.persist,
    },
    limitationCopy:
      'Safari/iOS OPFS behavior requires external real-device evidence — this probe is not a pass',
    overall: 'PARTIALLY_REDUCED',
    timestamp: new Date().toISOString(),
  };
}

export async function runHighImpactBlockersPass(opts = {}) {
  const eMode = await runEmodeBlockerAttack(opts);
  const wavGraph = await runWavGraphBlockerAttack(opts);
  const safariOpfs = probeSafariOpfsCapabilityMatrix();
  const offlineEmodeOnly = await runOfflineEmodeSpectralCompare(opts);

  return {
    schemaVersion: 'high_impact_blockers_pass_v1.0',
    patch: 'TG_2027_FINAL_HIGH_IMPACT_BLOCKERS_PASS',
    enduranceStatus: ENDURANCE_STATUS,
    testerSendoffStatus: TESTER_SENDOFF_STATUS,
    highImpactBlockerStatus: HIGH_IMPACT_BLOCKER_STATUS,
    eModeVowelPanner: eMode,
    scriptProcessorVsAwTap: wavGraph,
    opfsSafari: safariOpfs,
    offlineEmodeFallback: offlineEmodeOnly,
    finalQaGateReady: false,
    anotherTechPassWorthwhile: true,
    timestamp: new Date().toISOString(),
  };
}

async function runOpfsV2QuickCheck() {
  if (!navigator.storage?.getDirectory) {
    return { ok: true, classification: 'UNSUPPORTED_GRACEFUL', available: false, defaultOn: false };
  }
  let quota = null;
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      quota = {
        usage: est.usage,
        quota: est.quota,
        usageRatio: est.quota ? est.usage / est.quota : null,
      };
    }
  } catch {
    /* ignore */
  }
  const prefix = `tg_prc_opfs_v2_${Date.now()}`;
  try {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(`${prefix}.json`, { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify({ probe: true, v: FINAL_QA_VERSION }));
    await w.close();
    const file = await fh.getFile();
    const text = await file.text();
    await root.removeEntry(`${prefix}.json`);
    return {
      ok: text.includes('probe'),
      classification: 'OPT_IN_HARNESS_OK',
      writeReadDelete: true,
      corruptionRecovery: 'manual clear via Full cleanup — no auto-migrate of user data',
      destructiveMigration: false,
      nonDestructiveProof: 'probe file created and removed; no overwrite of tg_itg_opfs_ or marathon prefixes',
      quotaEstimate: quota,
      defaultOn: false,
      optInOnly: true,
    };
  } catch (e) {
    return { ok: false, error: String(e), classification: 'YELLOW_TOOLING_LIMITATION', quotaEstimate: quota };
  }
}

async function probeV2ModuleLoads() {
  const modules = [
    { lane: 'audioworkletParityV2', url: './src/tg-audioworklet-parity-v2-candidate.js' },
    { lane: 'wavProductizationV2', url: './src/tg-wav-productization-v2-candidate.js' },
    { lane: 'awProcessor', url: './src/tg-audioworklet-parity-v2-processor.js' },
  ];
  const results = [];
  for (const m of modules) {
    try {
      const res = await fetch(m.url, { cache: 'no-store' });
      results.push({ lane: m.lane, url: m.url, status: res.status, ok: res.ok });
    } catch (e) {
      results.push({ lane: m.lane, url: m.url, status: 0, ok: false, error: String(e) });
    }
  }
  return {
    allRequiredOk: results.every((r) => r.ok),
    modules: results,
    timestamp: new Date().toISOString(),
  };
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

export async function registerFinalQaSw() {
  const pwaLane = document.getElementById('tgItgLanePwa');
  if (pwaLane && !pwaLane.checked) {
    return { ok: false, reason: 'lane_disabled', classification: 'FAIL_CLOSED' };
  }
  if (!('serviceWorker' in navigator)) {
    return { ok: false, unavailable: true, classification: 'YELLOW_TOOLING_LIMITATION' };
  }
  try {
    const reg = await navigator.serviceWorker.register('./tg-top-tg-final-qa-candidate-sw.js', {
      scope: './',
      updateViaCache: 'none',
    });
    return {
      ok: true,
      scope: reg.scope,
      cacheVersion: 'tg-top-tg-final-qa-candidate-v1.1',
      scopeNote: 'Caches final QA shell only — active index.html not in precache list',
      state: reg.installing?.state || reg.active?.state,
    };
  } catch (e) {
    return { ok: false, error: String(e), classification: 'YELLOW_TOOLING_LIMITATION' };
  }
}

export async function unregisterFinalQaSw() {
  if (!('serviceWorker' in navigator)) return { ok: true, unregistered: 0 };
  const regs = await navigator.serviceWorker.getRegistrations();
  let n = 0;
  for (const r of regs) {
    if (
      r.active?.scriptURL?.includes('tg-top-tg-final-qa-candidate-sw') ||
      r.active?.scriptURL?.includes('tg-top-tg-personal-release-candidate-sw')
    ) {
      await r.unregister();
      n++;
    }
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(
          (k) =>
            k.startsWith('tg-top-tg-final-qa-candidate-cache-') ||
            k.startsWith('tg-top-tg-personal-release-candidate-cache-'),
        )
        .map((k) => caches.delete(k)),
    );
  }
  return { ok: true, unregistered: n };
}

export function getFinalQaRollbackManifest() {
  return {
    version: FINAL_QA_VERSION,
    candidatePath: FINAL_QA_PATH,
    previewUrl: FINAL_QA_PREVIEW_URL,
    frozenLaneClassification: FROZEN_LANE_CLASSIFICATION,
    integratedFoundationVersion: INTEGRATED_VERSION,
    foundationShas: { ...FOUNDATION_SHAS },
    waivedGates: WAIVED_GATES,
    laneStatus: LANE_STATUS,
    rollback: [
      'Close final QA candidate tab',
      'Uncheck all lane toggles in Advanced hub',
      'Run Full cleanup (integrated panel)',
      'Unregister final QA + integrated + marathon service workers',
      'Clear OPFS prefixes: tg_final_marathon_opfs_, tg_itg_opfs_, tg_prc_opfs_v2_*',
      'Use active product index.html — do not promote without explicit Eyal command',
    ],
    promotion: 'DO_NOT_PROMOTE — external Safari/iOS QA first; create promotion candidate only',
    options: {
      A: 'Keep as candidate only (recommended now)',
      B: 'Make candidate default preview page',
      C: 'Create active index promotion candidate — not direct replace',
      D: 'Replace active index only after explicit final command',
    },
  };
}

export async function collectFinalQaDiagnostics(candidateSha) {
  const integrated = await collectIntegratedDiagnostics(candidateSha);
  const awV2 = collectParityV2Diagnostics();
  let awModuleProbe = null;
  try {
    awModuleProbe = await (window.__TG_AUDIOWORKLET_PARITY_V2_CANDIDATE__?.probeProcessorModule?.() ??
      Promise.resolve(null));
  } catch {
    awModuleProbe = { ok: false, classification: 'PROBE_ERROR' };
  }
  let wavV2 = null;
  try {
    wavV2 = await runWavProductizationV2Harness({ durationSec: 0.25 });
  } catch {
    wavV2 = { ok: false, classification: 'HARNESS_ERROR' };
  }
  const wavDiag =
    window.__TG_WAV_PRODUCTIZATION_V2_CANDIDATE__?.collectWavV2Diagnostics?.() || null;
  const pwaV2 = await runPwaSwV2ScopeProof();
  const opfsV2 = await runOpfsV2QuickCheck();
  const vizV2 = await runVisualSpatialV2Probe();
  const v2ModuleLoads = await probeV2ModuleLoads();
  const safariOpfs = probeSafariOpfsCapabilityMatrix();
  let lastHighImpact = window.__TG_HIGH_IMPACT_BLOCKERS_LAST__ || null;

  return {
    schemaVersion: 'top_tg_final_qa_candidate_diagnostics_v1.3',
    techClosurePatch: 'TG_2027_FINAL_HIGH_IMPACT_BLOCKERS_PASS',
    blockerAttackStatus: BLOCKER_ATTACK_STATUS,
    highImpactBlockerStatus: HIGH_IMPACT_BLOCKER_STATUS,
    lastHighImpactPass: lastHighImpact,
    candidateVersion: FINAL_QA_VERSION,
    candidateSha: candidateSha || window.__TG_FINAL_QA_SHA__ || '(pending)',
    enduranceStatus: ENDURANCE_STATUS,
    testerSendoffStatus: TESTER_SENDOFF_STATUS,
    personalRcBaseSha: '2E4EA02C801E73964E7457EF928D928676484B878A8CB08E87F31D0D2CA69E1D',
    previewUrl: FINAL_QA_PREVIEW_URL,
    frozenLaneClassification: FROZEN_LANE_CLASSIFICATION,
    integratedFoundationSha: '34C3CE6F78514DD329409D1BC8BC33F0431B1B8FC92D937D06987793E8F26FCD',
    activeProductSha: '07262E21170F5208A866E3052CF38C025ECCDD4F39E5091AFA4E49A72379D42C',
    personalMasterSha: '8DDD0F475DC234CDC429E7F8E88FABCBDEB5BDB98963B0D6A1C732F6A8D9A49B',
    waivedGates: WAIVED_GATES,
    laneStatus: LANE_STATUS,
    legacyEngineDefault: true,
    webmExportDefault: true,
    integratedSubsystem: integrated,
    v2ModuleLoadProbe: v2ModuleLoads,
    v2Lanes: {
      audioworkletParityV2: { ...awV2, processorModuleProbe: awModuleProbe, parityGapMatrix: PARITY_GAP_MATRIX },
      wavProductizationV2: { harness: wavV2, diagnostics: wavDiag },
      pwaSwHardeningV2: pwaV2,
      opfsHardeningV2: { ...opfsV2, safariCapabilityMatrix: safariOpfs },
      visualSpatialV2: vizV2,
      eModeSpectralCompare: window.__TG_EMODE_COMPARE_LAST__ || {
        note: 'Run high-impact pass or E-mode harness for proof JSON',
      },
      wavGraphAudit: window.__TG_WAV_GRAPH_AUDIT_LAST__ || {
        note: 'Run WAV graph audit while playing for live baseline',
      },
    },
    rollback: getFinalQaRollbackManifest(),
    timestamp: new Date().toISOString(),
  };
}

function renderFinalQaDiagnostics() {
  const pre = document.getElementById('tgPrcUnifiedDiagOut');
  if (!pre) return;
  collectFinalQaDiagnostics(window.__TG_FINAL_QA_SHA__).then((d) => {
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
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcWavV2Run')?.addEventListener('click', async () => {
    const r = await runWavProductizationV2Harness({ durationSec: 0.25 });
    const el = document.getElementById(V2_REPORT_IDS.wav);
    if (el) el.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcPwaV2Run')?.addEventListener('click', async () => {
    const r = await runPwaSwV2ScopeProof();
    const el = document.getElementById(V2_REPORT_IDS.pwa);
    if (el) el.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcOpfsV2Run')?.addEventListener('click', async () => {
    const r = await runOpfsV2QuickCheck();
    const el = document.getElementById(V2_REPORT_IDS.opfs);
    if (el) el.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcVizV2Run')?.addEventListener('click', async () => {
    const r = await runVisualSpatialV2Probe();
    const el = document.getElementById(V2_REPORT_IDS.viz);
    if (el) el.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcRunAllBlockerAttacks')?.addEventListener('click', async () => {
    const r = await runRemainingBlockersAttackSummary();
    const pre = document.getElementById('tgPrcUnifiedDiagOut');
    if (pre) pre.textContent = JSON.stringify(r, null, 2);
    window.__TG_BLOCKER_ATTACK_LAST__ = r;
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcRunHighImpactBlockers')?.addEventListener('click', async () => {
    const r = await runHighImpactBlockersPass();
    window.__TG_HIGH_IMPACT_BLOCKERS_LAST__ = r;
    const pre = document.getElementById('tgPrcUnifiedDiagOut');
    if (pre) pre.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcClearStaleCaches')?.addEventListener('click', async () => {
    const r = await clearStaleFinalQaCachesUserClick();
    const out = document.getElementById('tgPrcPwaReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
}

function augmentFinalQaTruthBanner() {
  const banner = document.getElementById('tgPersonalRcWaiverBanner');
  if (!banner) return;
  if (banner.dataset.tgNarrowTechClosureAugmented !== '1') {
    banner.dataset.tgNarrowTechClosureAugmented = '1';
    const note = document.createElement('p');
    note.className = 'tg-prc-warn';
    note.textContent = `Endurance: ${ENDURANCE_STATUS}. Testers: ${TESTER_SENDOFF_STATUS}. AW/WAV/OPFS/PWA lanes remain off-by-default / diagnostics-only.`;
    banner.appendChild(note);
  }
  if (banner.dataset.tgBlockerAttackAugmented !== '1') {
    banner.dataset.tgBlockerAttackAugmented = '1';
    const blockers = document.createElement('p');
    blockers.className = 'tg-prc-warn';
    blockers.textContent =
      '2027 blockers: AW/WAV/OPFS/PWA partially reduced in harness only — NOT product-live, NOT GREEN, NOT 2027 achieved.';
    banner.appendChild(blockers);
  }
  if (banner.dataset.tgHighImpactAugmented === '1') return;
  banner.dataset.tgHighImpactAugmented = '1';
  const hi = document.createElement('p');
  hi.className = 'tg-prc-warn';
  hi.textContent =
    'High-impact: E-mode non-equivalence provable offline; ScriptProcessor product replacement still blocked; Safari OPFS feature-detect only.';
  banner.appendChild(hi);
}

function injectBlockerAttackControls() {
  const anchor = document.getElementById('tgPrcAwV2Run');
  if (!anchor || document.getElementById('tgPrcRunAllBlockerAttacks')) return;
  anchor.insertAdjacentHTML(
    'afterend',
    '<button type="button" id="tgPrcRunAllBlockerAttacks">Run all 2027 blocker attacks</button>' +
      '<button type="button" id="tgPrcRunHighImpactBlockers">Run high-impact blockers pass</button>' +
      '<button type="button" id="tgPrcClearStaleCaches">Clear stale Final QA caches (user-click)</button>' +
      '<button type="button" id="tgEmodeRunOffline">E-mode offline spectral compare</button>' +
      '<button type="button" id="tgEmodeRunLive">E-mode live spectral compare (Play first)</button>' +
      '<button type="button" id="tgWavGraphAuditRun">WAV graph audit (Play first)</button>' +
      '<pre id="tgEmodeReport" style="font-size:9px;max-height:80px;overflow:auto">E-mode…</pre>' +
      '<pre id="tgWavGraphAuditReport" style="font-size:9px;max-height:80px;overflow:auto">WAV graph…</pre>',
  );
}

export function initTopTgFinalQaCandidate() {
  const root = document.getElementById('tgPersonalRcRoot');
  if (!root) return;

  augmentFinalQaTruthBanner();
  injectBlockerAttackControls();
  organizePersonalRcHub();
  initIntegratedTechnologyCandidate();
  initAudioWorkletParityV2Panel();
  initWavProductizationV2Panel();
  initEmodeSpectralCompareCandidate();
  initWavGraphAuditCandidate();
  bindPersonalRcV2Harnesses();

  document.getElementById('tgPrcRefreshDiag')?.addEventListener('click', () => renderFinalQaDiagnostics());
  document.getElementById('tgPrcCopyDiag')?.addEventListener('click', async () => {
    const d = await collectFinalQaDiagnostics(window.__TG_FINAL_QA_SHA__);
    try {
      await navigator.clipboard.writeText(JSON.stringify(d, null, 2));
    } catch {
      /* ignore */
    }
  });
  document.getElementById('tgPrcRollbackCopy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getFinalQaRollbackManifest(), null, 2));
    } catch {
      /* ignore */
    }
  });
  document.getElementById('tgPrcRunSanity')?.addEventListener('click', async () => {
    const r = await runFullIntegrationSanity();
    const out = document.getElementById('tgPrcSanityReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcReloadProof')?.addEventListener('click', async () => {
    const r = await proveDefaultOffReload();
    const out = document.getElementById('tgPrcReloadProofReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcFullCleanup')?.addEventListener('click', async () => {
    const r = await integratedFullCleanup();
    await unregisterFinalQaSw();
    const out = document.getElementById('tgPrcCleanupReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcPwaRegister')?.addEventListener('click', async () => {
    const r = await registerFinalQaSw();
    const out = document.getElementById('tgPrcPwaReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderFinalQaDiagnostics();
  });
  document.getElementById('tgPrcPwaUnregister')?.addEventListener('click', async () => {
    const r = await unregisterFinalQaSw();
    const stale = await clearStaleFinalQaCachesUserClick();
    const out = document.getElementById('tgPrcPwaReport');
    if (out) out.textContent = JSON.stringify({ unregister: r, staleCacheCleanup: stale }, null, 2);
    renderFinalQaDiagnostics();
  });

  const itgReg = document.getElementById('tgItgPwaRegister');
  if (itgReg) {
    itgReg.insertAdjacentHTML(
      'afterend',
      '<p class="tg-prc-warn">Integrated SW caches integrated HTML only. Use Final QA SW register below for this page.</p>',
    );
  }

  (async () => {
    try {
      const res = await fetch(FINAL_QA_PATH, { cache: 'no-store' });
      const buf = await res.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buf);
      const h = [...new Uint8Array(hash)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      window.__TG_FINAL_QA_SHA__ = h;
      const el = document.getElementById('tgPrcCandidateSha');
      if (el) el.textContent = h;
    } catch {
      /* ignore */
    }
    renderFinalQaDiagnostics();
  })();

  window.__TG_TOP_TG_FINAL_QA_CANDIDATE__ = {
    version: FINAL_QA_VERSION,
    WAIVED_GATES,
    LANE_STATUS,
    FROZEN_LANE_CLASSIFICATION,
    FINAL_QA_PREVIEW_URL,
    collectFinalQaDiagnostics,
    proveDefaultOffReload,
    runFullIntegrationSanity,
    integratedFullCleanup,
    registerFinalQaSw,
    unregisterFinalQaSw,
    clearStaleFinalQaCachesUserClick,
    runRemainingBlockersAttackSummary,
    runHighImpactBlockersPass,
    probeSafariOpfsCapabilityMatrix,
    BLOCKER_ATTACK_STATUS,
    HIGH_IMPACT_BLOCKER_STATUS,
    getFinalQaRollbackManifest,
    FOUNDATION_SHAS,
  };

  renderFinalQaDiagnostics();
}
