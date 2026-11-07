import urllib.request
import re

url = "https://thegavshackathon.com/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode("utf-8", errors="ignore")

title = re.findall(r"<title>(.*?)</title>", html)
print("Title:", title)
print("Contains GSAP:", "gsap" in html.lower())
print("Contains Framer Motion / Framer:", "framer" in html.lower())
print("Contains Lenis / Smooth Scroll:", "lenis" in html.lower())
print("Contains Locomotive:", "locomotive" in html.lower())

scripts = re.findall(r'<script[^>]*src=["\']([^"\']+)["\']', html)
print("\nScripts:")
for s in scripts[:10]:
    print(" ", s)

print("\nSnippets of inline scripts / motion triggers:")
inlines = re.findall(r"<script[^>]*>(.*?)</script>", html, re.DOTALL)
for inl in inlines[:5]:
    if any(k in inl.lower() for k in ["scroll", "cursor", "animate", "gsap", "motion", "nav"]):
        print("Inline script snippet:", inl[:300].strip())

