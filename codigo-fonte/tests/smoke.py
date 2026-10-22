"""Teste rápido (opcional): python3 tests/smoke.py  — requer: pip install playwright && playwright install chromium"""
import subprocess, time, sys
from playwright.sync_api import sync_playwright
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); ok = True
        for w in (320, 360, 390, 430):
            pg = b.new_page(viewport={"width": w, "height": 800}); errs = []; reqs = []
            pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("requestfailed", lambda r: reqs.append(r.url) if "fonts.g" not in r.url else None)
            pg.goto("http://localhost:8765/index.html"); pg.wait_for_timeout(500)
            sw = pg.evaluate("document.documentElement.scrollWidth"); n = pg.evaluate("document.querySelectorAll('.th svg,.th img').length")
            good = sw <= w and not errs and not reqs and n >= 4 and pg.locator("#demo-video").count() == 1 and "670,70" in pg.inner_text("#r-title")
            print(w, "OK" if good else "FALHA", dict(scrollWidth=sw, thumbs=n, errors=errs, failed=reqs)); ok &= good
        b.close(); sys.exit(0 if ok else 1)
finally: srv.terminate()
