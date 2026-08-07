// Temporary CDP verification of the light-mode fixes (deleted after use).
// Watchdog: never hang forever.
setTimeout(() => { console.log('WATCHDOG_TIMEOUT'); process.exit(3); }, 25000).unref();

const CDP_PORT = process.env.CDP_PORT || '9223';
const SITE_MARK = process.env.SITE_MARK || '8124';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTargets() {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  return res.json();
}

async function main() {
  let targets = null;
  for (let i = 0; i < 20; i++) {
    try { targets = await getTargets(); break; } catch { await sleep(500); }
  }
  if (!targets) { console.log('CDP_UNREACHABLE'); process.exit(2); }
  console.log('STEP targets:', targets.length);
  const page = targets.find((t) => t.type === 'page' && t.url.includes(SITE_MARK));
  if (!page) { console.log('NO_PAGE_TARGET', JSON.stringify(targets.map((t) => t.url))); process.exit(2); }
  console.log('STEP page:', page.url);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  console.log('STEP ws open');
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

  await sleep(2500);

  const lightNow = await evalJs(`(() => {
    if (document.documentElement.classList.contains('dark')) { document.getElementById('theme-toggle').click(); return 'toggled-to-light'; }
    return 'already-light';
  })()`);
  await sleep(400);

  const report = await evalJs(`(() => {
    const cs = (el) => el ? (() => { const s = getComputedStyle(el); return { bg: s.backgroundColor, border: s.borderColor, color: s.color }; })() : null;
    return JSON.stringify({
      mode: document.documentElement.classList.contains('dark') ? 'dark' : 'LIGHT',
      heroCta: cs(document.querySelector('a[href="#projects"].bg-gradient-to-r')),
      skillCard: cs(document.querySelector('#skills-grid > div')),
      expCard: cs(document.querySelector('#experience div.rounded-2xl')),
      datePill: cs(document.querySelector('#experience div.rounded-full')),
      contactPanel: cs(document.querySelector('#contact div.rounded-3xl')),
      skillsRendered: !!document.querySelector('#skills-grid > div'),
      projectsRendered: !!document.querySelector('.project-card-click')
    });
  })()`);
  console.log('LIGHT_MODE_REPORT', report);

  const modalReport = await evalJs(`(async () => {
    const card = document.querySelector('.project-card-click');
    if (!card) return JSON.stringify({ error: 'no project card' });
    card.click();
    await new Promise((r) => setTimeout(r, 700));
    const modal = document.getElementById('project-modal');
    const panel = document.getElementById('project-modal-content');
    const ms = getComputedStyle(modal);
    const ps = getComputedStyle(panel);
    return JSON.stringify({
      modalDisplay: ms.display, modalJustify: ms.justifyContent, modalAlign: ms.alignItems,
      panelBorder: ps.borderColor, panelBg: ps.backgroundColor,
      closeFocused: !!(document.activeElement && document.activeElement.id === 'modal-close-btn'),
      inertCount: document.querySelectorAll('[inert]').length,
      ariaLabel: modal.getAttribute('aria-label'),
      bodyScrollLocked: document.body.style.overflow
    });
  })()`);
  console.log('MODAL_REPORT', modalReport);

  await evalJs(`(() => {
    const btn = document.getElementById('modal-close-btn'); if (btn) btn.click();
    document.getElementById('theme-toggle').click();
    return true;
  })()`);
  await sleep(500);
  const darkReport = await evalJs(`(() => {
    const s = getComputedStyle(document.querySelector('a[href="#projects"].bg-gradient-to-r'));
    return JSON.stringify({ mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light', ctaColor: s.color, inertLeft: document.querySelectorAll('[inert]').length });
  })()`);
  console.log('DARK_MODE_REPORT', darkReport);

  ws.close();
  console.log('DONE');
}
main().catch((e) => { console.error('SCRIPT_ERR', e && e.message); process.exit(1); });
