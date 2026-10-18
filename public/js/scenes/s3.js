// Scene 3: Rattles, Then Blocks. Rattles rain on the rooftops, a block tower builds and topples,
// then the blocks are yours to stack.
import { seg, easeOut, motionPrefs, h, place, animate } from "../state.js";
import { onProgress, artBox, artBubble, markScene } from "./common.js";
import { stars, ground, rattleSVG } from "../art.js";
import { lanternLane } from "./s2.js";
import { rattleButton, createStacker } from "../toys.js";
import { createPip } from "../pip.js";

// contact points on the (scaled) rooftops: x, y, kind, tilt
const ROOF_RATTLES = [
  [147, 405, "ball", -16], [249, 333, "carrot", 12], [339, 366, "bell", -8], [440, 348, "ball", 20],
  [372, 386, "bell", 34], [214, 362, "carrot", -32], [51, 379, "ball", 10], [555, 358, "carrot", -14],
];

export function initScene3(section) {
  const stage = section.querySelector(".stage");
  const A = artBox(stage);
  A.svg.innerHTML = `
    ${stars(30, { seed: 31 })}
    <g transform="translate(90 156) scale(0.7)" class="lane lane--giggly">${lanternLane({ special: false })}</g>
    ${ground(485)}
    <rect x="-800" y="560" width="2200" height="400" fill="#3a2c48"/>
    <path d="M-800 560H1400" stroke="#22183a" stroke-width="4"/>
    <path d="M-760 590h60M-600 590h60M-440 590h60M-280 590h60M-120 590h60M40 590h60M200 590h60M360 590h60M520 590h60M680 590h60M840 590h60" stroke="#c9b6e4" stroke-width="4" stroke-linecap="round" opacity=".35"/>
    <g class="roof-rattles">${ROOF_RATTLES.map(([x, y, kind, r], i) => `<g class="roof-rattle" data-i="${i}" transform="translate(${x} ${y})"><g transform="rotate(${r})"><svg x="-14" y="-40" width="28" height="42" viewBox="0 0 60 90">${rattleSVG(kind).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg></g></g>`).join("")}</g>`;
  const lane = A.svg.querySelector(".lane");
  const roofRattles = [...A.svg.querySelectorAll(".roof-rattle")];

  // three rattles you can shake, landing on the grass
  const RATTLES = [
    { kind: "ball", label: "Shake the big round rattle", x: 26, y: 446 },
    { kind: "bell", label: "Shake the small rattle", x: 98, y: 452 },
    { kind: "carrot", label: "Shake the carrot rattle (it squeaks)", x: 168, y: 444 },
  ];
  const rattleEls = RATTLES.map((r) => {
    const b = rattleButton(r.kind, r.label);
    b.classList.add("hot", "s3-rattle");
    place(b, r.x, r.y, 60, 92);
    A.box.append(b);
    return b;
  });

  // Pip lands on his bottom beside the pile, nightcap over his eyes
  const pipHost = h("div", { class: "s3-pip", "aria-hidden": "true" });
  place(pipHost, 238, 420, 104, 142);
  A.box.append(pipHost);
  const pip = createPip(pipHost, { variant: "full", track: false });
  pip.svg.classList.add("capdown");

  const stacker = createStacker(A.box, {
    W: 600, H: 600, ground: 560, cx: 470, size: 64, scripted: true,
    pile: [
      { x: 352, y: 498, rot: -14 }, { x: 420, y: 500, rot: 9 }, { x: 532, y: 494, rot: 22 },
      { x: 478, y: 499, rot: -5 }, { x: 446, y: 440, rot: 33 },
    ],
    onTopple(byUser) {
      artBubble(A.box, "That wasn't a fall. I was testing the floor.", 292, 404, { ms: 3200 });
      if (byUser && !motionPrefs.reduced) {
        animate(pip.svg, { transform: ["translateY(0px)", "translateY(-8px)", "translateY(0px)"] }, { duration: 0.4 });
      }
    },
    onTune() {
      artBubble(A.box, "It almost sounded like a song!", 292, 404, { ms: 3000 });
    },
  });

  const reduced = motionPrefs.reduced;
  let pipShown = false;

  onProgress(section, (p, m) => {
    // 1. rattles rain out of the sky
    const r0 = Math.max(0, m[1] - 0.07);
    roofRattles.forEach((g, i) => {
      const t = seg(p, r0 + i * 0.012, r0 + i * 0.012 + 0.07);
      const [x, y] = ROOF_RATTLES[i];
      if (reduced) g.style.opacity = String(t > 0 ? 1 : 0);
      else g.setAttribute("transform", `translate(${x} ${(y - (1 - easeOut(t)) * 640).toFixed(1)})`);
    });
    rattleEls.forEach((b, i) => {
      const t = seg(p, r0 + 0.03 + i * 0.015, r0 + 0.1 + i * 0.015);
      b.style.transform = reduced ? "" : `translateY(${(-(1 - easeOut(t)) * 640).toFixed(1)}%)`;
      b.style.opacity = reduced ? String(t > 0 ? 1 : 0.001) : "1";
    });
    lane.classList.toggle("is-jiggling", p > r0 + 0.08 && p < m[2] - 0.03);

    // 2. the tower builds itself, then topples
    const fallAt = m[2] + 0.11;
    if (p >= fallAt) stacker.setScripted("fallen");
    else stacker.setScripted(Math.floor(seg(p, m[2] - 0.07, fallAt - 0.02) * 5.999));

    const show = p >= fallAt;
    if (show !== pipShown) {
      pipShown = show;
      pipHost.classList.toggle("is-in", show);
    }
  });
  markScene(section, 3);
}
