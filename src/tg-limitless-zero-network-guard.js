/**
 * Zero-network guard — logs blocked remote attempts to capability panel log.
 * Allows file://, same-origin localhost/127.0.0.1 only.
 */
import { detectRuntimeMode, isAllowedLocalOrigin } from './tg-limitless-provenance.js';

const logElId = 'tgLimitlessNetworkLog';

function appendLog(line) {
  const el = document.getElementById(logElId);
  if (!el) return;
  const p = document.createElement('div');
  p.className = 'tg-limitless-net-log-line';
  p.textContent = line;
  el.appendChild(p);
  while (el.childNodes.length > 40) el.removeChild(el.firstChild);
}

function isAllowedUrl(url) {
  try {
    const u = new URL(url, location.href);
    if (u.protocol === 'file:') return true;
    const mode = detectRuntimeMode();
    if (mode === 'file://') return u.protocol === 'file:';
    if (mode === 'localhost') {
      const host = u.hostname;
      if (u.origin === location.origin) return true;
      if (
        (host === '127.0.0.1' || host === 'localhost' || host === '[::1]') &&
        u.protocol === location.protocol
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function blockRemote(kind, detail) {
  appendLog(`[BLOCKED ${kind}] ${detail}`);
  return false;
}

export function installZeroNetworkGuard() {
  const enabled = true;
  const state = { enabled, blocked: 0, allowed: 0 };

  const origFetch = window.fetch.bind(window);
  window.fetch = function guardedFetch(input, init) {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    const method = init?.method ?? 'GET';
    if (!isAllowedUrl(url)) {
      state.blocked++;
      blockRemote('fetch', `${method} ${url}`);
      return Promise.reject(new DOMException('Zero-network guard blocked remote fetch', 'AbortError'));
    }
    state.allowed++;
    appendLog(`[ALLOW fetch] ${method} ${url}`);
    return origFetch(input, init);
  };

  const XHR = window.XMLHttpRequest;
  function GuardedXHR() {
    const xhr = new XHR();
    let reqUrl = '';
    const open = xhr.open;
    xhr.open = function (method, url, ...rest) {
      reqUrl = String(url);
      if (!isAllowedUrl(reqUrl)) {
        state.blocked++;
        blockRemote('XHR', `${method} ${reqUrl}`);
        throw new DOMException('Zero-network guard blocked XHR', 'SecurityError');
      }
      state.allowed++;
      appendLog(`[ALLOW XHR] ${method} ${reqUrl}`);
      return open.call(xhr, method, url, ...rest);
    };
    return xhr;
  }
  GuardedXHR.prototype = XHR.prototype;
  window.XMLHttpRequest = GuardedXHR;

  if (navigator.sendBeacon) {
    const origBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      if (!isAllowedUrl(url)) {
        state.blocked++;
        blockRemote('sendBeacon', String(url));
        return false;
      }
      state.allowed++;
      appendLog(`[ALLOW sendBeacon] ${url}`);
      return origBeacon(url, data);
    };
  }

  if (typeof WebSocket !== 'undefined') {
    const OrigWS = WebSocket;
    window.WebSocket = function GuardedWebSocket(url, protocols) {
      if (!isAllowedUrl(url)) {
        state.blocked++;
        blockRemote('WebSocket', String(url));
        throw new DOMException('Zero-network guard blocked WebSocket', 'SecurityError');
      }
      state.allowed++;
      appendLog(`[ALLOW WebSocket] ${url}`);
      return new OrigWS(url, protocols);
    };
    window.WebSocket.prototype = OrigWS.prototype;
  }

  window.__tgLimitlessNetworkGuard = {
    getState() {
      return { ...state, mode: detectRuntimeMode(), localhostAllowed: isAllowedLocalOrigin() };
    },
  };

  appendLog(
    `[guard active] mode=${detectRuntimeMode()} localhost_ok=${isAllowedLocalOrigin()}`
  );
  return state;
}
