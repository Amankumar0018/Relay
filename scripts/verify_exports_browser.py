import asyncio
import json
import os
import shutil
import subprocess
import httpx
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DOWNLOAD_DIR = r"C:\Users\Aman\Desktop\Relay\scripts\export_downloads_tmp"
TEMP_USER_DATA = r"C:\Users\Aman\Desktop\Relay\scripts\chrome_export_tmp"
BASE_URL = "http://localhost:3000"

os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(TEMP_USER_DATA, exist_ok=True)

async def test_exports():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9223",
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
            resp = await client.get("http://localhost:9223/json")
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
                        raise Exception(f"CDP Error: {data['error']}")
                    return data.get("result", {})

        await send("Page.enable")
        await send("Browser.setDownloadBehavior", {
            "behavior": "allow",
            "downloadPath": os.path.abspath(DOWNLOAD_DIR),
            "eventsEnabled": True
        })

        # Navigate to /app/handovers
        print("Navigating to http://localhost:3000/app/handovers...")
        await send("Page.navigate", {"url": f"{BASE_URL}/app/handovers"})
        await asyncio.sleep(2.5)

        # Check export buttons
        btns = await send("Runtime.evaluate", {
            "expression": "Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim().toUpperCase())",
            "returnByValue": True
        })
        button_texts = btns.get("result", {}).get("value", [])
        print("Found buttons on /app/handovers:", [b for b in button_texts if "EXPORT" in b])

        # 1. Trigger Export JSON
        print("\nTriggering EXPORT JSON...")
        json_triggered = await send("Runtime.evaluate", {
            "expression": """(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toUpperCase().includes('EXPORT JSON'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            })()""",
            "returnByValue": True
        })
        print("JSON Export button clicked:", json_triggered.get("result", {}).get("value"))

        # 2. Trigger Export Markdown
        print("\nTriggering EXPORT MARKDOWN...")
        md_triggered = await send("Runtime.evaluate", {
            "expression": """(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toUpperCase().includes('EXPORT MARKDOWN'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            })()""",
            "returnByValue": True
        })
        print("Markdown Export button clicked:", md_triggered.get("result", {}).get("value"))

        # Wait for downloads to land on disk
        await asyncio.sleep(2.0)

        # Also extract exported strings directly from page state via in-browser execution as backup verification
        exported_data = await send("Runtime.evaluate", {
            "expression": """(() => {
                // Read active dossier from React / DOM state if needed
                const chapterCount = document.querySelectorAll('button[data-cursor="TAB"]').length;
                const title = document.querySelector('h3')?.innerText || '';
                return { chapterCount, title };
            })()""",
            "returnByValue": True
        })
        print("Page Dossier Metadata:", exported_data.get("result", {}).get("value"))

        # Check files in DOWNLOAD_DIR
        downloaded_files = os.listdir(DOWNLOAD_DIR)
        print(f"\nDownloaded files in {DOWNLOAD_DIR}: {downloaded_files}")

        json_file = next((f for f in downloaded_files if f.endswith(".json")), None)
        md_file = next((f for f in downloaded_files if f.endswith(".md")), None)

        results = {
            "json_valid": False,
            "json_size_bytes": 0,
            "json_chapters_count": 0,
            "json_title": "",
            "md_valid": False,
            "md_size_bytes": 0,
            "md_chapters_found": [],
            "md_all_9_chapters_present": False,
            "files": downloaded_files
        }

        if json_file:
            json_path = os.path.join(DOWNLOAD_DIR, json_file)
            size = os.path.getsize(json_path)
            results["json_size_bytes"] = size
            with open(json_path, "r", encoding="utf-8") as f:
                content = json.load(f)
            results["json_valid"] = True
            results["json_title"] = content.get("title", "")
            chapters = content.get("content", {}).get("chapters", [])
            results["json_chapters_count"] = len(chapters)
            print(f"JSON Export verified: {size} bytes, Title: '{results['json_title']}', Chapters: {len(chapters)}")

        if md_file:
            md_path = os.path.join(DOWNLOAD_DIR, md_file)
            size = os.path.getsize(md_path)
            results["md_size_bytes"] = size
            with open(md_path, "r", encoding="utf-8") as f:
                md_text = f.read()
            results["md_valid"] = (size > 0 and len(md_text) > 100)
            expected_chapters = [
                "Executive Transition Briefing",
                "Organizational State",
                "Ownership Matrix",
                "Decision Ledger",
                "Active Commitments",
                "Unresolved Contradictions",
                "Governance & Signature Authority",
                "Resource Allocation",
                "Incoming Leadership 30-Day Operational Blueprint"
            ]
            found = []
            for idx in range(1, 10):
                if f"Chapter {idx}:" in md_text:
                    found.append(f"Chapter {idx}")
            results["md_chapters_found"] = found
            results["md_all_9_chapters_present"] = (len(found) == 9)
            print(f"Markdown Export verified: {size} bytes, Chapters found: {len(found)}/9 ({found})")

        with open(os.path.join(r"C:\Users\Aman\Desktop\Relay\scripts", "export_verification_result.json"), "w") as f:
            json.dump(results, f, indent=2)

        print("\nExport Verification completed successfully.")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        shutil.rmtree(TEMP_USER_DATA, ignore_errors=True)

if __name__ == "__main__":
    asyncio.run(test_exports())

