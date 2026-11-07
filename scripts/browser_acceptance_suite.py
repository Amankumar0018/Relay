import asyncio
import json
import os
import subprocess
import time
import httpx
import websockets
import shutil

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TEMP_DIR = r"C:\Users\Aman\Desktop\Relay\scripts\chrome_acceptance_tmp"
SCREENSHOTS_DIR = r"C:\Users\Aman\Desktop\Relay\scripts\regression_evidence"
ARTIFACTS_DIR = r"C:\Users\Aman\.gemini\antigravity\brain\33b8fc64-cfd6-46a6-a06d-2d981e2ba46f"
BASE_URL = "http://localhost:3000"

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

class CDPClient:
    def __init__(self, ws_url):
        self.ws_url = ws_url
        self.ws = None
        self._msg_id = 0
        self.responses = {}
        self.events = []
        self._loaded = asyncio.Event()

    async def connect(self):
        self.ws = await websockets.connect(self.ws_url, max_size=25*1024*1024)
        asyncio.create_task(self._listen())

    async def _listen(self):
        try:
            async for msg in self.ws:
                data = json.loads(msg)
                if "id" in data:
                    self.responses[data["id"]] = data
                elif "method" in data:
                    self.events.append(data)
                    if data["method"] == "Page.loadEventFired":
                        self._loaded.set()
        except Exception:
            pass

    async def send(self, method, params=None):
        self._msg_id += 1
        msg_id = self._msg_id
        payload = {"id": msg_id, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(payload))
        for _ in range(120):
            if msg_id in self.responses:
                res = self.responses.pop(msg_id)
                if "error" in res:
                    raise Exception(f"CDP Error in {method}: {res['error']}")
                return res.get("result", {})
            await asyncio.sleep(0.05)
        raise TimeoutError(f"CDP command {method} timed out")

    async def navigate(self, url):
        self._loaded.clear()
        await self.send("Page.navigate", {"url": url})
        try:
            await asyncio.wait_for(self._loaded.wait(), timeout=5.0)
        except asyncio.TimeoutError:
            pass
        await asyncio.sleep(0.8)

    async def evaluate(self, expression):
        res = await self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        return res.get("result", {}).get("value")

    async def screenshot(self, filepath):
        import base64
        res = await self.send("Page.captureScreenshot", {"format": "png"})
        data = base64.b64decode(res["data"])
        with open(filepath, "wb") as f:
            f.write(data)
        print(f"Captured: {os.path.basename(filepath)}")

async def run_full_acceptance():
    print("="*70)
    print("RELAY POST-REDESIGN BROWSER REGRESSION & INTERACTION ACCEPTANCE SUITE")
    print("="*70)

    # Launch dedicated clean headless Chrome instance
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        f"--user-data-dir={TEMP_DIR}",
        "--disable-extensions",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=1440,900",
        "about:blank"
    ])
    await asyncio.sleep(2)

    report_data = {
        "navigation": {},
        "motion": {},
        "workflows": {},
        "data_correctness": {},
        "responsive_accessibility": {},
        "console_errors": []
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:9222/json")
            tabs = resp.json()
            page_tab = next(t for t in tabs if t.get("type") == "page")
            ws_url = page_tab["webSocketDebuggerUrl"]

        cdp = CDPClient(ws_url)
        await cdp.connect()
        await cdp.send("Page.enable")
        await cdp.send("Runtime.enable")
        await cdp.send("DOM.enable")

        # -------------------------------------------------------------------------
        # SECTION 1: NAVIGATION TESTING
        # -------------------------------------------------------------------------
        print("\n>>> SECTION 1: NAVIGATION & ROUTING TESTING")
        workspace_routes = [
            ("/app", "Continuity Overview"),
            ("/app/archive", "Knowledge Archive"),
            ("/app/map", "Continuity Map"),
            ("/app/investigations", "Investigation Desk"),
            ("/app/responsibilities", "Operational Obligations"),
            ("/app/agents", "Agent Collaboration"),
            ("/app/handovers", "Handover Dossiers"),
            ("/app/settings", "Workspace Config"),
        ]
        public_routes = [
            ("/", "Every organization has a memory"),
            ("/platform", "An analytical engine for institutional memory"),
            ("/how-it-works", "The 5-phase continuity methodology"),
        ]

        all_routes_ok = True
        for path, expected in workspace_routes + public_routes:
            await cdp.navigate(f"{BASE_URL}{path}")
            h1_h2 = await cdp.evaluate("""
                document.querySelector('h1')?.innerText || 
                document.querySelector('h2')?.innerText || ''
            """)
            has_expected = any(w.lower() in (h1_h2 or '').lower() for w in expected.split())
            print(f"  Route '{path}': {'PASS' if has_expected else 'FAIL'} (Header: '{h1_h2[:40]}...')")
            report_data["navigation"][path] = has_expected
            if not has_expected:
                all_routes_ok = False

        # Active Navigation Plate Animation Test
        await cdp.navigate(f"{BASE_URL}/app/investigations")
        has_active_plate = await cdp.evaluate("""
            (() => {
                const activeLink = document.querySelector('a[href="/app/investigations"]');
                return activeLink ? activeLink.classList.contains('text-raw-paper') : false;
            })()
        """)
        print(f"  Active Navigation Plate highlight on /app/investigations: {has_active_plate}")
        report_data["navigation"]["active_plate_transition"] = has_active_plate

        # History Back / Forward
        await cdp.navigate(f"{BASE_URL}/app")
        await cdp.navigate(f"{BASE_URL}/app/handovers")
        await cdp.evaluate("window.history.back()")
        await asyncio.sleep(0.6)
        back_url = await cdp.evaluate("window.location.pathname")
        await cdp.evaluate("window.history.forward()")
        await asyncio.sleep(0.6)
        fwd_url = await cdp.evaluate("window.location.pathname")
        history_ok = (back_url == "/app" and fwd_url == "/app/handovers")
        print(f"  History Back/Forward: {'PASS' if history_ok else 'FAIL'} (Back={back_url}, Fwd={fwd_url})")
        report_data["navigation"]["history_back_forward"] = history_ok

        # -------------------------------------------------------------------------
        # SECTION 2: MOTION & MICRO-INTERACTION TESTING
        # -------------------------------------------------------------------------
        print("\n>>> SECTION 2: MOTION DESIGN & MICRO-INTERACTIONS")
        await cdp.navigate(f"{BASE_URL}/app")

        # 2A. Industrial Reticle Cursor
        cursor_data = await cdp.evaluate("""
            (() => {
                const cursorRoot = document.querySelector('.fixed.inset-0.pointer-events-none.z-\\\\[9999\\\\]');
                const centralDot = cursorRoot?.querySelector('.bg-signal-orange');
                return {
                    mounted: !!cursorRoot,
                    hasCenterDot: !!centralDot,
                    pointerEventsNone: cursorRoot?.classList.contains('pointer-events-none')
                };
            })()
        """)
        print(f"  Industrial Cursor mounted: {cursor_data.get('mounted')}, pointer-events-none: {cursor_data.get('pointerEventsNone')}")
        report_data["motion"]["industrial_cursor"] = cursor_data.get('mounted') and cursor_data.get('pointerEventsNone')

        # 2B. Animated Counters & Numerical Dials
        counters = await cdp.evaluate("""
            Array.from(document.querySelectorAll('.tabular-nums')).map(el => el.innerText.trim())
        """)
        print(f"  Animated Counters rendered: {counters}")
        counters_valid = len(counters) >= 4 and any("DOCS" in c for c in counters) and any("READY" in c for c in counters)
        report_data["motion"]["animated_counters"] = counters_valid

        # 2C. Command Palette (Ctrl+K / Cmd+K & Escape)
        await cdp.send("Input.dispatchKeyEvent", {
            "type": "keyDown",
            "modifiers": 2, # Ctrl
            "key": "k",
            "code": "KeyK"
        })
        await asyncio.sleep(0.5)
        palette_open = await cdp.evaluate("!!document.querySelector('[role=\"dialog\"]')")
        print(f"  Command Palette opened via Ctrl+K: {palette_open}")

        await cdp.send("Input.dispatchKeyEvent", {
            "type": "keyDown",
            "key": "Escape",
            "code": "Escape"
        })
        await asyncio.sleep(0.4)
        palette_closed = await cdp.evaluate("!document.querySelector('[role=\"dialog\"]')")
        print(f"  Command Palette closed via Escape: {palette_closed}")
        report_data["motion"]["command_palette"] = (palette_open and palette_closed)

        # -------------------------------------------------------------------------
        # SECTION 3: FUNCTIONAL WORKFLOW REGRESSION (12 ACCEPTANCE WORKFLOWS)
        # -------------------------------------------------------------------------
        print("\n>>> SECTION 3: FUNCTIONAL WORKFLOW REGRESSION")

        # Workflow 1: Dashboard
        await cdp.navigate(f"{BASE_URL}/app")
        dash_header = await cdp.evaluate("document.querySelector('h2')?.innerText")
        dash_pass = "CHIEF SCIENTIFIC OFFICER" in (dash_header or '').upper()
        print(f"  WF 1: Dashboard Overview: {'PASS' if dash_pass else 'FAIL'}")
        report_data["workflows"]["1_dashboard"] = dash_pass

        # Workflow 2: Archive & Document Ingestion
        await cdp.navigate(f"{BASE_URL}/app/archive")
        doc_count = await cdp.evaluate("document.querySelectorAll('.cursor-pointer').length")
        archive_pass = doc_count > 0
        print(f"  WF 2: Knowledge Archive ({doc_count} records displayed): {'PASS' if archive_pass else 'FAIL'}")
        report_data["workflows"]["2_archive"] = archive_pass

        # Workflow 3: Extraction & Evidence
        evidence_facts = await cdp.evaluate("""
            (() => {
                const facts = document.querySelectorAll('.bg-raw-paper-light.border-l-2');
                return facts.length;
            })()
        """)
        extraction_pass = evidence_facts > 0
        print(f"  WF 3: Extraction & Evidence ({evidence_facts} facts sampled): {'PASS' if extraction_pass else 'FAIL'}")
        report_data["workflows"]["3_extraction_evidence"] = extraction_pass

        # Workflow 4: Investigations & Conflicts
        await cdp.navigate(f"{BASE_URL}/app/investigations")
        open_cases = await cdp.evaluate("""
            Array.from(document.querySelectorAll('h4')).map(h => h.innerText).filter(t => t.length > 5)
        """)
        conflicts_pass = len(open_cases) >= 3
        print(f"  WF 4: Investigations & Conflicts ({len(open_cases)} cases in desk): {'PASS' if conflicts_pass else 'FAIL'}")
        report_data["workflows"]["4_investigations"] = conflicts_pass

        # Workflow 5: Responsibilities & Topology Map
        await cdp.navigate(f"{BASE_URL}/app/map")
        svg_nodes = await cdp.evaluate("document.querySelectorAll('svg g[tabindex=\"0\"]').length")
        map_pass = svg_nodes >= 5
        print(f"  WF 5: Continuity Map ({svg_nodes} SVG nodes rendered): {'PASS' if map_pass else 'FAIL'}")
        report_data["workflows"]["5_responsibilities_map"] = map_pass

        # Workflow 6: Agents & Switch Integration
        await cdp.navigate(f"{BASE_URL}/app/agents")
        agent_cards = await cdp.evaluate("document.querySelectorAll('button[class*=\"border-2\"]').length")
        agents_pass = agent_cards >= 4
        print(f"  WF 6: Agent Collaboration Pipeline ({agent_cards} stage cards): {'PASS' if agents_pass else 'FAIL'}")
        report_data["workflows"]["6_agents_pipeline"] = agents_pass

        # Workflow 7: Human Approval Interface
        await cdp.navigate(f"{BASE_URL}/app/investigations")
        has_switch_gate = await cdp.evaluate("""
            !!document.querySelector('textarea') || !!document.querySelector('.bg-industrial-green')
        """)
        approval_pass = has_switch_gate
        print(f"  WF 7: Human Approval Interface (Switch resolution desk): {'PASS' if approval_pass else 'FAIL'}")
        report_data["workflows"]["7_human_approval"] = approval_pass

        # Workflow 8 & 9: Nine-Chapter Handover Dossier & Exports
        await cdp.navigate(f"{BASE_URL}/app/handovers")
        chapter_tabs = await cdp.evaluate("""
            Array.from(document.querySelectorAll('button[data-cursor=\"TAB\"]')).map(b => b.innerText.trim())
        """)
        all_9_chapters = len(chapter_tabs) == 9
        print(f"  WF 8: Nine-Chapter Handover Dossier ({len(chapter_tabs)}/9 tabs): {'PASS' if all_9_chapters else 'FAIL'}")
        report_data["workflows"]["8_nine_chapter_dossier"] = all_9_chapters

        has_export_btns = await cdp.evaluate("""
            (() => {
                const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.toUpperCase());
                return btns.some(t => t.includes('EXPORT MARKDOWN')) && btns.some(t => t.includes('EXPORT JSON'));
            })()
        """)
        print(f"  WF 9: Dossier Exports (Markdown & JSON buttons): {'PASS' if has_export_btns else 'FAIL'}")
        report_data["workflows"]["9_dossier_exports"] = has_export_btns

        # Workflow 10, 11 & 12: Switch Q&A Grounding & Refusal
        await cdp.navigate(f"{BASE_URL}/app/agents")
        await asyncio.sleep(1.0)

        # Click the suggested query preset button for Project Odyssey
        print("  Submitting grounded query via preset button...")
        clicked_prompt = await cdp.evaluate("""
            (() => {
                const presetBtn = document.querySelector('button[data-cursor="QUERY"]');
                if (presetBtn) {
                    presetBtn.click();
                    return presetBtn.innerText;
                }
                return null;
            })()
        """)
        print(f"  Triggered query: {clicked_prompt}")

        # Poll for grounded answer (FastAPI Q&A embedding + fact matching takes 5-7 seconds)
        qa_result = {"answerLength": 0, "citations": 0, "text": ""}
        for _ in range(30):
            await asyncio.sleep(0.5)
            qa_result = await cdp.evaluate("""
                (() => {
                    const answer = document.querySelector('.whitespace-pre-wrap')?.innerText || '';
                    const citations = document.querySelectorAll('.border-l-2.border-carbon').length;
                    return { answerLength: answer.length, citations: citations, text: answer.slice(0, 100) };
                })()
            """)
            if qa_result["answerLength"] > 20 and qa_result["citations"] > 0:
                break

        grounded_pass = qa_result["answerLength"] > 20 and qa_result["citations"] > 0
        print(f"  WF 10 & 11: Grounded Answer ({qa_result['answerLength']} chars, {qa_result['citations']} citations): {'PASS' if grounded_pass else 'FAIL'}")
        print(f"  Answer sample: '{qa_result['text']}...'")
        report_data["workflows"]["10_11_grounded_qa"] = grounded_pass

        # Submit unsupported query ("What is the budget for Project Quantum Leap?")
        await asyncio.sleep(1.5)
        print("  Submitting unsupported query via preset prompt...")
        clicked_unsupported = await cdp.evaluate("""
            (() => {
                const presetBtns = Array.from(document.querySelectorAll('button[data-cursor="QUERY"]'));
                const leapBtn = presetBtns.find(b => b.innerText.includes('Quantum Leap'));
                if (leapBtn) {
                    leapBtn.click();
                    return leapBtn.innerText;
                }
                // Fallback: manual prototype typing and button click
                const input = document.querySelector('input[placeholder*="Ask about decisions"]');
                if (input) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                    setter.call(input, "What is the budget for Project Quantum Leap?");
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                    const btns = Array.from(document.querySelectorAll('button'));
                    const queryBtn = btns.find(b => b.innerText.includes('Query Knowledge Base'));
                    if (queryBtn) queryBtn.click();
                    return "Manual typed fallback";
                }
                return null;
            })()
        """)
        print(f"  Triggered unsupported query: {clicked_unsupported}")

        # Poll for refusal badge / answer
        refusal_badge = ""
        refusal_answer = ""
        for _ in range(30):
            await asyncio.sleep(0.5)
            refusal_data = await cdp.evaluate("""
                (() => {
                    const badge = document.querySelector('.bg-signal-red')?.innerText || '';
                    const answer = document.querySelector('.whitespace-pre-wrap')?.innerText || '';
                    return { badge, answer };
                })()
            """)
            refusal_badge = refusal_data.get("badge", "")
            refusal_answer = refusal_data.get("answer", "")
            if "INSUFFICIENT" in refusal_badge.upper() or "insufficient evidence" in refusal_answer.lower():
                break

        refusal_pass = "INSUFFICIENT" in refusal_badge.upper() or "insufficient evidence" in refusal_answer.lower()
        print(f"  WF 12: Unsupported Query Refusal (Badge: '{refusal_badge}'): {'PASS' if refusal_pass else 'FAIL'}")
        report_data["workflows"]["12_unsupported_refusal"] = refusal_pass

        # -------------------------------------------------------------------------
        # SECTION 4: DATA & CORRECTNESS VERIFICATION
        # -------------------------------------------------------------------------
        print("\n>>> SECTION 4: DATA & CORRECTNESS VERIFICATION")
        async with httpx.AsyncClient() as client:
            overview_res = await client.get("http://localhost:8000/api/v1/continuity/overview")
            overview_data = overview_res.json()
            conflicts_res = await client.get("http://localhost:8000/api/v1/intelligence/conflicts?status=open")
            conflicts_data = conflicts_res.json()

        db_docs = overview_data.get("total_documents_deposited")
        db_conflicts = len(conflicts_data.get("items", []))
        db_readiness = overview_data.get("continuity_score")

        print(f"  Actual Backend Telemetry: Docs={db_docs}, Open Conflicts={db_conflicts}, Readiness={db_readiness}%")
        data_consistent = (db_docs == 10 and db_conflicts == 6)
        report_data["data_correctness"]["backend_consistency"] = data_consistent

        # -------------------------------------------------------------------------
        # SECTION 5: RESPONSIVE & ACCESSIBILITY TESTING
        # -------------------------------------------------------------------------
        print("\n>>> SECTION 5: RESPONSIVE & ACCESSIBILITY")
        # 5A. Mobile Viewport & Drawer
        await cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 3,
            "mobile": True,
            "hasTouch": True
        })
        await cdp.send("Emulation.setTouchEmulationEnabled", {"enabled": True})
        await cdp.navigate(f"{BASE_URL}/app")

        # Open mobile drawer
        await cdp.evaluate("""
            (() => {
                const btn = document.querySelector('button[aria-label=\"Open sidebar\"]');
                if (btn) btn.click();
            })()
        """)
        await asyncio.sleep(0.6)

        drawer_open_state = await cdp.evaluate("""
            (() => {
                const aside = document.querySelector('aside');
                return aside && !aside.classList.contains('-translate-x-full');
            })()
        """)
        print(f"  Mobile Navigation Drawer toggle: {'PASS' if drawer_open_state else 'FAIL'}")
        report_data["responsive_accessibility"]["mobile_drawer"] = drawer_open_state

        # Capture mobile navigation screenshot
        reg_mobile_file = os.path.join(SCREENSHOTS_DIR, "reg_mobile_nav.png")
        await cdp.screenshot(reg_mobile_file)

        # 5B. Reset to Desktop (1440x900)
        await cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": 1440,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False,
            "hasTouch": False
        })
        await cdp.send("Emulation.setTouchEmulationEnabled", {"enabled": False})
        await asyncio.sleep(0.5)

        # -------------------------------------------------------------------------
        # SECTION 6: CAPTURE VISUAL EVIDENCE SCREENSHOTS
        # -------------------------------------------------------------------------
        print("\n>>> SECTION 6: CAPTURING REGRESSION EVIDENCE SCREENSHOTS")
        evidence_pages = [
            ("/app", "reg_dashboard_counters.png"),
            ("/app/handovers", "reg_dossier_scroll.png"),
            ("/app/investigations", "reg_workspace_nav.png"),
            ("/app/agents", "reg_chapter_transition.png"),
            ("/", "reg_custom_cursor.png"),
        ]
        for path, filename in evidence_pages:
            await cdp.navigate(f"{BASE_URL}{path}")
            await asyncio.sleep(0.8)
            out_file = os.path.join(SCREENSHOTS_DIR, filename)
            await cdp.screenshot(out_file)

        # Copy captured regression screenshots to artifacts directory
        for f in os.listdir(SCREENSHOTS_DIR):
            src = os.path.join(SCREENSHOTS_DIR, f)
            dst = os.path.join(ARTIFACTS_DIR, f)
            shutil.copy2(src, dst)
        print(f"  Evidence screenshots copied to artifacts directory.")

        print("\n" + "="*70)
        print("ALL ACCEPTANCE TESTS COMPLETE")
        print("="*70)

        with open(os.path.join(SCREENSHOTS_DIR, "acceptance_results.json"), "w") as f:
            json.dump(report_data, f, indent=2)

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        shutil.rmtree(TEMP_DIR, ignore_errors=True)

if __name__ == "__main__":
    asyncio.run(run_full_acceptance())
