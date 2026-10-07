#!/usr/bin/env python3
"""tools/og.html 을 1200×630 으로 캡처해 og.png 를 만든다.

책 수·책등은 data/books.json, 실험 수는 data/experiment-catalog.json 에서 읽으므로
책을 출간하고 collect-experiments.py 를 돌린 뒤 다시 실행한다.
필요: pip install playwright && playwright install chromium
실행: python3 tools/build-og.py
"""
import functools, http.server, pathlib, threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


handler = functools.partial(Quiet, directory=str(ROOT))
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        page.goto(f"http://127.0.0.1:{server.server_port}/tools/og.html")
        page.wait_for_selector("body[data-ready='1']", timeout=20000)
        page.screenshot(path=str(ROOT / "og.png"))
        browser.close()
finally:
    server.shutdown()
print("og.png 1200x630")
