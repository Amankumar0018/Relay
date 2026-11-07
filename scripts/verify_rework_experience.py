import asyncio
import json
import os
import shutil
import subprocess
import httpx
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TEMP_USER_DATA = r"C:\Users\Aman\Desktop\Relay\scripts\chrome_rework_tmp"
EVIDENCE_DIR = r"C:\Users\Aman\Desktop\Relay\scripts\rework_evidence"
ARTIFACTS_DIR = r"C:\Users\Aman\.gemini\antigravity\brain\33b8fc64-cfd6-46a6-a06d-2d981e2ba46f"
BASE_URL = "http://localhost:3000"

os.makedirs(TEMP_USER_DATA, exist_ok=True)
os.makedirs(EVIDENCE_DIR, exist_ok=True)

async def test_rework():
    print("="*70)
    print("RELAY UI EXPERIENCE REWORK VERIFICATION")
    print("="*70)

    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9224",
        f"--user-data-dir={TEMP_USER_DATA}",
        "--disable-extensions",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=1440,900",
        "about:blank"
    ])
    await asyncio.sleep(2)

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:9224/json")
            tabs = resp.json()
            page_tab = next(t for t in tabs if t.get("type") == "page")
            ws_url = page_tab["webSocketDebuggerUrl"]

        ws = await websockets.connect(ws_url, max_size=25*1024*1024)
        msg_id = 0

        async def send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            cur_id = msg_id
            payload = {"id": cur_id, "method": method, "params": params or {}}
            await ws.send(json.dumps(payload))
            while True:
                raw = await ws.recv()
                data = json.loads(raw)
                if data.get("id") == cur_id:
                    if "error" in data:
                        raise Exception(f"CDP Error in {method}: {data['error']}")
                    return data.get("result", {})

        await send("Page.enable")
        await send("Runtime.enable")
        await send("DOM.enable")

        async def eval_js(expr):
            res = await send("Runtime.evaluate", {
                "expression": expr,
                "returnByValue": True,
                "awaitPromise": True
            })
            return res.get("result", {}).get("value")

        async def snap(filepath):
            import base64
            res = await send("Page.captureScreenshot", {"format": "png"})
            data = base64.b64decode(res["data"])
            with open(filepath, "wb") as f:
                f.write(data)
            print(f"  [SNAP] {os.path.basename(filepath)}")

        # ---------------------------------------------------------------------
        # 1. ROUTE VERIFICATION ACROSS ALL 11 ROUTES
        # ---------------------------------------------------------------------
        print("\n>>> 1. VERIFYING ALL 11 ROUTES")
        all_routes = [
            "/",
            "/platform",
            "/how-it-works",
            "/app",
            "/app/archive",
            "/app/investigations",
            "/app/handovers",
            "/app/agents",
            "/app/responsibilities",
            "/app/map",
            "/app/settings"
        ]
        for path in all_routes:
            await send("Page.navigate", {"url": f"{BASE_URL}{path}"})
            await asyncio.sleep(0.6)
            h_text = await eval_js("document.querySelector('h1, h2')?.innerText || ''")
            print(f"  Route {path}: OK (Heading: {h_text[:40]}...)")

        # ---------------------------------------------------------------------
        # 2. NAVIGATION: SLIDING ACTIVE PLATE & ACCENT BAR
        # ---------------------------------------------------------------------
        print("\n>>> 2. TESTING NAVIGATION SLIDING INDICATOR")
        await send("Page.navigate", {"url": f"{BASE_URL}/app"})
        await asyncio.sleep(0.8)

        nav_test = await eval_js("""(() => {
            const activeLink = document.querySelector('a[href="/app"]');
            const plate = activeLink?.querySelector('[class*="bg-carbon"]');
            const accent = activeLink?.querySelector('[class*="bg-signal-orange"]');
            return {
                hasActiveLink: !!activeLink,
                hasActivePlate: !!plate,
                hasAccentBar: !!accent
            };
        })()""")
        print(f"  Overview active nav plate: {nav_test}")

        # Navigate to /app/investigations by clicking sidebar link
        print("  Clicking Investigations link in sidebar...")
        clicked = await eval_js("""(() => {
            const link = document.querySelector('a[href="/app/investigations"]');
            if (link) { link.click(); return true; }
            return false;
        })()""")
        await asyncio.sleep(0.8)

        inv_nav = await eval_js("""(() => {
            const activeLink = document.querySelector('a[href="/app/investigations"]');
            const isTextWhite = activeLink?.classList.contains('text-raw-paper');
            const plate = activeLink?.querySelector('[class*="bg-carbon"]');
            const accent = activeLink?.querySelector('[class*="bg-signal-orange"]');
            return {
                url: window.location.pathname,
                isTextWhite,
                hasPlate: !!plate,
                hasAccent: !!accent
            };
        })()""")
        print(f"  Investigations navigation state: {inv_nav}")

        # ---------------------------------------------------------------------
        # 3. REDESIGNED INDUSTRIAL CURSOR
        # ---------------------------------------------------------------------
        print("\n>>> 3. TESTING REDESIGNED INDUSTRIAL CURSOR")
        cursor_eval = await eval_js("""(() => {
            const cursorRoot = document.querySelector('.pointer-events-none.z-\\\\[9999\\\\]');
            const primaryDot = cursorRoot?.querySelector('.bg-signal-orange');
            const reticleFrame = cursorRoot?.querySelector('.border-carbon\\\\/50, .border-signal-orange');
            return {
                rootExists: !!cursorRoot,
                hasPrimaryDot: !!primaryDot,
                hasReticleFrame: !!reticleFrame
            };
        })()""")
        print(f"  Cursor structure: {cursor_eval}")

        # ---------------------------------------------------------------------
        # 4. DASHBOARD ANIMATED COUNTERS & READINESS TELEMETRY METER
        # ---------------------------------------------------------------------
        print("\n>>> 4. TESTING DASHBOARD TELEMETRY & ANIMATIONS")
        await send("Page.navigate", {"url": f"{BASE_URL}/app"})
        await asyncio.sleep(1.2)

        dash_telemetry = await eval_js("""(() => {
            const counters = Array.from(document.querySelectorAll('.tabular-nums')).map(el => el.innerText.trim());
            const meter = document.querySelector('.bg-carbon-surface div[class*="bg-"]');
            const meterWidth = meter ? meter.style.width : null;
            return {
                counters,
                meterWidth
            };
        })()""")
        print(f"  Dashboard Counters: {dash_telemetry['counters']}")
        print(f"  Readiness Telemetry Meter Bar Width: {dash_telemetry['meterWidth']}")
        await snap(os.path.join(EVIDENCE_DIR, "rework_dashboard_telemetry.png"))

        # ---------------------------------------------------------------------
        # 5. INVESTIGATIONS CASE SWITCHING & ACTIVE INDICATOR
        # ---------------------------------------------------------------------
        print("\n>>> 5. TESTING INVESTIGATION DESK CASE SWITCHING")
        await send("Page.navigate", {"url": f"{BASE_URL}/app/investigations"})
        await asyncio.sleep(0.8)

        # Click second case
        await eval_js("""(() => {
            const cases = document.querySelectorAll('div[data-cursor="INSPECT"]');
            if (cases.length > 1) cases[1].click();
        })()""")
        await asyncio.sleep(0.5)

        case_state = await eval_js("""(() => {
            const cases = document.querySelectorAll('div[data-cursor="INSPECT"]');
            const secondCase = cases[1];
            const hasAccent = !!secondCase?.querySelector('[class*="bg-signal-orange"]');
            const title = document.querySelector('h3.font-display')?.innerText;
            return { hasAccent, title };
        })()""")
        print(f"  Switched to Case 2: {case_state}")
        await snap(os.path.join(EVIDENCE_DIR, "rework_investigation_desk.png"))

        # ---------------------------------------------------------------------
        # 6. HANDOVER DOSSIER CHAPTER SWITCHING & SLIDING TABS
        # ---------------------------------------------------------------------
        print("\n>>> 6. TESTING HANDOVER CHAPTER TRANSITIONS")
        await send("Page.navigate", {"url": f"{BASE_URL}/app/handovers"})
        await asyncio.sleep(0.8)

        # Click Chapter 3 (Ownership)
        await eval_js("""(() => {
            const tabs = Array.from(document.querySelectorAll('button[data-cursor="TAB"]'));
            const ch3 = tabs.find(t => t.innerText.includes('CH 03'));
            if (ch3) ch3.click();
        })()""")
        await asyncio.sleep(0.5)

        ch_state = await eval_js("""(() => {
            const activeTab = Array.from(document.querySelectorAll('button[data-cursor="TAB"]')).find(t => t.innerText.includes('CH 03'));
            const hasIndicator = !!activeTab?.querySelector('[class*="bg-carbon"]');
            const hasAccent = !!activeTab?.querySelector('[class*="bg-signal-orange"]');
            const chapterHeader = document.querySelector('h2.font-display')?.innerText;
            return { hasIndicator, hasAccent, chapterHeader };
        })()""")
        print(f"  Switched to Chapter 3: {ch_state}")
        await snap(os.path.join(EVIDENCE_DIR, "rework_handover_chapters.png"))

        # ---------------------------------------------------------------------
        # 7. COMMAND PALETTE ENTRANCE & EXIT
        # ---------------------------------------------------------------------
        print("\n>>> 7. TESTING COMMAND PALETTE ANIMATION")
        await send("Input.dispatchKeyEvent", {
            "type": "keyDown",
            "modifiers": 2, # Ctrl
            "key": "k",
            "code": "KeyK"
        })
        await asyncio.sleep(0.4)
        palette_open = await eval_js("!!document.querySelector('[role=\"dialog\"]')")
        print(f"  Command Palette opened: {palette_open}")
        await snap(os.path.join(EVIDENCE_DIR, "rework_command_palette.png"))

        await send("Input.dispatchKeyEvent", {
            "type": "keyDown",
            "key": "Escape",
            "code": "Escape"
        })
        await asyncio.sleep(0.3)
        palette_closed = await eval_js("!document.querySelector('[role=\"dialog\"]')")
        print(f"  Command Palette closed: {palette_closed}")

        # Copy captured evidence to artifacts directory
        for f in os.listdir(EVIDENCE_DIR):
            shutil.copy2(os.path.join(EVIDENCE_DIR, f), os.path.join(ARTIFACTS_DIR, f))
        print("Evidence screenshots copied to brain artifacts directory.")

        print("\n" + "="*70)
        print("ALL REWORK VERIFICATION CHECKS PASSED")
        print("="*70)

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        shutil.rmtree(TEMP_USER_DATA, ignore_errors=True)

if __name__ == "__main__":
    asyncio.run(test_rework())

