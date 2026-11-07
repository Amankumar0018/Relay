import subprocess
import time
import os

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PAGES = [
    ("http://localhost:3000/", r"C:\Users\Aman\Desktop\Relay\scripts\upgraded_home.png"),
    ("http://localhost:3000/app", r"C:\Users\Aman\Desktop\Relay\scripts\upgraded_overview.png"),
    ("http://localhost:3000/app/handovers", r"C:\Users\Aman\Desktop\Relay\scripts\upgraded_handovers.png"),
    ("http://localhost:3000/app/investigations", r"C:\Users\Aman\Desktop\Relay\scripts\upgraded_investigations.png"),
]

for url, out_path in PAGES:
    print(f"Capturing {url} -> {out_path}")
    cmd = [
        CHROME,
        "--headless",
        "--disable-gpu",
        "--window-size=1440,900",
        "--virtual-time-budget=4000",
        f"--screenshot={out_path}",
        url
    ]
    subprocess.run(cmd, check=True)
    time.sleep(1)

print("Screenshots captured with virtual time budget.")
