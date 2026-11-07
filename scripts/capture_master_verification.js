const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('--- RELAY MASTER VERIFICATION CAPTURE ---');

  const artifactDir = 'C:\\Users\\Aman\\.gemini\\antigravity\\brain\\33b8fc64-cfd6-46a6-a06d-2d981e2ba46f';

  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--remote-debugging-address=127.0.0.1',
      '--user-data-dir=C:\\Users\\Aman\\AppData\\Local\\Temp\\chrome_master_qa',
      '--window-size=1440,950',
      '--no-first-run',
      '--no-default-browser-check',
    ]
  );

  let version = null;
  for (let i = 0; i < 20; i++) {
    await wait(300);
    try {
      version = await fetchJson('http://127.0.0.1:9222/json/version');
      if (version) break;
    } catch (e) {}
  }

  if (!version) {
    chrome.kill();
    throw new Error('Chrome failed to start');
  }

  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res) => (browserWs.onopen = res));

  let browserMsgId = 1;
  const browserPending = new Map();
  browserWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && browserPending.has(msg.id)) {
      const { resolve, reject } = browserPending.get(msg.id);
      browserPending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  function sendBrowser(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = browserMsgId++;
      browserPending.set(id, { resolve, reject });
      browserWs.send(JSON.stringify({ id, method, params }));
    });
  }

  const { targetId } = await sendBrowser('Target.createTarget', {
    url: 'http://localhost:3000',
  });
  const { sessionId } = await sendBrowser('Target.attachToTarget', {
    targetId,
    flatten: true,
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = browserMsgId++;
      browserPending.set(id, { resolve, reject });
      browserWs.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  async function setViewport(width = 1440, height = 950) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: false,
    });
  }

  async function capture(filename, width = 1440, height = 950) {
    await setViewport(width, height);
    await wait(400);
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(screenshot.data, 'base64');
    fs.writeFileSync(filename, buffer);
    const basename = path.basename(filename);
    fs.writeFileSync(path.join(artifactDir, basename), buffer);
    console.log(`[CAPTURED] ${basename}`);
  }

  async function goto(url, delay = 2000) {
    console.log(`[NAVIGATE] ${url}`);
    await send('Page.navigate', { url });
    await wait(delay);
  }

  async function evalJs(expr) {
    return await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  }

  // 1. Homepage Hero & Artifact
  await goto('http://localhost:3000', 2500);
  await capture('master_01_homepage_hero.png', 1440, 950);

  // 2. Homepage Narrative Sections
  await evalJs('window.scrollTo(0, 1100)');
  await wait(800);
  await capture('master_02_homepage_narrative.png', 1440, 950);

  // 3. Continuity Map - Radar
  await goto('http://localhost:3000/app/map', 2500);
  await capture('master_03_continuity_map_radar.png', 1440, 950);

  // 4. Continuity Map - Ledger Mode
  await evalJs(`
    const btns = Array.from(document.querySelectorAll('button'));
    const ledgerBtn = btns.find(b => b.textContent && b.textContent.includes('Entity Ledger'));
    if (ledgerBtn) ledgerBtn.click();
  `);
  await wait(800);
  await capture('master_04_continuity_map_ledger.png', 1440, 950);

  // 5. Settings & Governance Roles
  await goto('http://localhost:3000/app/settings', 2000);
  await capture('master_05_settings_roles.png', 1440, 1100);

  console.log('--- ALL MASTER CAPTURES COMPLETED ---');
  browserWs.close();
  chrome.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});

