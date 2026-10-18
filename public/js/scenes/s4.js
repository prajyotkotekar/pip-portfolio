// Scene 4: The Lullaby Lab. The music box slides onto the dresser; wind it and notes drift out of
// the window and land on the rooftops, turning bright windows sleepy orange.
import { seg, easeOut, motionPrefs, h, place, bus, crossing, rand, svgNS } from "../state.js";
import { onProgress, artBox, markScene } from "./common.js";
import { stars } from "../art.js";
import { lanternLane } from "./s2.js";
import { createMusicBox } from "../musicwidget.js";
import { musicbox } from "../musicbox.js";

const LANE = { x: 52, y: -72, s: 0.83 };

export function initScene4(section) {
  const stage = section.querySelector(".stage");
  const A = artBox(stage);
  A.svg.innerHTML = `
    <defs><clipPath id="s4-window"><rect x="52" y="36" width="496" height="282" rx="10"/></clipPath></defs>
    <g clip-path="url(#s4-window)">
      <rect x="52" y="36" width="496" height="282" fill="#1b1838"/>
      ${stars(16, { x0: 60, x1: 540, y0: 40, y1: 200, seed: 41 })}
      <use href="#moon" x="440" y="44" width="80" height="80"/>
      <g class="lane" transform="translate(${LANE.x} ${LANE.y}) scale(${LANE.s})">${lanternLane()}</g>
    </g>
    <rect x="52" y="36" width="496" height="282" rx="10" fill="none" stroke="#f4e6d2" stroke-width="14"/>
    <path d="M300 36v282M52 178h496" stroke="#f4e6d2" stroke-width="7"/>
    <path d="M40 28c40 60 30 220 6 300M560 28c-40 60-30 220-6 300" fill="none" stroke="#c97a96" stroke-width="22" stroke-linecap="round" opacity=".9"/>
    <rect x="-900" y="470" width="2400" height="30" fill="#b98962" stroke="#5c4033" stroke-width="4"/>
    <rect x="-900" y="500" width="2400" height="400" fill="#9a6e4d"/>
    <path d="M-900 560H1500M-900 640H1500" stroke="#5c4033" stroke-width="4"/>
    <circle cx="150" cy="530" r="7" fill="#e3b048"/><circle cx="450" cy="530" r="7" fill="#e3b048"/>
    <use href="#mouse" x="414" y="430" width="44" height="40"/>
    <g class="s4-notes"></g>`;

  const notesLayer = A.svg.querySelector(".s4-notes");
  const laneWins = [...A.svg.querySelectorAll(".lane [data-win-g]")];
  laneWins.forEach((g) => g.classList.add("lit"));
  // only windows that are visible through our window frame are note targets
  const targets = laneWins
    .map((g) => {
      const b = g.getBBox();
      return { g, x: (b.x + b.width / 2) * LANE.s + LANE.x, y: (b.y + b.height / 2) * LANE.s + LANE.y };
    })
    .filter((t) => t.x > 70 && t.x < 530 && t.y > 60 && t.y < 310);
  let nextTarget = 0;

  const boxHost = h("div", { class: "s4-box" });
  place(boxHost, 168, 220, 224, 258);
  A.box.append(boxHost);
  createMusicBox(boxHost, { label: "Lullaby Lab music box" });

  // notes and stars spill out and drift to the skyline
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(section);

  bus.on("mb:note", ({ n, last }) => {
    if (!visible || !targets.length) return;
    const t = targets[nextTarget % targets.length];
    nextTarget++;
    const el = document.createElementNS(svgNS, "text");
    el.setAttribute("class", "s4-note");
    el.setAttribute("x", "282");
    el.setAttribute("y", "246");
    el.textContent = last ? "★" : n % 2 ? "♫" : "♪";
    notesLayer.append(el);
    const land = () => {
      t.g.classList.remove("lit");
      t.g.classList.add("sleepy");
      if (nextTarget % 3 === 0) yawn(t);
      el.remove();
    };
    if (motionPrefs.reduced) {
      setTimeout(land, 600);
      return;
    }
    const dx = t.x - 282;
    const dy = t.y - 246;
    const lift = rand(60, 120);
    el.animate(
      [
        { transform: "translate(0px, 0px) scale(0.6)", opacity: 0 },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - lift}px) scale(1.2)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.7)`, opacity: 0.9 },
      ],
      { duration: 2200, easing: "ease-in-out" },
    ).finished.then(land, land);
  });

  function yawn(t) {
    const y = document.createElementNS(svgNS, "text");
    y.setAttribute("class", "s4-yawn");
    y.setAttribute("x", String(t.x));
    y.setAttribute("y", String(t.y - 26));
    y.setAttribute("text-anchor", "middle");
    y.textContent = "yawn";
    notesLayer.append(y);
    setTimeout(() => y.remove(), 2600);
  }

  // scroll: the box slides in, and at "He wound the gold key" it plays a few notes on its own
  let demoDone = false;
  const demo = crossing(1, () => {
    if (demoDone) return;
    demoDone = true;
    if (!musicbox.playing) musicbox.wind(4);
  });
  const reduced = motionPrefs.reduced;
  onProgress(section, (p, m) => {
    const t = seg(p, Math.max(0, m[1] - 0.1), m[1] + 0.03);
    boxHost.style.opacity = String(reduced ? (t > 0 ? 1 : 0) : Math.min(1, t * 1.6));
    boxHost.style.transform = reduced ? "" : `translateX(${((1 - easeOut(t)) * 70).toFixed(2)}%)`;
    demo(seg(p, m[3] - 0.04, m[3] - 0.02));
  });
  markScene(section, 4);
}
