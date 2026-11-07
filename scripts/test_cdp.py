import asyncio
import json
import subprocess
import httpx
import websockets
import os
import shutil

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TEMP_DIR = r"C:\Users\Aman\Desktop\Relay\scripts\chrome_tmp"
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
        except Exception as e:
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
        await asyncio.sleep(0.5)

    async def evaluate(self, expression):
        res = await self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        return res.get("result", {}).get("value")

async def test_conn():
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

        print("Navigating to /app...")
        await cdp.navigate("http://localhost:3000/app")
        h2 = await cdp.evaluate("document.querySelector('h2')?.innerText")
        print("H2 evaluated:", h2)

        counters = await cdp.evaluate("Array.from(document.querySelectorAll('.tabular-nums')).map(e => e.innerText)")
        print("Counters evaluated:", counters)

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except:
            proc.kill()
        shutil.rmtree(TEMP_DIR, ignore_errors=True)

asyncio.run(test_conn())
