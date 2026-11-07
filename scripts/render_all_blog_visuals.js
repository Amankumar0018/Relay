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
  console.log('=== RENDERING ALL RELAY BLOG VISUAL ASSETS (1920x1080) ===');

  const targets = [
    {
      html: 'render_architecture.html',
      out: 'relay-architecture.png',
      desc: 'Relay Architecture Infographic',
    },
    {
      html: 'render_workflow.html',
      out: 'relay-workflow.png',
      desc: 'Relay End-to-End Workflow',
    },
    {
      html: 'render_evidence_trust.html',
      out: 'relay-evidence-trust.png',
      desc: 'Relay Evidence and Trust Visual',
    },
  ];

  const artifactDir = 'C:\\Users\\Aman\\.gemini\\antigravity\\brain\\33b8fc64-cfd6-46a6-a06d-2d981e2ba46f';
  const outDir = path.resolve(__dirname, '../docs/blog/assets');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9223',
      '--remote-debugging-address=127.0.0.1',
      '--user-data-dir=C:\\Users\\Aman\\AppData\\Local\\Temp\\chrome_blog_visuals',
      '--window-size=1920,1080',
      '--no-first-run',
      '--no-default-browser-check',
      '--allow-file-access-from-files',
    ]
  );

  let version = null;
  for (let i = 0; i < 20; i++) {
    await wait(300);
    try {
      version = await fetchJson('http://127.0.0.1:9223/json/version');
      if (version) break;
    } catch (e) {}
  }

  if (!version) {
    chrome.kill();
    throw new Error('Chrome failed to start on port 9223');
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

  for (const item of targets) {
    console.log(`\nRendering: ${item.desc}...`);
    const htmlPath = path.resolve(__dirname, item.html);
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
    const destPath = path.join(outDir, item.out);

    const { targetId } = await sendBrowser('Target.createTarget', { url: fileUrl });
    const { sessionId } = await sendBrowser('Target.attachToTarget', { targetId, flatten: true });

    let pageMsgId = 1;
    const pagePending = new Map();

    const origOnMessage = browserWs.onmessage;
    browserWs.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.sessionId === sessionId && msg.id && pagePending.has(msg.id)) {
        const { resolve, reject } = pagePending.get(msg.id);
        pagePending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else {
        origOnMessage(event);
      }
    };

    function sendPage(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = pageMsgId++;
        pagePending.set(id, { resolve, reject });
        browserWs.send(JSON.stringify({ sessionId, id, method, params }));
      });
    }

    await sendPage('Page.enable');
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await wait(1800); // Wait for webfonts to render fully

    const screenshot = await sendPage('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 },
      captureBeyondViewport: false,
    });

    const buffer = Buffer.from(screenshot.data, 'base64');
    fs.writeFileSync(destPath, buffer);
    console.log(`[SAVED] ${destPath} (${buffer.length} bytes)`);

    if (fs.existsSync(artifactDir)) {
      const artPath = path.join(artifactDir, item.out);
      fs.writeFileSync(artPath, buffer);
      console.log(`[ARTIFACT COPIED] ${artPath}`);
    }

    await sendBrowser('Target.closeTarget', { targetId });
  }

  browserWs.close();
  chrome.kill();
  console.log('\n=== ALL ASSETS RENDERED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Fatal rendering error:', err);
  process.exit(1);
});

