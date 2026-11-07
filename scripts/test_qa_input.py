import asyncio
import json
import subprocess
import httpx
import websockets
import os
import shutil

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TEMP_DIR = r"C:\Users\Aman\Desktop\Relay\scripts\chrome_qa_tmp"
os.makedirs(TEMP_DIR, exist_ok=True)

class CDPClient:
    def __init__(self, ws_url):
        self.ws_url = ws_url
        self.ws = None
        self._msg_id = 0
        self.responses = {}
        self.events = []
        self._loaded = asyncio.Event()

    async def connect(self):
        self.ws = await websockets.connect(self.ws_url, max_size=20*1024*1024)
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
        for _ in range(100):
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

async def test_qa():
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

        # 1. Test Export buttons on /app/handovers
        print("Testing /app/handovers export buttons...")
        await cdp.navigate("http://localhost:3000/app/handovers")
        await asyncio.sleep(1.0)
        btns = await cdp.evaluate("Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim())")
        print("Handover Buttons:", btns)
        has_md = any("Export Markdown" in b for b in btns)
        has_json = any("Export JSON" in b for b in btns)
        print(f"Has Export Markdown: {has_md}, Has Export JSON: {has_json}")

        # 2. Test Q&A on /app/agents using preset button click (guaranteed native React click)
        print("\nTesting /app/agents preset query click...")
        await cdp.navigate("http://localhost:3000/app/agents")
        await asyncio.sleep(1.0)

        # Click the first suggested query preset button
        clicked_preset = await cdp.evaluate("""
            (() => {
                const presetBtn = document.querySelector('button[data-cursor=\"QUERY\"]');
                if (presetBtn) {
                    presetBtn.click();
                    return presetBtn.innerText;
                }
                return null;
            })()
        """)
        print(f"Clicked preset button: '{clicked_preset}'")
        await asyncio.sleep(3.5)

        answer = await cdp.evaluate("document.querySelector('.whitespace-pre-wrap')?.innerText || ''")
        citations = await cdp.evaluate("document.querySelectorAll('.border-l-2.border-carbon').length")
        badge = await cdp.evaluate("document.querySelector('.bg-industrial-green')?.innerText || ''")
        print(f"Grounded Answer ({len(answer)} chars): '{answer[:100]}...'")
        print(f"Citations count: {citations}")
        print(f"Badge: '{badge}'")

        # 3. Test Unsupported query via Input.insertText + Enter
        print("\nTesting unsupported query via CDP typing...")
        await cdp.evaluate("document.querySelector('input[placeholder*=\"Ask about decisions\"]').focus()")
        await cdp.evaluate("document.querySelector('input[placeholder*=\"Ask about decisions\"]').value = ''")
        await cdp.send("Input.insertText", {"text": "What is the secret recipe for cafeteria cookies?"})
        await asyncio.sleep(0.3)
        await cdp.send("Input.dispatchKeyEvent", {
            "type": "keyDown",
            "key": "Enter",
            "code": "Enter"
        })
        await asyncio.sleep(3.5)

        refusal_badge = await cdp.evaluate("document.querySelector('.bg-signal-red')?.innerText || ''")
        refusal_text = await cdp.evaluate("document.querySelector('.whitespace-pre-wrap')?.innerText || ''")
        print(f"Refusal Badge: '{refusal_badge}'")
        print(f"Refusal Text: '{refusal_text[:100]}...'")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except:
            proc.kill()
        shutil.rmtree(TEMP_DIR, ignore_errors=True)

asyncio.run(test_qa())

