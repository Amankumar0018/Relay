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
  console.log('--- RELAY AUTOMATED SCREENSHOT SUITE ---');

  // Ensure directories exist
  const dirs = [
    'docs/screenshots/01-dashboard',
    'docs/screenshots/02-ingestion',
    'docs/screenshots/03-intelligence',
    'docs/screenshots/04-investigations',
    'docs/screenshots/05-responsibilities',
    'docs/screenshots/06-agent-integration',
    'docs/screenshots/07-human-approval',
    'docs/screenshots/08-handover',
    'docs/screenshots/09-grounded-qa',
    'docs/screenshots/10-exports',
  ];
  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  console.log('Launching headless Chrome with remote debugging...');
  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--remote-debugging-address=127.0.0.1',
      '--user-data-dir=C:\\Users\\Aman\\AppData\\Local\\Temp\\chrome_qa_suite',
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

  // Create page target
  const { targetId } = await sendBrowser('Target.createTarget', {
    url: 'http://localhost:3000/app',
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
    await wait(500);
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filename, Buffer.from(screenshot.data, 'base64'));
    console.log(`[CAPTURED] ${filename}`);
  }

  async function goto(url, delay = 2500) {
    console.log(`[NAVIGATE] ${url}`);
    await send('Page.navigate', { url });
    await wait(delay);
  }

  async function evalJs(expr) {
    return await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  }

  // ==========================================
  // 01 - DASHBOARD
  // ==========================================
  console.log('\n--- Category 01: Dashboard ---');
  await goto('http://localhost:3000/app', 3000);
  await capture('docs/screenshots/01-dashboard/01-dashboard-overview.png', 1440, 950);
  await capture('docs/screenshots/01-dashboard/02-knowledge-metrics-breakdown.png', 1440, 1250);

  // ==========================================
  // 02 - INGESTION & ARCHIVE
  // ==========================================
  console.log('\n--- Category 02: Ingestion & Archive ---');
  await goto('http://localhost:3000/app/archive', 3000);
  await capture('docs/screenshots/02-ingestion/01-document-archive-index.png', 1440, 950);

  // Select first document to inspect facts & citations
  await evalJs(`
    const docButtons = document.querySelectorAll('button');
    for (const b of docButtons) {
      if (b.innerText.includes('Project Odyssey') || b.innerText.includes('Launch Plan')) {
        b.click();
        break;
      }
    }
  `);
  await wait(1000);
  await capture('docs/screenshots/02-ingestion/02-document-extracted-evidence.png', 1440, 1100);

  // Open upload modal
  await evalJs(`
    const uploadBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('DEPOSIT') || b.innerText.includes('UPLOAD'));
    if (uploadBtn) uploadBtn.click();
  `);
  await wait(800);
  await capture('docs/screenshots/02-ingestion/03-document-upload-modal.png', 1440, 950);

  // Close upload modal
  await evalJs(`
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CANCEL') || b.innerText.includes('CLOSE') || b.innerText === '✕');
    if (closeBtn) closeBtn.click();
  `);
  await wait(500);

  // ==========================================
  // 03 - INTELLIGENCE & CONFLICTS
  // ==========================================
  console.log('\n--- Category 03: Intelligence & Conflicts ---');
  await goto('http://localhost:3000/app/investigations', 3000);
  await capture('docs/screenshots/03-intelligence/01-conflict-detection-overview.png', 1440, 950);

  // Click direct contradiction case (Odyssey Beta launch date)
  await evalJs(`
    const cards = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const contradiction = cards.find(c => c.innerText.includes('Deadline Discrepancy') || c.innerText.includes('Beta Release'));
    if (contradiction) contradiction.click();
  `);
  await wait(800);
  await capture('docs/screenshots/03-intelligence/02-direct-contradiction-comparison.png', 1440, 1100);

  // Click superseded decision case
  await evalJs(`
    const cards = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const superseded = cards.find(c => c.innerText.includes('Superseded Decision') || c.innerText.includes('finalized the deployment roadmap'));
    if (superseded) superseded.click();
  `);
  await wait(800);
  await capture('docs/screenshots/03-intelligence/03-superseded-decision-tracking.png', 1440, 1100);

  // Click ownership gap case
  await evalJs(`
    const cards = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const ownership = cards.find(c => c.innerText.includes('Alpha-9') || c.innerText.includes('Unassigned Ownership'));
    if (ownership) ownership.click();
  `);
  await wait(800);
  await capture('docs/screenshots/03-intelligence/04-ownership-gap-detection.png', 1440, 1100);

  // ==========================================
  // 04 - INVESTIGATIONS WORKSPACE
  // ==========================================
  console.log('\n--- Category 04: Investigations Workspace ---');
  await capture('docs/screenshots/04-investigations/01-investigations-workspace.png', 1440, 950);
  await capture('docs/screenshots/04-investigations/02-conflict-evidence-citations.png', 1440, 1200);

  // ==========================================
  // 05 - RESPONSIBILITIES & MAP
  // ==========================================
  console.log('\n--- Category 05: Responsibilities & Knowledge Map ---');
  await goto('http://localhost:3000/app/responsibilities', 3000);
  await capture('docs/screenshots/05-responsibilities/01-responsibility-matrix.png', 1440, 1000);

  await goto('http://localhost:3000/app/map', 3000);
  await capture('docs/screenshots/05-responsibilities/02-continuity-knowledge-map.png', 1440, 1000);

  // ==========================================
  // 06 - AGENT INTEGRATION
  // ==========================================
  console.log('\n--- Category 06: Agent Integration ---');
  await goto('http://localhost:3000/app/agents', 3000);
  await capture('docs/screenshots/06-agent-integration/01-agent-pipeline-stages.png', 1440, 950);
  await capture('docs/screenshots/06-agent-integration/02-switch-orchestration-desk.png', 1440, 1200);

  // ==========================================
  // 07 - HUMAN APPROVAL & AUTHENTICATION
  // ==========================================
  console.log('\n--- Category 07: Human Approval ---');
  await goto('http://localhost:8000/api/v1/intelligence/approvals/review?request_id=caed9705-4519-44ab-9221-e8543649fb16', 2500);
  await capture('docs/screenshots/07-human-approval/01-human-approval-review-screen.png', 1440, 1150);

  // Click on Sign In with Mattermost Account tab
  await evalJs(`
    const loginTab = document.getElementById('tab-login-btn');
    if (loginTab) loginTab.click();
  `);
  await wait(800);
  await capture('docs/screenshots/07-human-approval/02-mattermost-auth-interface.png', 1440, 1150);

  // ==========================================
  // 08 - HANDOVER DOSSIER
  // ==========================================
  console.log('\n--- Category 08: Handover Dossier ---');
  await goto('http://localhost:3000/app/handovers', 3000);
  await capture('docs/screenshots/08-handover/01-handover-dossier-overview.png', 1440, 950);
  await capture('docs/screenshots/08-handover/02-nine-chapter-navigation.png', 1440, 1150);

  // Click Chapter 2 (Projects & Milestones)
  await evalJs(`
    const tabCh2 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CH 02') || b.innerText.includes('PROJE'));
    if (tabCh2) tabCh2.click();
  `);
  await wait(1000);
  await capture('docs/screenshots/08-handover/03-representative-chapter-projects.png', 1440, 1150);

  // Click Chapter 6 (Discrepancies & Ratified Matters)
  await evalJs(`
    const tabCh6 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CH 06') || b.innerText.includes('CONFL'));
    if (tabCh6) tabCh6.click();
  `);
  await wait(1000);
  await capture('docs/screenshots/08-handover/04-discrepancies-and-conflicts-chapter.png', 1440, 1150);

  // Click Chapter 7 (Ownership Gaps & Unassigned Assets)
  await evalJs(`
    const tabCh7 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CH 07') || b.innerText.includes('GAPS'));
    if (tabCh7) tabCh7.click();
  `);
  await wait(1000);
  await capture('docs/screenshots/08-handover/05-unassigned-assets-chapter.png', 1440, 1150);

  // Scroll down to 30-day Roadmap
  await evalJs(`
    window.scrollTo(0, document.body.scrollHeight);
  `);
  await wait(800);
  await capture('docs/screenshots/08-handover/06-day-1-to-30-roadmap.png', 1440, 1100);

  // ==========================================
  // 09 - GROUNDED Q&A DESK
  // ==========================================
  console.log('\n--- Category 09: Grounded Q&A Desk ---');
  await goto('http://localhost:3000/app/agents', 3000);

  // 1. Submit Grounded Question
  console.log('Testing Grounded Question...');
  await evalJs(`
    const input = document.querySelector('input[placeholder*="Ask about decisions"]');
    if (input) {
      input.value = "When is Project Odyssey Beta launch scheduled?";
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const queryBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Query Knowledge Base'));
    if (queryBtn) queryBtn.click();
  `);
  await wait(4000);
  await capture('docs/screenshots/09-grounded-qa/01-grounded-qa-sufficient-evidence.png', 1440, 1050);

  // 2. Submit Unsupported Question (Insufficent Evidence)
  console.log('Testing Unsupported Question...');
  await evalJs(`
    const input = document.querySelector('input[placeholder*="Ask about decisions"]');
    if (input) {
      input.value = "What is the operational budget of Project Pluto on Neptune?";
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const queryBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Query Knowledge Base'));
    if (queryBtn) queryBtn.click();
  `);
  await wait(4000);
  await capture('docs/screenshots/09-grounded-qa/02-grounded-qa-insufficient-evidence.png', 1440, 1050);

  // ==========================================
  // 10 - EXPORTS
  // ==========================================
  console.log('\n--- Category 10: Exports ---');
  await goto('http://localhost:3000/app/handovers', 3000);

  // Click Print View
  await evalJs(`
    const printBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('PRINT VIEW'));
    if (printBtn) printBtn.click();
  `);
  await wait(1000);
  await capture('docs/screenshots/10-exports/01-print-ready-dossier-view.png', 1440, 1150);

  // Exit print view
  await evalJs(`
    const exitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('EXIT PRINT VIEW') || b.innerText.includes('EXIT'));
    if (exitBtn) exitBtn.click();
  `);
  await wait(500);

  // Click Compile Parameters Modal to show compilation controls
  await evalJs(`
    const compileBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('COMPILE NEW DOSSIER') || b.innerText.includes('COMPILE'));
    if (compileBtn) compileBtn.click();
  `);
  await wait(800);
  await capture('docs/screenshots/10-exports/02-dossier-compilation-parameters.png', 1440, 950);

  // Close compile modal
  await evalJs(`
    const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CANCEL') || b.innerText === '✕');
    if (cancelBtn) cancelBtn.click();
  `);
  await wait(500);

  // Render Markdown & JSON export preview
  await capture('docs/screenshots/10-exports/03-markdown-json-export-options.png', 1440, 950);

  console.log('\n--- ALL SCREENSHOTS CAPTURED SUCCESSFULLY ---');

  await sendBrowser('Target.closeTarget', { targetId });
  browserWs.close();
  chrome.kill();
}

main().catch((err) => {
  console.error('Screenshot suite error:', err);
  process.exit(1);
});

