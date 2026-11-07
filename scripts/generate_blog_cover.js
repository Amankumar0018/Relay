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
  console.log('--- GENERATING RELAY BLOG COVER IMAGE (1920x1080) ---');

  const htmlPath = path.resolve(__dirname, 'render_blog_cover.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  const outPath = path.resolve(__dirname, '../docs/blog/assets/relay-blog-cover.png');
  const artifactDir = 'C:\\Users\\Aman\\.gemini\\antigravity\\brain\\33b8fc64-cfd6-46a6-a06d-2d981e2ba46f';

  // Ensure output directory exists
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Target URL:', fileUrl);
  console.log('Output Path:', outPath);

  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--remote-debugging-address=127.0.0.1',
      '--user-data-dir=C:\\Users\\Aman\\AppData\\Local\\Temp\\chrome_blog_cover',
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
      version = await fetchJson('http://127.0.0.1:9222/json/version');
      if (version) break;
    } catch (e) {}
  }

  if (!version) {
    chrome.kill();
    throw new Error('Chrome failed to start on port 9222');
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
    url: fileUrl,
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

  // Set precise 1920x1080 viewport with crisp deviceScaleFactor
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Navigating to cover template...');
  await send('Page.navigate', { url: fileUrl });

  // Wait 3 seconds for Google Fonts and layout to settle
  await wait(3000);

  console.log('Capturing screenshot...');
  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      scale: 1,
    },
  });

  const buffer = Buffer.from(screenshot.data, 'base64');
  fs.writeFileSync(outPath, buffer);
  console.log(`[SAVED] ${outPath} (${buffer.length} bytes)`);

  // Also copy to artifact directory for immediate review
  const artifactPath = path.join(artifactDir, 'relay-blog-cover.png');
  fs.writeFileSync(artifactPath, buffer);
  console.log(`[ARTIFACT COPIED] ${artifactPath}`);

  browserWs.close();
  chrome.kill();
  console.log('--- GENERATION COMPLETE ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error generating blog cover:', err);
  process.exit(1);
});

