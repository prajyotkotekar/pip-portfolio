// Plumbing shared by the seven story scenes: scroll progress, step marks, art boxes, pans, bubbles.
import { M, clamp, svg, h, place, motionPrefs, easeInOut } from "../state.js";

/**
 * Calls fn(p, marks) as the scene scrolls. p is 0 when the scene's top reaches the top of the
 * viewport and 1 when its bottom reaches the bottom. marks[i] is the progress at which step i's
 * top crosses the middle of the screen, so beats can line up with the text cards in any layout.
 */
export function onProgress(section, fn) {
  const steps = [...section.querySelectorAll(".step")];
  let marks = [];
  let last = -1;

  const measure = () => {
    const travel = section.offsetHeight - innerHeight;
    marks = steps.map((s) => clamp((s.offsetTop - innerHeight * 0.5) / Math.max(1, travel)));
    last = -1;
  };
  measure();
  addEventListener("resize", () => { measure(); if (current >= 0) fn(current, marks); }, { passive: true });

  let current = -1;
  const run = (p) => {
    current = p;
    if (Math.abs(p - last) < 0.0004) return;
    last = p;
    fn(p, marks);
  };

  if (M && M.scroll) {
    M.scroll((p) => run(p), { target: section, offset: ["start start", "end end"] });
  } else {
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      run(clamp(-r.top / Math.max(1, r.height - innerHeight)));
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  return () => marks;
}

/** A square art box (600 x 600 viewBox) that keeps HTML hot-spots aligned with the SVG. */
export function artBox(parent, cls = "") {
  const box = h("div", { class: `art ${cls}` });
  const s = svg("", { viewBox: "0 0 600 600", class: "art__svg", "aria-hidden": "true", focusable: "false" });
  box.append(s);
  parent.append(box);
  return { box, svg: s };
}

/** A clickable hot-spot over the art. Coordinates are viewBox units. */
export function hotspot(box, { x, y, w, h: hh, label, cls = "", disabled = false }) {
  const b = h("button", { type: "button", class: `hot ${cls}`, "aria-label": label });
  place(b, x, y, w, hh);
  if (disabled) b.disabled = true;
  box.append(b);
  return b;
}

/** Two side-by-side panels; set(t) pans from the first to the second (crossfade if reduced motion). */
export function pan(stage) {
  const track = h("div", { class: "pan" });
  const a = h("div", { class: "panel panel--a" });
  const b = h("div", { class: "panel panel--b" });
  track.append(a, b);
  stage.append(track);
  const fade = motionPrefs.reduced;
  if (fade) track.classList.add("pan--fade");
  let lastT = -1;
  return {
    a,
    b,
    set(t) {
      t = clamp(t);
      if (t === lastT) return;
      lastT = t;
      if (fade) {
        b.style.opacity = String(t);
        b.style.visibility = t > 0.01 ? "visible" : "hidden";
        a.style.visibility = t < 0.99 ? "visible" : "hidden";
      } else {
        track.style.transform = `translate3d(${(-50 * easeInOut(t)).toFixed(3)}%, 0, 0)`;
      }
      a.inert = t > 0.6;
      b.inert = t < 0.4;
    },
  };
}

/** A short-lived speech bubble anchored in an art box at viewBox coordinates. */
export function artBubble(box, text, x, y, { ms = 2600, side = "above" } = {}) {
  let b = box._bubble;
  if (!b) {
    b = h("div", { class: "bubble art-bubble", "aria-hidden": "true" });
    box.append(b);
    box._bubble = b;
  }
  b.className = `bubble art-bubble bubble--${side}`;
  b.textContent = text;
  place(b, x, y);
  b.classList.toggle("flip-left", x > 430);
  b.classList.toggle("flip-right", x < 150);
  requestAnimationFrame(() => b.classList.add("show"));
  const live = document.getElementById("pip-voice");
  if (live) live.textContent = text;
  clearTimeout(b._t);
  b._t = setTimeout(() => b.classList.remove("show"), ms);
}

/** Tells the rest of the page which scene is on screen (used by the silence timer). */
export function markScene(section, n) {
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) document.documentElement.dataset.scene = String(n);
    else if (document.documentElement.dataset.scene === String(n)) delete document.documentElement.dataset.scene;
  }, { threshold: 0, rootMargin: "-45% 0px -45% 0px" });
  io.observe(section);
}

/** Calls fn(true/false) when the section's sticky stage is on screen. */
export function onStageVisible(section, fn) {
  const io = new IntersectionObserver(([e]) => fn(e.isIntersecting), { rootMargin: "0px" });
  io.observe(section);
}

/**
 * Portrait screens: the art sits on top and the story cards rise from the bottom. A card that
 * scrolls up past the bottom of the art fades out, so it never covers the picture.
 */
export function initCardFade() {
  const portrait = matchMedia("(max-aspect-ratio: 1/1), (max-width: 639.98px)");
  const scenes = [...document.querySelectorAll(".scene")];
  const live = new Set();
  let line = 0;
  let raf = 0;

  const measure = () => {
    const art = document.querySelector(".scene .art");
    // measured inside the sticky stage, so it's right even while the scene is off screen
    line = art ? art.offsetTop + art.offsetHeight : 0;
  };
  const check = () => {
    raf = 0;
    const on = portrait.matches;
    live.forEach((scene) => {
      scene.querySelectorAll(".card").forEach((c) => {
        const r = c.getBoundingClientRect();
        c.classList.toggle("is-past", on && r.top < line - 4 && r.bottom < innerHeight - 30);
      });
    });
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(check); };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)));
    queue();
  });
  scenes.forEach((s) => io.observe(s));
  measure();
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", () => { measure(); queue(); }, { passive: true });
}
