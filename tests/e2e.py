"""End-to-end check of Pip's bedroom in a real browser.

Starts the dev server on a spare port with a throwaway data folder, then at phone, tablet and
desktop widths clicks through every main interaction: the hero, sound, the big light, the 3D head,
all seven story scenes, the five projects, the Easter egg, chaos mode, the wish jar and the hit
counter. Any console error or warning, page error, failed check or horizontal scroll fails the run.

Needs Python 3 with Playwright (`pip install playwright` then `playwright install chromium`).
Usage: python tests/e2e.py [phone|tablet|desktop ...]
"""
import math
import os
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZES = [(360, 780, "phone"), (768, 1024, "tablet"), (1280, 800, "desktop")]
COOLDOWN = 21  # the wish jar accepts one wish per visitor every 20 s


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def start_server(port, data_dir):
    server = subprocess.Popen(
        ["node", os.path.join(ROOT, "server", "dev.mjs"), "--port", str(port), "--data", data_dir],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    for _ in range(50):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=1)
            return server
        except OSError:
            time.sleep(0.2)
    server.terminate()
    raise RuntimeError("the dev server did not start")


def scroll_scene(pg, n, frac):
    pg.evaluate("""([n, f]) => { const s = document.getElementById('scene-' + n);
      const top = s.getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: top + f * (s.offsetHeight - innerHeight), behavior: 'instant' }); }""", [n, frac])
    pg.wait_for_timeout(650)


def to(pg, sel):
    pg.evaluate("(s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' })", sel)
    pg.wait_for_timeout(450)


def tap(pg, sel, nth=0):
    """Click the centre of an element without letting the browser scroll a sticky stage."""
    box = pg.locator(sel).nth(nth).bounding_box()
    if not box:
        raise AssertionError(f"not visible: {sel}")
    pg.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    pg.wait_for_timeout(250)


def run(browser, url, w, h, tag, last_post):
    logs, errors, checks = [], [], []
    # phones and most laptops scale pages up, so test at the pixel density people really use
    ctx = browser.new_context(viewport={"width": w, "height": h}, has_touch=(w < 800), device_scale_factor=2 if w < 800 else 1.25)
    pg = ctx.new_page()
    pg.on("console", lambda m: m.type in ("error", "warning") and logs.append(f"[{m.type}] {m.text}"))
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(url, wait_until="networkidle")
    pg.wait_for_timeout(900)

    def ok(name, cond):
        checks.append((bool(cond), name))

    def step(name, fn):
        try:
            fn()
        except Exception as e:  # a missing element fails that check, the run carries on
            ok(f"{name} ({str(e).splitlines()[0][:80]})", False)

    no_overflow = "document.documentElement.scrollWidth <= innerWidth"
    ok("no horizontal scroll", pg.evaluate(no_overflow))

    # hero: Pip giggles, the title blocks play notes
    to(pg, "#hero-pip")
    pg.mouse.move(10, 300)
    tap(pg, "#hero-pip")
    ok("hero Pip talks", pg.locator("#hero-pip .bubble.show").count() == 1)
    tap(pg, ".blocks-title .lb", 1)

    # sound: mute draws squiggles instead of playing, and is remembered
    tap(pg, "#btn-sound")
    ok("mute pressed", pg.get_attribute("#btn-sound", "aria-pressed") == "true")
    tap(pg, "#hero-pip")
    ok("muted giggle draws a squiggle", pg.locator("#squiggles .sq").count() >= 1)
    tap(pg, "#btn-sound")
    ok("unmuted", pg.get_attribute("#btn-sound", "aria-pressed") == "false")
    ok("mute state saved", pg.evaluate("localStorage.getItem('pip-muted')") == "false")

    # big light: night (palette + sleepy Pip) and back
    tap(pg, "#btn-light")
    pg.wait_for_timeout(700)
    ok("night theme", pg.evaluate("document.documentElement.dataset.theme") == "night")
    ok("Pip is sleepy at night", pg.evaluate("document.querySelector('#hero-pip .lid').style.transform") != "translateY(0px)")
    tap(pg, "#btn-light")
    pg.wait_for_timeout(700)
    ok("day theme", pg.evaluate("document.documentElement.dataset.theme") == "day")
    ok("theme saved", pg.evaluate("localStorage.getItem('pip-theme')") == '"day"' or pg.evaluate("localStorage.getItem('pip-theme')") == "day")

    # 3D Pip: drawn square (not stretched), then drag to spin
    to(pg, "#zdog-pip")
    ok("3D Pip is not stretched", pg.evaluate("(() => { const c = document.getElementById('zdog-pip'); return Math.abs(c.clientWidth - c.clientHeight) <= 1; })()"))
    box = pg.locator("#zdog-pip").bounding_box()
    pg.mouse.move(box["x"] + box["width"] * 0.3, box["y"] + box["height"] / 2)
    pg.mouse.down()
    pg.mouse.move(box["x"] + box["width"] * 0.8, box["y"] + box["height"] / 2, steps=8)
    pg.mouse.up()

    # the story, scene by scene
    scroll_scene(pg, 1, 0.45)
    step("scene 1 Pip", lambda: tap(pg, ".s1-pip"))
    scroll_scene(pg, 2, 0.25)
    step("scene 2 note", lambda: tap(pg, ".cricket-note"))
    ok("crickets' note flips", pg.get_attribute(".cricket-note", "aria-pressed") == "true")
    scroll_scene(pg, 2, 0.95)
    step("scene 2 window", lambda: tap(pg, ".peek", 0))
    scroll_scene(pg, 3, 0.97)
    step("scene 3 rattle", lambda: tap(pg, ".s3-rattle", 2))
    for i in range(3):
        step(f"scene 3 block {i}", lambda i=i: tap(pg, "#stage-3 .block", i))
        pg.wait_for_timeout(350)
    scroll_scene(pg, 4, 0.97)
    kb = pg.locator("#stage-4 .mbox__key").bounding_box()
    cx, cy = kb["x"] + kb["width"] / 2, kb["y"] + kb["height"] / 2
    pg.mouse.move(cx, cy)
    pg.mouse.down()
    pg.wait_for_timeout(900)
    for k in range(24):
        a = k / 24 * math.pi * 2
        pg.mouse.move(cx + math.cos(a) * 30, cy + math.sin(a) * 30)
    pg.mouse.up()
    pg.wait_for_timeout(600)
    ok("music box plays when wound", pg.locator("#stage-4 .mbox.is-playing").count() == 1)
    scroll_scene(pg, 5, 0.8)
    step("scene 5 lamps", lambda: (tap(pg, ".s5-lamp", 0), tap(pg, ".s5-lamp", 2)))
    ok("lamps light up", pg.locator(".s5-lamp.is-lit").count() >= 2)
    scroll_scene(pg, 6, 0.95)
    step("scene 6 roof", lambda: tap(pg, "#stage-6 .map__stop", 0))
    step("scene 6 weathervane", lambda: tap(pg, "#stage-6 .map__vane-btn"))
    pg.wait_for_timeout(800)
    ok("a dream is delivered", pg.locator("#stage-6 .stop.is-done").count() >= 1)
    scroll_scene(pg, 7, 0.97)
    pg.wait_for_timeout(400)
    ok("growth marks drawn", pg.locator(".s7-mark:not([disabled])").count() == 6)
    ok("'See what Pip made' appears", pg.locator(".s7-see.is-in").count() == 1)

    # the five projects
    to(pg, "#project-1 .lab__tempo")
    step("lab tempo", lambda: tap(pg, ".lab__tempo-btn", 2))
    ok("Lullaby Lab tempo switches", pg.get_attribute(".lab__tempo-btn >> nth=2", "aria-pressed") == "true")
    to(pg, "#project-2 .sill")
    step("nightlight", lambda: tap(pg, ".sill .lamp", 1))
    to(pg, "#project-3 .routes__controls button")
    step("fly the route", lambda: tap(pg, "#project-3 .routes__controls button"))
    to(pg, "#project-4 .shelf__rack")
    step("shelf rattle", lambda: tap(pg, ".shelf__rack .rattle", 2))
    to(pg, "#project-4 .shelf__blocks")
    step("shelf block", lambda: tap(pg, ".shelf__blocks .block", 0))
    to(pg, "#project-6 .toy-btn")
    step("measure Pip", lambda: tap(pg, "#project-6 .toy-btn"))
    to(pg, "#mark-input")
    pg.fill("#mark-input", "stack three socks")
    pg.press("#mark-input", "Enter")
    pg.wait_for_timeout(300)
    ok("visitor's own mark is drawn", pg.locator(".door__mark", has_text="Can stack three socks").count() == 1)

    # Easter egg: tear the calendar until it says TUESDAY
    to(pg, ".calendar")
    fired = False
    for _ in range(8):
        tap(pg, ".calendar")
        pg.wait_for_timeout(300)
        if pg.evaluate("document.documentElement.classList.contains('crickets-back')"):
            fired = True
            break
    pg.wait_for_timeout(700)
    ok("Easter egg: the crickets come back", fired)
    ok("Easter egg: postcard pinned", pg.locator(".postcard:not([hidden])").count() == 1)

    # chaos mode on and off
    tap(pg, "#btn-chaos")
    ok("chaos on", pg.evaluate("document.documentElement.classList.contains('chaos')"))
    ok("chaos: no horizontal scroll", pg.evaluate(no_overflow))
    tap(pg, "#btn-chaos")
    ok("chaos off", not pg.evaluate("document.documentElement.classList.contains('chaos')"))

    # the wish jar and hit counter talk to the API
    wait = COOLDOWN - (time.time() - last_post)
    if wait > 0:
        pg.wait_for_timeout(int(wait * 1000))
    to(pg, "#wish-form")
    pg.fill("#wish-name", f"tester {tag}")
    token = f"{tag}-{int(time.time()) % 100000}"
    pg.fill("#wish-msg", f"A dream about very soft socks ({token}).")
    tap(pg, ".sticker", 3)
    tap(pg, "#wish-send")
    pg.wait_for_timeout(1200)
    last_post = time.time()
    ok("wish accepted", "in the jar" in (pg.text_content("#wish-status") or ""))
    ok("wish appears in the jar", pg.locator("#wish-list .slip__msg", has_text=f"({token})").count() == 1)
    ok("hit counter shows a number", pg.evaluate("document.getElementById('hits-text').textContent").endswith("dreams delivered"))

    # the silence timer: after ~5 s of stillness Pip complains (or hums, if the music box is still going)
    to(pg, "#hello")
    spoke = False
    for _ in range(18):
        pg.wait_for_timeout(500)
        if pg.evaluate("[...document.querySelectorAll('.bubble.show')].some(b => /Say something|Tuesday|Cozy|hmm/.test(b.textContent))"):
            spoke = True
            break
    ok("Pip speaks up after 5 s of quiet", spoke)

    ok("no horizontal scroll at the end", pg.evaluate(no_overflow))
    ctx.close()
    return logs, errors, checks, last_post


def main():
    only = sys.argv[1:]
    port = free_port()
    failed = 0
    with tempfile.TemporaryDirectory() as data_dir:
        server = start_server(port, data_dir)
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(args=["--autoplay-policy=user-gesture-required"])
                last_post = 0.0
                for w, h, tag in SIZES:
                    if only and tag not in only:
                        continue
                    logs, errors, checks, last_post = run(browser, f"http://127.0.0.1:{port}/", w, h, tag, last_post)
                    bad = [c for c in checks if not c[0]]
                    print(f"{tag} {w}x{h}: {len(checks) - len(bad)}/{len(checks)} checks, "
                          f"{len(logs)} console errors/warnings, {len(errors)} page errors")
                    for line in logs + [f"[pageerror] {e}" for e in errors] + [f"FAIL {n}" for _, n in bad]:
                        print("   ", line)
                    failed += len(bad) + len(logs) + len(errors)
                browser.close()
        finally:
            server.terminate()
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
