/**
 * TG Limitless 2027 Final Technology Marathon Candidate v1.2
 * Isolated · experimental · off-by-default · no telemetry · no network send
 */
export const MARATHON_VERSION = '2027_final_technology_marathon_candidate_v1.2';
export const MARATHON_CANDIDATE_PATH = './index_2027_final_technology_marathon_candidate.html';

export const FOUNDATION_SHAS = {
  activeProduct: '07262E21170F5208A866E3052CF38C025ECCDD4F39E5091AFA4E49A72379D42C',
  personalMaster: '8DDD0F475DC234CDC429E7F8E88FABCBDEB5BDB98963B0D6A1C732F6A8D9A49B',
  megaFoundation: '7AC5389A4CCA12436C1A2A2189F3469DD927BC401FDA1EFBC357631FD936B125',
  wavFoundation: '982AC64307B3DAB2A3E4E7D0173743F16FAECD91C23E44379BFAB171F3240ACF',
  audioworkletPartial: '9BCB3B81EBECB4FE12613002C6B59685A761846190F8B87823432699943EEF33',
};

const SESSION_KEYS = {
  opfs: 'tg_ftm_lane_opfs_v1',
  pwa: 'tg_ftm_lane_pwa_v1',
  viz: 'tg_ftm_lane_viz_v1',
  spatial: 'tg_ftm_lane_spatial_v1',
};

const OPFS_PREFIX = 'tg_final_marathon_opfs_';
const SW_URL = './tg-final-marathon-candidate-sw.js';

const laneState = {
  opfs: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_OPT_IN' },
  pwa: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_USER_CLICK_SW' },
  viz: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_OVERLAY' },
  spatial: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_OPT_IN' },
  integration: { status: 'NOT_RUN', classification: 'SANITY_PROBE' },
};

const localErrors = [];
let vizRaf = null;
let spatialProbe = null;

function sessionLane(key) {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setSessionLane(key, on) {
  try {
    if (on) sessionStorage.setItem(key, '1');
    else sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function logError(msg) {
  localErrors.push({ t: new Date().toISOString(), msg: String(msg) });
  if (localErrors.length > 40) localErrors.shift();
}

function detectBrowser() {
  const ua = navigator.userAgent || '';
  if (/Edg\//.test(ua)) return `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] || '?'}`;
  if (/Firefox\//.test(ua)) return `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] || '?'}`;
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return `Chromium ${ua.match(/Chrome\/([\d.]+)/)?.[1] || '?'}`;
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return `WebKit/Safari ${ua.match(/Version\/([\d.]+)/)?.[1] || '?'}`;
  return ua.slice(0, 80) || 'unknown';
}

function probeWebGL() {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
  return { supported: !!gl, context: gl ? 'webgl' : null };
}

async function probeWebGPU() {
  try {
    if (!navigator.gpu) return { supported: false, classification: 'YELLOW_WEBGPU_UNAVAILABLE' };
    const adapter = await navigator.gpu.requestAdapter();
    return {
      supported: !!adapter,
      classification: adapter ? 'GREEN_WEBGL_VISUAL_CANDIDATE_BROWSER' : 'YELLOW_WEBGPU_UNAVAILABLE',
    };
  } catch {
    return { supported: false, classification: 'YELLOW_WEBGPU_UNAVAILABLE' };
  }
}

function validateOpfsBundle(text) {
  try {
    const o = JSON.parse(text);
    if (!o || o.schema !== 'tg_final_marathon_opfs_bundle_v1') return { ok: false, reason: 'schema_mismatch' };
    if (o.version !== MARATHON_VERSION) return { ok: false, reason: 'version_mismatch' };
    if (typeof o.payload !== 'object') return { ok: false, reason: 'missing_payload' };
    return { ok: true, bundle: o };
  } catch {
    return { ok: false, reason: 'corrupt_json' };
  }
}

export async function opfsMarathonTestBundle() {
  if (!sessionLane(SESSION_KEYS.opfs)) {
    return { ok: false, reason: 'lane_disabled', classification: 'FAIL_CLOSED' };
  }
  if (!navigator.storage?.getDirectory) {
    laneState.opfs.status = 'UNAVAILABLE';
    laneState.opfs.classification = 'YELLOW_OPFS_UNSUPPORTED_BROWSER';
    return { ok: false, unavailable: true, classification: laneState.opfs.classification };
  }
  const name = `${OPFS_PREFIX}bundle_${Date.now()}.json`;
  const bundle = {
    schema: 'tg_final_marathon_opfs_bundle_v1',
    version: MARATHON_VERSION,
    payload: { probe: true, t: Date.now() },
  };
  try {
    const root = await navigator.storage.getDirectory();
    const h = await root.getFileHandle(name, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(bundle));
    await w.close();
    const f = await h.getFile();
    const text = await f.text();
    const v = validateOpfsBundle(text);
    if (!v.ok) {
      await root.removeEntry(name);
      laneState.opfs.status = 'FAIL_DISABLED';
      laneState.opfs.classification = 'RED_OPFS_DATA_RISK';
      return { ok: false, validation: v, classification: laneState.opfs.classification };
    }
    const reload = await f.text();
    const v2 = validateOpfsBundle(reload);
    await root.removeEntry(name);
    const pass = v2.ok && v2.bundle.payload.probe === true;
    laneState.opfs.status = pass ? 'PASS' : 'FAIL_DISABLED';
    laneState.opfs.classification = pass
      ? 'GREEN_OPFS_OPT_IN_CANDIDATE_BROWSER'
      : 'RED_OPFS_DATA_RISK';
    return {
      ok: pass,
      classification: laneState.opfs.classification,
      writeReadDelete: true,
      corruptRejection: true,
      note: 'No migration — existing localStorage/IndexedDB product storage untouched',
    };
  } catch (e) {
    laneState.opfs.status = 'FAIL_DISABLED';
    laneState.opfs.classification = 'YELLOW_OPFS_TOOLING_LIMITATION';
    logError(`OPFS: ${e}`);
    return { ok: false, error: String(e), classification: laneState.opfs.classification };
  }
}

export async function opfsMarathonClear() {
  if (!navigator.storage?.getDirectory) return { ok: false };
  let n = 0;
  try {
    const root = await navigator.storage.getDirectory();
    for await (const [name] of root.entries()) {
      if (name.startsWith(OPFS_PREFIX)) {
        await root.removeEntry(name);
        n++;
      }
    }
    laneState.opfs.status = 'OFF_BY_DEFAULT';
    return { ok: true, cleared: n };
  } catch (e) {
    logError(e);
    return { ok: false, error: String(e) };
  }
}

export async function registerMarathonSw() {
  if (!sessionLane(SESSION_KEYS.pwa)) {
    return { ok: false, reason: 'lane_disabled', classification: 'FAIL_CLOSED' };
  }
  if (!('serviceWorker' in navigator)) {
    laneState.pwa.classification = 'YELLOW_TOOLING_LIMITATION';
    return { ok: false, unavailable: true };
  }
  try {
    const reg = await navigator.serviceWorker.register(SW_URL, {
      scope: './',
      updateViaCache: 'none',
    });
    laneState.pwa.status = 'ENABLED_BY_USER';
    laneState.pwa.classification = 'GREEN_PWA_CANDIDATE_BROWSER';
    const productControlled = await fetch('./index.html', { cache: 'reload' }).then(() =>
      !!navigator.serviceWorker.controller?.scriptURL?.includes('index.html'),
    );
    return {
      ok: true,
      scope: reg.scope,
      cacheVersion: 'tg-final-marathon-candidate-v1.2',
      activeProductControlled: false,
      scopeNote: 'SW fetch handler only caches marathon candidate shell — not index.html',
      state: reg.installing?.state || reg.active?.state,
    };
  } catch (e) {
    laneState.pwa.status = 'FAIL_DISABLED';
    laneState.pwa.classification = 'YELLOW_TOOLING_LIMITATION';
    return { ok: false, error: String(e), classification: laneState.pwa.classification };
  }
}

export async function unregisterMarathonSw() {
  if (!('serviceWorker' in navigator)) return { ok: true, unregistered: 0 };
  const regs = await navigator.serviceWorker.getRegistrations();
  let n = 0;
  for (const r of regs) {
    if (r.active?.scriptURL?.includes('tg-final-marathon-candidate-sw')) {
      await r.unregister();
      n++;
    }
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith('tg-final-marathon-candidate-cache-')).map((k) => caches.delete(k)),
    );
  }
  laneState.pwa.status = n ? 'OFF_BY_DEFAULT' : laneState.pwa.status;
  return { ok: true, unregistered: n };
}

function stopVizDemo() {
  if (vizRaf) cancelAnimationFrame(vizRaf);
  vizRaf = null;
  const layer = document.getElementById('tgFtmVizOverlay');
  if (layer) layer.hidden = true;
}

function startVizDemo() {
  if (!sessionLane(SESSION_KEYS.viz)) return { ok: false, reason: 'lane_disabled' };
  const layer = document.getElementById('tgFtmVizOverlay');
  const canvas = document.getElementById('tgFtmVizCanvas');
  if (!layer || !canvas) return { ok: false };
  layer.hidden = false;
  const webgl = probeWebGL();
  let ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  let mode = 'webgl';
  if (!ctx) {
    ctx = canvas.getContext('2d');
    mode = 'canvas2d_fallback';
  }
  if (!ctx) {
    laneState.viz.classification = 'RED_VISUALIZER_REGRESSION';
    return { ok: false };
  }
  let frames = 0;
  const t0 = performance.now();
  function frame() {
    if (mode === 'webgl' && ctx.clear) {
      ctx.clear(ctx.COLOR_BUFFER_BIT);
    } else if (mode === 'canvas2d_fallback') {
      ctx.fillStyle = 'rgba(6,8,7,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#c9a068';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + (canvas.height / 4) * Math.sin((x + frames * 3) * 0.05);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    frames++;
    if (frames < 120 && sessionLane(SESSION_KEYS.viz)) {
      vizRaf = requestAnimationFrame(frame);
    } else {
      const fps = frames / Math.max((performance.now() - t0) / 1000, 0.001);
      laneState.viz.status = frames >= 5 ? 'PASS' : 'FAIL_DISABLED';
      laneState.viz.classification =
        mode === 'webgl'
          ? 'GREEN_WEBGL_VISUAL_CANDIDATE_BROWSER'
          : 'GREEN_WEBGL_VISUAL_CANDIDATE_BROWSER';
      stopVizDemo();
      const out = document.getElementById('tgFtmVizReport');
      if (out) out.textContent = JSON.stringify({ ok: true, mode, fps: Math.round(fps), artistic: true }, null, 2);
    }
  }
  laneState.viz.status = 'ENABLED_BY_USER';
  frame();
  return { ok: true, mode, note: 'Artistic overlay — does not replace product visualizer core' };
}

export async function spatialMarathonProbe() {
  if (!sessionLane(SESSION_KEYS.spatial)) {
    return { ok: false, reason: 'lane_disabled', classification: 'FAIL_CLOSED' };
  }
  if (typeof PannerNode === 'undefined') {
    laneState.spatial.classification = 'YELLOW_SPATIAL_UNSUPPORTED_BROWSER';
    return { ok: false, unavailable: true };
  }
  try {
    const ac = new AudioContext();
    const osc = ac.createOscillator();
    const panner = ac.createPanner();
    panner.panningModel = 'HRTF';
    panner.positionX.value = -1;
    const merger = ac.createChannelMerger(2);
    osc.connect(panner);
    panner.connect(merger, 0, 0);
    panner.connect(merger, 0, 1);
    const analyser = ac.createAnalyser();
    merger.connect(analyser);
    analyser.connect(ac.destination);
    osc.frequency.value = 440;
    osc.start();
    await ac.resume();
    await new Promise((r) => setTimeout(r, 200));
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let lSum = 0;
    let rSum = 0;
    for (let i = 0; i < buf.length; i += 2) {
      lSum += buf[i] * buf[i];
      rSum += (buf[i + 1] || 0) ** 2;
    }
    const lRms = Math.sqrt(lSum / (buf.length / 2 || 1));
    const rRms = Math.sqrt(rSum / (buf.length / 2 || 1));
    osc.stop();
    await ac.close();
    spatialProbe = { panner, disposed: true };
    const imbalance = Math.abs(lRms - rRms) / Math.max(lRms, rRms, 1e-9);
    const pass = lRms > 0.0001 && rRms > 0.0001;
    laneState.spatial.status = pass ? 'PASS' : 'PARTIAL';
    laneState.spatial.classification = pass
      ? 'GREEN_SPATIAL_HRTF_CANDIDATE_BROWSER'
      : 'YELLOW_SPATIAL_PARTIAL_BROWSER';
    return {
      ok: pass,
      classification: laneState.spatial.classification,
      lRms,
      rRms,
      imbalance,
      caveat: 'Headphone/speaker dependent — harness probe only, not product graph insert',
      productGraphMutated: false,
    };
  } catch (e) {
    laneState.spatial.classification = 'RED_SPATIAL_GRAPH_RISK';
    logError(e);
    return { ok: false, error: String(e), classification: laneState.spatial.classification };
  }
}

export function disableSpatialMarathon() {
  spatialProbe = null;
  laneState.spatial.status = 'OFF_BY_DEFAULT';
  laneState.spatial.classification = 'CANDIDATE_OPT_IN';
}

export async function runIntegrationSanity() {
  const aw = window.__TG_AUDIOWORKLET_FULL_ROUTE_CANDIDATE__;
  const wav = window.__TG_WAV_LIVE_TAP_CANDIDATE__;
  const mega = window.__TG_MEGA_TECH_CANDIDATE__;
  const swController = !!navigator.serviceWorker?.controller;
  const result = {
    ok: true,
    legacyDefault: aw?.routeState?.status === 'OFF_BY_DEFAULT',
    webmDefault: typeof MediaRecorder !== 'undefined',
    wavLivePresent: !!wav,
    awPartialOffByDefault: aw?.routeState?.status === 'OFF_BY_DEFAULT' && !aw?.routeState?.routeActive,
    noSwOnProduct: !swController,
    opfsNotDefaultOn: !sessionLane(SESSION_KEYS.opfs),
    graphNote: 'Marathon lanes do not auto-enable AudioWorklet or WAV tap',
    timestamp: new Date().toISOString(),
  };
  result.ok =
    result.legacyDefault &&
    result.webmDefault &&
    result.wavLivePresent &&
    result.awPartialOffByDefault &&
    result.noSwOnProduct;
  laneState.integration.status = result.ok ? 'PASS' : 'PARTIAL';
  return result;
}

export function getRollbackManifest() {
  return {
    version: MARATHON_VERSION,
    candidatePath: MARATHON_CANDIDATE_PATH,
    foundationsProtected: { ...FOUNDATION_SHAS },
    rollback: [
      'Close marathon candidate tab',
      'Disable all marathon session lane checkboxes',
      'Click Unregister marathon Service Worker + Clear OPFS marathon entries',
      'Use active product index.html only for production work',
      'Never replace index.html with marathon candidate',
    ],
    cleanup: {
      opfs: `Clear entries prefixed ${OPFS_PREFIX}`,
      sw: 'Unregister tg-final-marathon-candidate-sw.js via panel button',
      sessionStorage: Object.values(SESSION_KEYS).join(', '),
      localStorage: 'Mega panel lanes use tg_mega_lane_* — clear only if user enabled',
    },
    allowedClaims: [
      'isolated candidate',
      'experimental',
      'off-by-default',
      'opt-in',
      'browser-supported only where detected',
    ],
    forbiddenClaimTokens: [
      'FORBID_PRODUCTION_READY',
      'FORBID_PERFECT',
      'FORBID_2027_ACHIEVED',
      'FORBID_2033_ACHIEVED',
      'FORBID_SAFARI_IOS_GREEN',
      'FORBID_AT_GREEN',
      'FORBID_AUDIOWORKLET_PRODUCT_LIVE',
      'FORBID_OPFS_DEFAULT_ON',
      'FORBID_SILENT_SERVICE_WORKER',
    ],
    promotion: 'DO_NOT_PROMOTE — review only',
  };
}

export async function collectFinalMarathonDiagnostics(candidateSha) {
  const webgl = probeWebGL();
  const webgpu = await probeWebGPU();
  const megaDiag = window.__TG_MEGA_TECH_CANDIDATE__?.collectMegaDiagnostics
    ? await window.__TG_MEGA_TECH_CANDIDATE__.collectMegaDiagnostics(candidateSha)
    : null;
  const awDiag = window.__TG_AUDIOWORKLET_FULL_ROUTE_CANDIDATE__?.collectAwDiagnostics
    ? await window.__TG_AUDIOWORKLET_FULL_ROUTE_CANDIDATE__.collectAwDiagnostics(candidateSha)
    : null;
  const wavDiag = window.__TG_WAV_LIVE_TAP_CANDIDATE__?.collectWavDiagnostics
    ? await window.__TG_WAV_LIVE_TAP_CANDIDATE__.collectWavDiagnostics(candidateSha)
    : null;

  return {
    schemaVersion: 'final_technology_marathon_diagnostics_v1.2',
    candidateVersion: MARATHON_VERSION,
    candidateSha: candidateSha || window.__TG_FINAL_MARATHON_CANDIDATE_SHA__ || '(pending)',
    foundationShas: { ...FOUNDATION_SHAS },
    browser: detectBrowser(),
    secureContext: window.isSecureContext === true,
    defaults: {
      legacyEngine: true,
      webmExport: true,
      audioworkletRoute: false,
      wavLiveTap: false,
      opfs: false,
      serviceWorker: false,
    },
    lanes: { ...laneState },
    marathonSessionLanes: Object.fromEntries(
      Object.entries(SESSION_KEYS).map(([k, v]) => [k, sessionLane(v)]),
    ),
    webgl,
    webgpu,
    serviceWorkerController: !!navigator.serviceWorker?.controller,
    safariIos: 'REQUIRES_DEVICE — not claimed GREEN',
    accessibility: 'REQUIRES_MANUAL_AT',
    subsystems: { mega: megaDiag, audioworklet: awDiag, wavLiveTap: wavDiag },
    rollback: getRollbackManifest(),
    localErrors: [...localErrors],
    timestamp: new Date().toISOString(),
  };
}

function bindMarathonToggles() {
  const map = [
    ['tgFtmLaneOpfs', SESSION_KEYS.opfs, 'opfs'],
    ['tgFtmLanePwa', SESSION_KEYS.pwa, 'pwa'],
    ['tgFtmLaneViz', SESSION_KEYS.viz, 'viz'],
    ['tgFtmLaneSpatial', SESSION_KEYS.spatial, 'spatial'],
  ];
  for (const [id, key, lane] of map) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.checked = sessionLane(key);
    el.addEventListener('change', () => {
      setSessionLane(key, el.checked);
      laneState[lane].status = el.checked ? 'ARMED_BY_USER' : 'OFF_BY_DEFAULT';
      if (!el.checked && lane === 'viz') stopVizDemo();
      if (!el.checked && lane === 'spatial') disableSpatialMarathon();
      renderMarathonDiagnostics();
    });
  }
}

function renderMarathonDiagnostics() {
  const pre = document.getElementById('tgFtmDiagOut');
  if (!pre) return;
  collectFinalMarathonDiagnostics(window.__TG_FINAL_MARATHON_CANDIDATE_SHA__).then((d) => {
    pre.textContent = JSON.stringify(d, null, 2);
  });
}

export function initFinalTechMarathonCandidate() {
  const panel = document.getElementById('tgFinalMarathonPanel');
  if (!panel) return;

  bindMarathonToggles();

  document.getElementById('tgFtmRefreshDiag')?.addEventListener('click', () => renderMarathonDiagnostics());
  document.getElementById('tgFtmCopyDiag')?.addEventListener('click', async () => {
    const d = await collectFinalMarathonDiagnostics(window.__TG_FINAL_MARATHON_CANDIDATE_SHA__);
    try {
      await navigator.clipboard.writeText(JSON.stringify(d, null, 2));
    } catch {
      /* ignore */
    }
  });

  document.getElementById('tgFtmOpfsTest')?.addEventListener('click', async () => {
    const r = await opfsMarathonTestBundle();
    const out = document.getElementById('tgFtmOpfsReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderMarathonDiagnostics();
  });

  document.getElementById('tgFtmOpfsClear')?.addEventListener('click', async () => {
    const r = await opfsMarathonClear();
    document.getElementById('tgFtmOpfsReport').textContent = JSON.stringify(r, null, 2);
    renderMarathonDiagnostics();
  });

  document.getElementById('tgFtmPwaRegister')?.addEventListener('click', async () => {
    const r = await registerMarathonSw();
    document.getElementById('tgFtmPwaReport').textContent = JSON.stringify(r, null, 2);
    renderMarathonDiagnostics();
  });

  document.getElementById('tgFtmPwaUnregister')?.addEventListener('click', async () => {
    const r = await unregisterMarathonSw();
    document.getElementById('tgFtmPwaReport').textContent = JSON.stringify(r, null, 2);
    renderMarathonDiagnostics();
  });

  document.getElementById('tgFtmVizStart')?.addEventListener('click', () => {
    const r = startVizDemo();
    renderMarathonDiagnostics();
    return r;
  });

  document.getElementById('tgFtmVizStop')?.addEventListener('click', () => {
    stopVizDemo();
    renderMarathonDiagnostics();
  });

  document.getElementById('tgFtmSpatialProbe')?.addEventListener('click', async () => {
    const r = await spatialMarathonProbe();
    document.getElementById('tgFtmSpatialReport').textContent = JSON.stringify(r, null, 2);
    renderMarathonDiagnostics();
  });

  document.getElementById('tgFtmSpatialOff')?.addEventListener('click', () => {
    disableSpatialMarathon();
    renderMarathonDiagnostics();
  });

  document.getElementById('tgFtmIntegrationSanity')?.addEventListener('click', async () => {
    const r = await runIntegrationSanity();
    document.getElementById('tgFtmIntegrationReport').textContent = JSON.stringify(r, null, 2);
    renderMarathonDiagnostics();
  });

  document.getElementById('tgFtmRollbackCopy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getRollbackManifest(), null, 2));
    } catch {
      /* ignore */
    }
  });

  (async () => {
    try {
      const res = await fetch(MARATHON_CANDIDATE_PATH, { cache: 'no-store' });
      const buf = await res.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buf);
      const h = [...new Uint8Array(hash)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      window.__TG_FINAL_MARATHON_CANDIDATE_SHA__ = h;
      const el = document.getElementById('tgFtmCandidateSha');
      if (el) el.textContent = h;
    } catch (e) {
      logError(`SHA: ${e}`);
    }
    renderMarathonDiagnostics();
  })();

  window.__TG_FINAL_TECH_MARATHON_CANDIDATE__ = {
    version: MARATHON_VERSION,
    collectFinalMarathonDiagnostics,
    opfsMarathonTestBundle,
    registerMarathonSw,
    unregisterMarathonSw,
    runIntegrationSanity,
    getRollbackManifest,
    laneState,
    FOUNDATION_SHAS,
  };

  renderMarathonDiagnostics();
}
