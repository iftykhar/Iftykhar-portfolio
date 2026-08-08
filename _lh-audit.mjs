// Lighthouse-style audit via CDP (temporary, deleted after use).
setTimeout(() => { console.log('WATCHDOG_TIMEOUT'); process.exit(3); }, 100000).unref();

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CDP_PORT = '9441';
const URL = 'http://127.0.0.1:8124/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { spawn } = require('child_process');
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  `--remote-debugging-port=${CDP_PORT}`, '--user-data-dir=C:/tmp/cdp-audit-' + Date.now(),
  '--window-size=1350,900', '--hide-scrollbars', 'about:blank'
], { stdio: 'ignore' });

async function getTargets() {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  return res.json();
}

async function main() {
  let targets = null;
  for (let i = 0; i < 30; i++) {
    try { targets = await getTargets(); break; } catch { await sleep(500); }
  }
  if (!targets) { console.log('CDP_UNREACHABLE'); process.exit(2); }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const send = (method, params = {}) => new Promise((res) => {
    const id = ++msgId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  const evalJs = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) {
      return 'EVAL_ERROR: ' + JSON.stringify(r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description);
    }
    return r.result && r.result.result ? r.result.result.value : JSON.stringify(r);
  };

  // Install vitals observers BEFORE any navigation.
  const setup = `
    window.__vitals = { fcp: null, lcp: null, lcpEl: 'unknown', cls: 0, tbt: 0 };
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.entryType === 'largest-contentful-paint' && e.startTime) {
            window.__vitals.lcp = e.startTime;
            const el = e.element;
            window.__vitals.lcpEl = el ? (el.tagName + (el.id ? '#' + el.id : '') + (el.classList && el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '')) : 'unknown';
          }
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
    try {
      new PerformanceObserver((l) => {
        const e = l.getEntries();
        for (const x of e) { if (x.entryType === 'paint' && x.name === 'first-contentful-paint') window.__vitals.fcp = x.startTime; }
      }).observe({ type: 'paint', buffered: true });
    } catch (e) {}
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.cls += e.value || 0; })
        .observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.entryType === 'longtask') window.__vitals.tbt += Math.max(e.duration - 50, 0);
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch (e) {}
  `;
  await send('Page.addScriptToEvaluateOnNewDocument', { source: setup });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: URL });
  await sleep(5000);
  // Trigger lazy-loaded images by scrolling through the page.
  await evalJs(`(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
    return true;
  })()`);
  await sleep(3000);

  const report = await evalJs(`(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const res = performance.getEntriesByType('resource');
    const byType = {};
    for (const r of res) {
      const t = r.initiatorType || 'other';
      byType[t] = (byType[t] || 0) + (r.transferSize || 0);
    }
    const total = Object.values(byType).reduce((a, b) => a + b, 0);
    const top = res.slice().sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0)).slice(0, 8)
      .map((r) => ({ f: r.name.split('/').pop(), kb: Math.round((r.transferSize || 0) / 1024), t: r.initiatorType }));
    const failed = res.filter((r) => r.responseStatus >= 400).map((r) => r.name.split('/').pop());
    const sheets = res.filter((r) => r.initiatorType === 'link' && /\.css/.test(r.name)).map((r) => r.name.split('/').pop());
    const scripts = res.filter((r) => r.initiatorType === 'script').map((r) => r.name.split('/').pop());
    return JSON.stringify({
      fcp: Math.round(window.__vitals.fcp || 0),
      lcp: Math.round(window.__vitals.lcp || 0),
      lcpElement: window.__vitals.lcpEl,
      cls: Math.round(window.__vitals.cls * 1000) / 1000,
      tbt: Math.round(window.__vitals.tbt || 0),
      ttfb: Math.round(nav.responseStart),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      loadEvent: Math.round(nav.loadEventEnd),
      docBytes: Math.round(nav.transferSize / 1024),
      totalBytes: Math.round(total / 1024),
      requestCount: res.length,
      byType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v / 1024)])),
      top: top,
      failed: failed,
      stylesheets: sheets,
      scripts: scripts
    });
  })()`);
  console.log('AUDIT', report);

  const a11y = await evalJs(`(() => {
    const imgs = [...document.querySelectorAll('img')];
    let prev = 0, headingOrderOk = true;
    for (const h of document.querySelectorAll('h1,h2,h3,h4')) {
      const n = +h.tagName[1];
      if (n > prev + 1) headingOrderOk = false;
      prev = n;
    }
    return JSON.stringify({
      lang: document.documentElement.lang,
      titleLen: document.title.length,
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      headingOrderOk,
      imgs: imgs.length,
      imgsNoAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
      imgsLazy: imgs.filter((i) => i.loading === 'lazy').length,
      buttonsNoName: [...document.querySelectorAll('button')].filter((b) => !(b.textContent.trim() || b.getAttribute('aria-label'))).length,
      linksNoHref: [...document.querySelectorAll('a')].filter((a) => !a.getAttribute('href')).length,
      videoNoPoster: document.querySelectorAll('video:not([poster])').length
    });
  })()`);
  console.log('A11Y', a11y);

  ws.close();
  console.log('DONE');
}
main().catch((e) => { console.error('SCRIPT_ERR', e && e.message); process.exit(1); });
