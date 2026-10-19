// Pip in 3D (Zdog): a little plush Pip sitting on his cloud. He turns to look at your pointer,
// spins slowly on his own when nobody's around, and a drag or flick sends him spinning with
// momentum. Tap him for a hop. It only renders while it's on screen and while something moves.
import { motionPrefs, bus, clamp } from "./state.js";
import { audio } from "./audio.js";
import { speak } from "./pip.js";

const INK = "#6b4a5a";
const FACE = "#fffaf2";
const CAP = "#f7ecd6";
const BRIM = "#e9d6b4";
const GOLD = "#f2b53a";
const PINK = "#f4a3bc";
const SOCKET = "#33232c";

/** a flat 5-point star facing +z */
function starPath(r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
  }
  return pts;
}

function buildPip(Z, illo) {
  const { TAU } = Z;
  const figure = new Z.Anchor({ addTo: illo, translate: { y: 4 } });
  // each soft part gets a slightly bigger plum copy drawn just before it: a hand-drawn outline
  const puff = (addTo, translate, size, color, outline = INK, path) => {
    const shape = path ? { addTo, translate, path } : { addTo, translate };
    if (outline) new Z.Shape({ ...shape, stroke: size + 3.2, color: outline });
    return new Z.Shape({ ...shape, stroke: size, color });
  };

  // the cloud he sits on
  const cloud = new Z.Anchor({ addTo: figure, translate: { y: 44 } });
  [[-22, 2, -2, 20], [-8, 4, 6, 24], [10, 4, 4, 24], [24, 2, -3, 19], [0, 0, -10, 24], [-14, -1, -12, 18], [15, -1, -12, 18]]
    .forEach(([x, y, z, s]) => puff(cloud, { x, y, z }, s, "#ffffff", "#d9c6db"));

  // body in his cream onesie, with little pink hearts
  const body = new Z.Anchor({ addTo: figure, translate: { y: 19 } });
  puff(body, {}, 28, "#fcf1e3");
  [[-6, -4, 1], [7, 2, 1], [-2, 7, 1]].forEach(([x, y]) => {
    const len = Math.hypot(x, y);
    const z = Math.sqrt(Math.max(0, 15.2 * 15.2 - len * len));
    new Z.Shape({ addTo: body, translate: { x, y, z }, stroke: 3.4, color: PINK });
  });
  // arms and mitten hands
  [-1, 1].forEach((side) => {
    puff(body, { x: side * 12, y: 0, z: 4 }, 8.5, "#fcf1e3", INK, [{ x: 0, y: -3 }, { x: side * 4, y: 7, z: 4 }]);
    puff(body, { x: side * 16, y: 8, z: 8 }, 7.5, "#ffffff");
  });
  // lavender feet poking forward
  [-1, 1].forEach((side) => puff(body, { x: side * 8, y: 15, z: 11 }, 11, "#cdb8ee"));

  // the head: a round skull, a touch wider than tall
  const head = new Z.Anchor({ addTo: figure, translate: { y: -18 } });
  // skull, cap dome and brim always draw in this order (a Group), so the cap sits on top from
  // every angle; the face details outside it sort by depth and hide when he turns away
  const skull = new Z.Group({ addTo: head });
  puff(skull, {}, 44, FACE, INK, [{ x: -1.6 }, { x: 1.6 }]);

  // eye sockets: dark domes that sit into the face, each with a warm amber light inside
  const glows = [];
  [-1, 1].forEach((side) => {
    new Z.Shape({ addTo: head, translate: { x: side * 8.6, y: 3, z: 15.2 }, stroke: 15, color: SOCKET });
    glows.push(new Z.Shape({ addTo: head, translate: { x: side * 7.8, y: 4.4, z: 22 }, stroke: 7.5, color: "rgba(255, 196, 90, 0.5)" }));
    new Z.Shape({ addTo: head, translate: { x: side * 7.8, y: 4.4, z: 22.8 }, stroke: 3.8, color: "#ffd98a" });
    new Z.Shape({ addTo: head, translate: { x: side * 6.4, y: 2.6, z: 23.4 }, stroke: 1.6, color: "#ffffff" });
    // blush
    new Z.Shape({ addTo: head, translate: { x: side * 14.8, y: 11, z: 15.6 }, stroke: 6, color: "rgba(244, 150, 175, 0.8)" });
  });
  // nose and a slightly crooked smile
  new Z.Polygon({ addTo: head, sides: 3, radius: 1.8, fill: true, stroke: 1.2, color: SOCKET, translate: { y: 11, z: 22.4 }, rotate: { z: TAU / 2 } });
  new Z.Shape({
    addTo: head,
    path: [{ x: -4, y: 0 }, { bezier: [{ x: -1.5, y: 3 }, { x: 2.5, y: 3 }, { x: 4.6, y: -0.5 }] }],
    closed: false, stroke: 1.5, color: SOCKET, translate: { y: 14.4, z: 20.6 },
  });

  // nightcap: dome, rolled brim, a floppy tip ending in a pom-pom, gold stars and the pink bow
  const capPose = { translate: { y: -8 }, rotate: { z: -0.14 } };
  const dome = new Z.Anchor({ addTo: skull, ...capPose });
  new Z.Hemisphere({ addTo: dome, diameter: 46, color: INK, backface: INK, stroke: 6.2, rotate: { x: TAU / 4 } });
  new Z.Hemisphere({ addTo: dome, diameter: 46, color: CAP, backface: BRIM, stroke: 3, rotate: { x: TAU / 4 } });
  new Z.Ellipse({ addTo: dome, diameter: 47, stroke: 9.2, color: INK, rotate: { x: TAU / 4 } });
  new Z.Ellipse({ addTo: dome, diameter: 47, stroke: 6.4, color: BRIM, rotate: { x: TAU / 4 } });
  const cap = new Z.Anchor({ addTo: head, translate: { y: -8 }, rotate: { z: -0.14 } });
  const tip = [[0, -22, 0, 16], [4.5, -29, -1, 13], [11, -32.5, -1.5, 11], [18, -31.5, -2, 9], [23, -27, -2, 7.5]];
  // one smooth outlined tube: every outline first, then every fill (a Group keeps that order)
  const tail = new Z.Group({ addTo: cap });
  tip.forEach(([x, y, z, s]) => new Z.Shape({ addTo: tail, translate: { x, y, z }, stroke: s + 3.2, color: INK }));
  tip.forEach(([x, y, z, s]) => new Z.Shape({ addTo: tail, translate: { x, y, z }, stroke: s, color: CAP }));
  puff(tail, { x: 26, y: -20.5, z: -1.5 }, 10, "#fff4dc");
  for (let i = 0; i < 7; i++) {
    const az = (i / 7) * TAU + 0.4;
    const pol = 0.55 + (i % 2) * 0.42;
    const r = 23.6;
    new Z.Shape({
      addTo: cap,
      path: starPath(2.4),
      fill: true, stroke: 0.6, color: GOLD,
      translate: { x: Math.sin(pol) * Math.cos(az) * r, y: -Math.cos(pol) * r, z: Math.sin(pol) * Math.sin(az) * r },
      rotate: { y: Math.atan2(Math.cos(az), Math.sin(az)), x: -(Math.PI / 2 - pol) },
    });
  }
  const bow = new Z.Anchor({ addTo: cap, translate: { x: -13.5, y: -2, z: 19 }, rotate: { y: -0.6 } });
  new Z.Shape({ addTo: bow, path: [{ x: -1 }, { x: -5.5, y: -2 }], stroke: 5, color: PINK });
  new Z.Shape({ addTo: bow, path: [{ x: 1 }, { x: 5.5, y: -2 }], stroke: 5, color: PINK });
  new Z.Shape({ addTo: bow, stroke: 3.6, color: "#ec84a5", translate: { z: 0.8 } });

  // a little stitched heart patch on the back of his head, so the back is worth spinning to
  new Z.Shape({
    addTo: head,
    path: [{ x: 0, y: 3 }, { bezier: [{ x: -6, y: -2 }, { x: -3, y: -7 }, { x: 0, y: -3 }] }, { bezier: [{ x: 3, y: -7 }, { x: 6, y: -2 }, { x: 0, y: 3 }] }],
    fill: true, stroke: 1.4, color: PINK, translate: { y: 8, z: -22.6 }, backface: PINK,
  });

  return { figure, head, glows };
}

export function initSpin() {
  const canvas = document.getElementById("zdog-pip");
  const Z = window.Zdog;
  if (!canvas || !Z) {
    canvas?.closest(".spin")?.setAttribute("hidden", "");
    return;
  }
  const { TAU } = Z;
  const illo = new Z.Illustration({ element: canvas, zoom: 3.6, resize: false });
  const { figure, head, glows } = buildPip(Z, illo);

  const setGlow = (theme) => glows.forEach((g) => { g.color = theme === "night" ? "rgba(255, 196, 90, 0.8)" : "rgba(255, 196, 90, 0.5)"; });
  setGlow(document.documentElement.dataset.theme);
  bus.on("theme", (t) => { setGlow(t); kick(); });

  // motion state: yaw is the turn of the whole figure; the head adds a little look of its own
  let yaw = 0.35;
  let vel = 0;
  let lookX = 0;
  let lookY = 0;
  let targetX = 0;
  let targetY = 0;
  let pointerAt = 0;
  let dragging = false;
  let hop = 0;
  let t = 0;

  const fig = canvas.closest(".spin");
  const nearest = (a, b) => b + Math.round((a - b) / TAU) * TAU; // b's equivalent angle closest to a

  // look at the pointer when it's anywhere near the shelf: no click needed
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || dragging || !visible) return;
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / Math.max(240, r.width * 1.6);
    const dy = (e.clientY - (r.top + r.height / 2)) / Math.max(240, r.height * 1.6);
    if (Math.abs(dx) > 2.2 || Math.abs(dy) > 2.2) return;
    targetX = clamp(dx, -1, 1);
    targetY = clamp(dy, -1, 1);
    pointerAt = performance.now();
    kick();
  }, { passive: true });

  // drag or flick to spin, with momentum; a short tap is a hop
  let lastX = 0;
  let lastT = 0;
  let downX = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    downX = lastX = e.clientX;
    lastT = performance.now();
    vel = 0;
    canvas.setPointerCapture(e.pointerId);
    fig?.classList.add("is-grabbed");
    kick();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = performance.now();
    const d = (e.clientX - lastX) * 0.014;
    yaw += d;
    vel = d / Math.max(1, (now - lastT) / 16.7);
    lastX = e.clientX;
    lastT = now;
    pointerAt = now;
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    fig?.classList.remove("is-grabbed");
    if (performance.now() - lastT > 90) vel = 0; // held still before letting go: no fling
    if (Math.abs(e.clientX - downX) < 4) tapped();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  function tapped() {
    hop = 1;
    if (!motionPrefs.reduced) vel = 0.32;
    audio.play("giggle", canvas);
    speak("Wheee! Again!");
    kick();
  }

  // keyboard: arrows turn him, Enter or Space spins him
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      vel += e.key === "ArrowLeft" ? -0.12 : 0.12;
      kick();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      tapped();
    }
  });

  let visible = false;
  let raf = 0;
  function frame() {
    raf = 0;
    if (!visible || document.hidden) return;
    const now = performance.now();
    const calm = motionPrefs.reduced;
    const chaos = document.documentElement.classList.contains("chaos");
    const watching = now - pointerAt < 2600;

    if (!dragging) {
      if (Math.abs(vel) > 0.0004) {
        yaw += vel;
        vel *= 0.955; // friction: a flick coasts, then settles
      } else if (chaos && !calm) {
        yaw += 0.08;
      } else if (watching) {
        // turn to face the viewer, then follow the pointer
        yaw += (nearest(yaw, targetX * 0.55) - yaw) * 0.08;
      } else if (!calm) {
        yaw += 0.006; // a slow turntable while nobody's looking
      }
    }
    lookX += ((watching ? targetX * 0.45 : 0) - lookX) * 0.12;
    lookY += ((watching ? targetY * 0.3 : 0) - lookY) * 0.12;
    hop *= 0.9;

    figure.rotate.y = yaw;
    head.rotate.y = lookX;
    head.rotate.x = -lookY;
    t += calm ? 0 : 0.03;
    figure.translate.y = 4 + Math.sin(t) * 0.8 - Math.sin(hop * Math.PI) * 6;
    illo.updateRenderGraph();

    const settled = calm && !dragging && Math.abs(vel) < 0.0004 && hop < 0.01 &&
      Math.abs(lookX - (watching ? targetX * 0.45 : 0)) < 0.002 && Math.abs(lookY - (watching ? targetY * 0.3 : 0)) < 0.002;
    if (!settled) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);
  document.addEventListener("visibilitychange", kick);
  figure.rotate.y = yaw;
  illo.updateRenderGraph();
}
