// Room-wide motion: the night-o-meter, the hero's entrance and parallax, toys being set down on
// their shelves as they scroll into view, and a gentle 3D tilt on each toy. Everything animates
// transform-type properties and opacity only, and scroll-linked parts run on the browser's own
// scroll timeline where it has one. Reduced motion keeps the meter and drops the rest.
import { M, motionPrefs, clamp } from "./state.js";

const SPRING = { type: "spring", bounce: 0.25, duration: 0.6 };

/** the bar under the crib bumper fills, and the moon crosses the sky, as you scroll down */
function nightMeter() {
  const meter = document.querySelector(".nightmeter");
  if (!meter || !M?.scroll) return;
  const fill = meter.querySelector(".nightmeter__fill");
  const moon = meter.querySelector(".nightmeter__moon");
  M.scroll(M.animate(fill, { transform: ["scaleX(0)", "scaleX(1)"] }, { ease: "linear" }));
  M.scroll(M.animate(moon, { transform: ["translateX(0px)", "translateX(100vw)"] }, { ease: "linear" }));
}

/** first visit: the P-i-p blocks drop in one by one, then the words settle under them */
function heroEntrance() {
  const root = document.documentElement;
  if (!root.classList.contains("intro")) return;
  const blocks = [...document.querySelectorAll(".blocks-title .lb")];
  const lines = [...document.querySelectorAll(".hero__hi, .hero__job, .hero__tagline, .hero__intro, .hero__actions")];
  root.classList.remove("intro");
  if (motionPrefs.reduced || !M) return;
  M.animate(blocks, { translate: ["0 -150%", "0 0"], opacity: [0, 1] }, { type: "spring", bounce: 0.4, duration: 0.7, delay: M.stagger(0.09) });
  M.animate(lines, { translate: ["0 14px", "0 0"], opacity: [0, 1] }, { duration: 0.45, ease: [0.23, 1, 0.32, 1], delay: M.stagger(0.06, { startDelay: 0.3 }) });
}

/** scrolling away from the hero: the window drifts up slower than the page, Pip a touch faster */
function heroParallax() {
  const hero = document.querySelector(".hero");
  if (!hero || !M?.scroll || motionPrefs.reduced) return;
  const opts = { target: hero, offset: ["start start", "end start"] };
  const win = hero.querySelector(".hero__window");
  const pip = hero.querySelector(".hero__pip");
  const copy = hero.querySelector(".hero__copy");
  if (win) M.scroll(M.animate(win, { translate: ["0 0", "0 90px"] }, { ease: "linear" }), opts);
  if (pip) M.scroll(M.animate(pip, { translate: ["0 0", "0 -40px"] }, { ease: "linear" }), opts);
  if (copy) M.scroll(M.animate(copy, { opacity: [1, 0.2] }, { ease: "linear" }), opts);
}

/**
 * Pointer depth in the hero (mouse only): the window art sits far back and moves a little,
 * Pip sits close and moves more. Eased each frame, and the loop stops once it settles.
 */
function heroDepth() {
  const hero = document.querySelector(".hero");
  if (!hero || motionPrefs.reduced) return;
  const layers = [
    [hero.querySelector(".hero__window-art"), -10],
    [hero.querySelector("#hero-pip"), 12],
    [hero.querySelector(".blocks-title"), 5],
  ].filter(([el]) => el);
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const step = () => {
    x += (tx - x) * 0.1;
    y += (ty - y) * 0.1;
    layers.forEach(([el, depth]) => { el.style.transform = `translate3d(${(x * depth).toFixed(2)}px, ${(y * depth * 0.6).toFixed(2)}px, 0)`; });
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(step) : 0;
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(step); };
  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = hero.getBoundingClientRect();
    tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    go();
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; go(); });
}

/**
 * As a room scrolls into view its things are set down one after another, like toys put back on
 * a shelf: a short rise with a soft spring. Each happens once.
 */
function shelfReveals() {
  if (!M?.inView || motionPrefs.reduced) return;
  const groups = [
    [".about__grid", ".about__grid > *"],
    ["#made .made__head", "#made .made__head > *"],
    [".wishes__head", ".wishes__head > *"],
    [".wishes__grid", ".wishes__grid > *"],
  ];
  groups.forEach(([zone, items]) => {
    const host = document.querySelector(zone);
    const els = [...document.querySelectorAll(items)];
    if (!host || !els.length) return;
    els.forEach((el) => { el.style.opacity = "0"; });
    M.inView(host, () => {
      M.animate(els, { translate: ["0 28px", "0 0"], opacity: [0, 1] }, { ...SPRING, delay: M.stagger(0.07) });
    }, { amount: 0.15 });
  });
  document.querySelectorAll(".exhibit").forEach((ex) => {
    const parts = [...ex.children].filter((c) => !c.matches("script"));
    parts.forEach((el) => { el.style.opacity = "0"; });
    M.inView(ex, () => {
      M.animate(ex, { scale: [0.97, 1] }, SPRING);
      M.animate(parts, { translate: ["0 32px", "0 0"], opacity: [0, 1] }, { ...SPRING, delay: M.stagger(0.09) });
    }, { amount: 0.2 });
  });
}

/** a gentle 3D tilt on the toy side of each exhibit, following the mouse with a soft lag */
function toyTilt() {
  if (motionPrefs.reduced || !motionPrefs.finePointer) return;
  document.querySelectorAll(".exhibit").forEach((ex) => {
    const toy = [...ex.children].find((c) => !c.classList.contains("exhibit__text"));
    if (!toy) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const step = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      toy.style.setProperty("--ry", `${(x * 5).toFixed(2)}deg`);
      toy.style.setProperty("--rx", `${(-y * 4).toFixed(2)}deg`);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(step); };
    toy.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || e.buttons) return; // hold still while dragging a toy
      const r = toy.getBoundingClientRect();
      tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      go();
    }, { passive: true });
    toy.addEventListener("pointerleave", () => { tx = 0; ty = 0; go(); });
  });
}

/**
 * Each story scene is a little diorama: its picture tilts a few degrees toward the mouse, so the
 * flat drawing reads as a box with depth. Set on each art element itself (not inherited), and the
 * loop stops as soon as it settles.
 */
function sceneTilt() {
  if (motionPrefs.reduced || !motionPrefs.finePointer) return;
  document.querySelectorAll(".scene .stage").forEach((stage) => {
    const arts = [...stage.querySelectorAll(".art")];
    if (!arts.length && stage.firstElementChild) arts.push(stage.firstElementChild);
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, movedAt = 0;
    const step = () => {
      // the mouse has rested: ease back to level, so plain scrolling keeps the drawing flat
      if (performance.now() - movedAt > 1200) { tx = 0; ty = 0; }
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      const flat = !tx && !ty && Math.abs(x) < 0.01 && Math.abs(y) < 0.01;
      // level again: drop the transform completely so the drawing goes back to a plain flat layer
      const t = flat ? "" : `perspective(1200px) rotateY(${(x * 3.2).toFixed(2)}deg) rotateX(${(-y * 2.4).toFixed(2)}deg)`;
      arts.forEach((a) => { a.style.transform = t; });
      raf = flat ? 0 : requestAnimationFrame(step);
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(step); };
    stage.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || e.buttons) return;
      const nx = clamp((e.clientX / innerWidth) * 2 - 1, -1, 1);
      const ny = clamp((e.clientY / innerHeight) * 2 - 1, -1, 1);
      if (Math.abs(nx - tx) + Math.abs(ny - ty) < 0.01) return; // scrolling sends pointer moves that didn't move
      tx = nx;
      ty = ny;
      movedAt = performance.now();
      go();
    }, { passive: true });
    stage.addEventListener("pointerleave", () => { tx = 0; ty = 0; go(); });
  });
}

export function initMotion() {
  [nightMeter, heroEntrance, heroParallax, heroDepth, shelfReveals, toyTilt, sceneTilt].forEach((fn) => {
    try { fn(); } catch { /* one effect failing never stops the others */ }
  });
}
