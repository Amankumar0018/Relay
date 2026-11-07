const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log("=== CAPTURING 1920x1080 SCENE FRAMES VIA CHROME CDP ===");
  const framesDir = path.resolve(__dirname, '../docs/demo-video/frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--window-size=1920,1080',
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    '--disable-gpu',
    '--hide-scrollbars'
  ]);

  let version = null;
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      version = await fetchJson('http://127.0.0.1:9226/json/version');
      if (version && version.webSocketDebuggerUrl) break;
    } catch (e) {}
  }

  if (!version || !version.webSocketDebuggerUrl) {
    throw new Error("Failed to connect to Chrome headless CDP at port 9226");
  }

  console.log("Connected to Chrome CDP WebSocket:", version.webSocketDebuggerUrl);
  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    browserWs.onopen = res;
    browserWs.onerror = rej;
  });

  let nextId = 1;
  const pending = new Map();

  browserWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    } catch (err) {
      console.error("WS Parse error:", err);
    }
  };

  function send(method, params = {}, sessionId = undefined) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      browserWs.send(JSON.stringify(payload));
    });
  }

  const targets = [
    {
      id: 'scene_01_hook',
      url: 'file:///' + path.resolve(__dirname, 'video_scene_01.html').replace(/\\/g, '/'),
      waitMs: 1500,
      badge: null
    },
    {
      id: 'scene_02_dashboard',
      url: 'http://localhost:3000/app',
      waitMs: 3000,
      badge: 'RELAY EXECUTIVE COMMAND // :3000'
    },
    {
      id: 'scene_02_archive',
      url: 'http://localhost:3000/app/archive',
      waitMs: 3000,
      badge: 'CRYPTOGRAPHIC SHA-256 VAULT // :3000'
    },
    {
      id: 'scene_03_investigations',
      url: 'http://localhost:3000/app/investigations',
      waitMs: 3000,
      badge: 'DISCREPANCY INTELLIGENCE // :3000'
    },
    {
      id: 'scene_04_switch',
      url: 'file:///' + path.resolve(__dirname, 'video_scene_04_switch.html').replace(/\\/g, '/'),
      waitMs: 1500,
      badge: null
    },
    {
      id: 'scene_05_review',
      url: 'http://localhost:8000/api/v1/intelligence/approvals/review?request_id=73b6938d-905f-4d39-b67e-7bfe1d08242a',
      waitMs: 2500,
      badge: 'HUMAN ADJUDICATION DESK // :8000'
    },
    {
      id: 'scene_06_handovers',
      url: 'http://localhost:3000/app/handovers',
      waitMs: 3000,
      badge: '9-CHAPTER BRIEFING BOOK & ROADMAP // :3000'
    },
    {
      id: 'scene_06_map',
      url: 'http://localhost:3000/app/map',
      waitMs: 3500,
      badge: 'DYNAMIC CONTINUITY TOPOLOGY RADAR // :3000'
    },
    {
      id: 'scene_07_qa',
      url: 'http://localhost:3000/app',
      waitMs: 2500,
      badge: 'GROUNDED EVIDENCE CITATION // :3000'
    },
    {
      id: 'scene_07_outro',
      url: 'file:///' + path.resolve(__dirname, 'video_scene_07_outro.html').replace(/\\/g, '/'),
      waitMs: 1500,
      badge: null
    }
  ];

  for (const item of targets) {
    console.log(`\nNavigating to ${item.id}: ${item.url}...`);
    const { targetId } = await send('Target.createTarget', { url: item.url });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    await wait(item.waitMs);

    // If badge is requested, inject lower-third pill
    if (item.badge) {
      await send('Runtime.evaluate', {
        expression: `
          (function() {
            const b = document.createElement('div');
            b.style.position = 'fixed';
            b.style.bottom = '28px';
            b.style.left = '28px';
            b.style.backgroundColor = 'rgba(23, 23, 23, 0.95)';
            b.style.color = '#F6F3EC';
            b.style.fontFamily = "'Space Mono', monospace, sans-serif";
            b.style.fontSize = '12px';
            b.style.fontWeight = '700';
            b.style.padding = '9px 18px';
            b.style.border = '2px solid #F15A24';
            b.style.boxShadow = '4px 4px 0 #000000';
            b.style.zIndex = '999999';
            b.style.letterSpacing = '0.08em';
            b.style.backdropFilter = 'blur(4px)';
            b.innerHTML = '<span style="color:#00C853;margin-right:8px;font-size:14px;">●</span>' + ${JSON.stringify(item.badge)};
            document.body.appendChild(b);
          })();
        `
      }, sessionId);
      await wait(300);
    }

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 }
    }, sessionId);

    const dest = path.join(framesDir, `${item.id}.png`);
    fs.writeFileSync(dest, Buffer.from(shot.data, 'base64'));
    console.log(`[SAVED FRAME] ${dest} (${Math.round(shot.data.length * 0.75 / 1024)} KB)`);

    await send('Target.closeTarget', { targetId });
  }

  browserWs.close();
  try { chrome.kill(); } catch (e) {}
  console.log("\n=== ALL 1920x1080 SCENE FRAMES CAPTURED SUCCESSFULLY ===");
}

main().catch(err => {
  console.error("Capture error:", err);
  process.exit(1);
});
