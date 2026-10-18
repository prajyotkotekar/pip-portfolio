// Scene 5: Lamps for the Dark Bits. The big light goes off; your cursor becomes a small circle
// of lantern light. Find the lamps and light them; each one pushes the dark back and draws an edge.
import { motionPrefs, h, place } from "../state.js";
import { onProgress, artBox, artBubble, markScene } from "./common.js";
import { stars, wallShapes } from "../art.js";
import { lampButton, setLit, SHAPES } from "../lamps.js";
import { audio } from "../audio.js";
import { speak } from "../pip.js";

const LAMPS = [
  { id: "lantern", kind: "lantern", label: "Bramble's bell lamp, beside his bed", x: 192, y: 402, w: 96, h: 138, shape: [240, 330, 1.3] },
  { id: "thimble", kind: "thimble", label: "Thimble's thimble lamp, on the shelf", x: 440, y: 128, w: 50, h: 58, shape: [465, 74, 0.9] },
  { id: "duck1", kind: "duck", label: "Duckling lamp, on the windowsill", x: 58, y: 196, w: 46, h: 54, shape: [82, 296, 0.6], duck: true },
  { id: "duck2", kind: "duck", label: "Another duckling lamp, on the windowsill", x: 124, y: 196, w: 46, h: 54, shape: [148, 300, 0.6], duck: true },
  { id: "duck3", kind: "duck", label: "The third duckling lamp, on the windowsill", x: 190, y: 196, w: 46, h: 54, shape: [214, 296, 0.6], duck: true },
];

export function initScene5(section) {
  const stage = section.querySelector(".stage");
  const reduced = motionPrefs.reduced;

  // the room (under the dark)
  const A = artBox(stage, "s5-room");
  A.svg.innerHTML = `
    <rect x="-900" y="-700" width="2400" height="1240" fill="#e9d6c3"/>
    <path d="${Array.from({ length: 40 }, (_, i) => `M${-900 + i * 60} -700V540`).join("")}" stroke="#dcc3ae" stroke-width="10"/>
    <path d="M50 250V120a100 80 0 0 1 200 0v130z" fill="#1b1838"/>
    ${stars(8, { x0: 70, x1: 230, y0: 60, y1: 220, seed: 51 })}
    <use href="#moon" x="150" y="70" width="70" height="70"/>
    <path d="M50 250V120a100 80 0 0 1 200 0v130z" fill="none" stroke="#f7ecdc" stroke-width="12"/>
    <path d="M150 42v208M50 160h200" stroke="#f7ecdc" stroke-width="6"/>
    <rect x="30" y="248" width="240" height="16" rx="4" fill="#c99a78" stroke="#5c4033" stroke-width="3"/>
    <rect x="380" y="186" width="200" height="12" rx="3" fill="#c99a78" stroke="#5c4033" stroke-width="3"/>
    <path d="M400 198l12 22M560 198l-12 22" stroke="#5c4033" stroke-width="5" stroke-linecap="round"/>
    <rect x="392" y="152" width="34" height="34" rx="5" fill="#bfe3c0" stroke="#5c4033" stroke-width="3"/>
    <rect x="514" y="140" width="16" height="46" rx="2" fill="#f2b6c6" stroke="#5c4033" stroke-width="3"/><rect x="532" y="146" width="14" height="40" rx="2" fill="#cdbdf0" stroke="#5c4033" stroke-width="3"/>
    <rect x="-900" y="540" width="2400" height="300" fill="#8a6247"/>
    <path d="M-900 572H1500" stroke="#6b4a36" stroke-width="3"/>
    <g class="bed">
      <rect x="560" y="360" width="24" height="190" rx="8" fill="#b98962" stroke="#5c4033" stroke-width="3"/>
      <rect x="300" y="470" width="270" height="40" rx="6" fill="#f4e6d2" stroke="#5c4033" stroke-width="3"/>
      <rect x="306" y="506" width="16" height="40" fill="#b98962" stroke="#5c4033" stroke-width="3"/>
      <ellipse cx="520" cy="458" rx="44" ry="18" fill="#fffaf4" stroke="#5c4033" stroke-width="3"/>
      <use href="#hedgehog" x="452" y="402" width="92" height="64"/>
      <ellipse class="bramble-yawn" cx="498" cy="455" rx="5" ry="6" fill="#7b3f55"/>
      <path d="M300 470c40-26 120-28 172-8 20 8 30 30 20 40H300z" fill="#f2b6c6" stroke="#5c4033" stroke-width="3"/>
      <path d="M340 482l8-6 8 6-8 8zM400 476l8-6 8 6-8 8zM450 484l8-6 8 6-8 8z" fill="#fff4f7"/>
    </g>`;

  // glow layer: room edges, wall shapes (above the dark)
  const G = artBox(stage, "s5-glow");
  G.svg.innerHTML = `
    <path class="edge" pathLength="1" d="M50 250V120a100 80 0 0 1 200 0v130zM30 248h240v16H30z"/>
    <path class="edge" pathLength="1" d="M380 186h200v12H380zM400 198l12 22M560 198l-12 22"/>
    <path class="edge" pathLength="1" d="M584 360v190M300 470h270v40H300zM306 510v36"/>
    ${LAMPS.map((l) => `<g class="wall-shape" data-for="${l.id}">${wallShapes(SHAPES[l.kind], l.shape[0], l.shape[1], l.shape[2])}</g>`).join("")}`;
  const edges = [...G.svg.querySelectorAll(".edge")];
  const shapes = Object.fromEntries([...G.svg.querySelectorAll(".wall-shape")].map((g) => [g.dataset.for, g]));

  // the dark, with a lantern-light hole wherever you point
  const dark = h("div", { class: "s5-dark", "aria-hidden": "true" });
  const ring = h("div", { class: "s5-ring", "aria-hidden": "true" });
  stage.append(dark, ring);

  const lamps = LAMPS.map((l) => {
    const b = lampButton(l.kind, l.label);
    b.classList.add("hot", "s5-lamp");
    place(b, l.x, l.y, l.w, l.h);
    A.box.append(b);
    return { ...l, b };
  });

  let lit = 0;
  let lightsOff = false;
  let hole = null;
  let raf = 0;

  function lampCentre(l) {
    const r = l.b.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2, size: r.height };
  }

  function paint() {
    raf = 0;
    const s = stage.getBoundingClientRect();
    const a = A.box.getBoundingClientRect();
    const p = hole || { x: a.left - s.left + a.width * 0.45, y: a.top - s.top + a.height * 0.55 };
    const R = Math.max(110, Math.min(s.width, s.height) * 0.2);
    const layers = [`radial-gradient(circle ${R}px at ${p.x}px ${p.y}px, transparent 0, transparent ${R * 0.45}px, #000 ${R}px)`];
    lamps.forEach((l) => {
      if (!l.b.classList.contains("is-lit")) return;
      const c = lampCentre(l);
      const r = Math.max(90, c.size * (l.kind === "lantern" ? 1.9 : 2.6));
      layers.push(`radial-gradient(circle ${r}px at ${c.x}px ${c.y}px, transparent 0, transparent ${r * 0.3}px, #000 ${r}px)`);
    });
    const img = layers.join(", ");
    dark.style.webkitMaskImage = img;
    dark.style.maskImage = img;
    ring.style.transform = `translate(${p.x - 100}px, ${p.y - 100}px)`;
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };

  function setHole(x, y) {
    const s = stage.getBoundingClientRect();
    hole = { x: x - s.left, y: y - s.top };
    queue();
  }
  stage.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" && lightsOff) setHole(e.clientX, e.clientY); }, { passive: true });
  stage.addEventListener("pointerdown", (e) => { if (lightsOff) setHole(e.clientX, e.clientY); }, { passive: true });
  addEventListener("resize", queue, { passive: true });

  function darkness() {
    const base = reduced ? 0.5 : 0.94;
    const level = lightsOff ? Math.max(0.22, base - lit * 0.14) : 0;
    dark.style.opacity = String(level);
    ring.style.opacity = lightsOff ? "1" : "0";
    stage.classList.toggle("lights-off", lightsOff);
    edges.forEach((e, i) => {
      const need = (i + 1) * (5 / edges.length);
      e.style.strokeDashoffset = String(1 - Math.min(1, Math.max(0, (lit - (need - 5 / edges.length)) / (5 / edges.length))));
    });
  }

  lamps.forEach((l) => {
    l.b.addEventListener("click", () => {
      if (l.b.classList.contains("is-lit")) {
        if (l.duck) artBubble(A.box, "That one's mine.", l.x + l.w / 2, l.y - 4, { ms: 1800 });
        return;
      }
      setLit(l.b, true);
      lit++;
      shapes[l.id].classList.add("is-on");
      darkness();
      queue();
      if (l.id === "lantern") {
        A.box.classList.add("bramble-yawns");
        artBubble(A.box, "Bramble: *yaaawn*", 500, 392, { ms: 2600 });
        setTimeout(() => A.box.classList.remove("bramble-yawns"), 2600);
      } else if (l.duck) {
        artBubble(A.box, "That one's mine.", l.x + l.w / 2, l.y - 4, { ms: 1800 });
      }
      if (lit === lamps.length) setTimeout(() => speak("Cozy is a whole job, actually."), 900);
    });
    if (l.duck) {
      l.b.addEventListener("mouseenter", () => artBubble(A.box, "That one's mine.", l.x + l.w / 2, l.y - 4, { ms: 1600 }));
    }
    l.b.addEventListener("focus", () => {
      const c = lampCentre(l);
      const s = stage.getBoundingClientRect();
      if (lightsOff) setHole(c.x + s.left, c.y + s.top);
    });
  });

  onProgress(section, (p, m) => {
    const off = p >= m[2] - 0.03;
    if (off !== lightsOff) {
      lightsOff = off;
      if (off) audio.ambient("bigClick");
      darkness();
      queue();
    }
  });
  darkness();
  markScene(section, 5);
}
