// Scene 1: Made of a Hum. The Moon's hum draws itself, coils on a cloud and pops into Pip.
import { seg, animate, motionPrefs, h, place } from "../state.js";
import { audio } from "../audio.js";
import { onProgress, artBox, pan, artBubble, markScene } from "./common.js";
import { stars, ground, cricket, cloudShape } from "../art.js";
import { crickets } from "../crickets.js";

function humPoints() {
  const pts = [];
  const wave = 70;
  for (let i = 0; i <= wave; i++) {
    const t = i / wave;
    pts.push([440 + (305 - 440) * t + 46 * Math.sin(t * Math.PI * 3), 172 + (427 - 172) * t]);
  }
  const cx = 300, cy = 457;
  const a0 = Math.atan2(427 - cy, 305 - cx);
  const r0 = Math.hypot(305 - cx, 427 - cy);
  const turns = 50;
  for (let i = 1; i <= turns; i++) {
    const k = i / turns;
    const a = a0 + k * Math.PI * 3.3;
    const r = r0 * (1 - 0.86 * k);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8]);
  }
  return { pts, waveEnd: wave };
}

export function initScene1(section) {
  const stage = section.querySelector(".stage");
  const { a, b, set: setPan } = pan(stage);

  // ---- panel A: the sky ----
  const A = artBox(a);
  const { pts, waveEnd } = humPoints();
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1];
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  const noteAt = [10, 25, 40, 55].map((i) => ({ i, at: lens[i] / total, x: pts[i][0] + 16, y: pts[i][1] - 8 }));

  A.svg.innerHTML = `
    ${stars(46, { seed: 11 })}
    <use href="#moon" x="400" y="38" width="150" height="150" class="s1-moon"/>
    ${cloudShape(300, 494, 1.15)}
    <path class="hum" d="${d}" pathLength="1"/>
    ${noteAt.map((n, k) => `<text class="hum-note" data-k="${k}" x="${n.x.toFixed(0)}" y="${n.y.toFixed(0)}">${k % 2 ? "♫" : "♪"}</text>`).join("")}
    <g class="puff">${Array.from({ length: 9 }, (_, i) => `<use href="#twinkle" class="puff__star" data-i="${i}" x="290" y="438" width="22" height="22" style="--twinkle:${["#ffd66b", "#c9b6e4", "#f6b7c8"][i % 3]}"/>`).join("")}</g>
    ${ground(556)}
    ${cricket(40, 542, 0.8)}${cricket(130, 552, 0.7)}${cricket(430, 546, 0.75)}${cricket(505, 556, 0.65)}${cricket(-120, 548, 0.8)}${cricket(650, 550, 0.8)}`;
  const hum = A.svg.querySelector(".hum");
  const notes = [...A.svg.querySelectorAll(".hum-note")];
  const cloud = A.svg.querySelector('path[transform^="translate(300 494)"]');
  const puffStars = [...A.svg.querySelectorAll(".puff__star")];

  const pipBtn = h("button", { type: "button", class: "hot s1-pip", "aria-label": "Pip on his cloud. Click to make him giggle.", disabled: "" });
  pipBtn.innerHTML = `<img src="assets/img/pip_avatar_cloud_cutout.webp" alt="" width="571" height="760" decoding="async">`;
  place(pipBtn, 186, 248, 228, 303);
  A.box.append(pipBtn);
  const pipImg = pipBtn.querySelector("img");

  pipBtn.addEventListener("click", () => {
    audio.play("giggle", pipBtn);
    artBubble(A.box, "Hee! Again!", 300, 240);
    if (!motionPrefs.reduced) {
      animate(pipImg, { transform: ["translateY(0px) scaleY(1)", "translateY(-6%) scaleY(1.03)", "translateY(0px) scaleY(0.96)", "translateY(-2%) scaleY(1)", "translateY(0px) scaleY(1)"] }, { duration: 0.6, ease: "easeOut" });
    }
  });

  // ---- panel B: the nursery door ----
  const B = artBox(b);
  B.svg.innerHTML = `
    <rect x="-900" y="560" width="2400" height="600" fill="#5c4033"/>
    <path d="M-900 600H1500M-900 650H1500" stroke="#4a3329" stroke-width="3"/>
    <rect x="-900" y="540" width="2400" height="22" fill="#e9d6c2" stroke="#4a3329" stroke-width="3"/>
    <g class="door">
      <rect x="352" y="70" width="150" height="472" fill="#2a1d3a"/>
      <path d="M352 70L410 92V542L352 542Z" fill="#ffcf6b" opacity=".35"/>
      <path d="M410 92L496 74V556L410 542Z" fill="#c99a78" stroke="#4a3329" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="420" cy="320" r="7" fill="#e3b048" stroke="#4a3329" stroke-width="2"/>
      <rect x="326" y="46" width="200" height="26" rx="4" fill="#f4e6d2" stroke="#4a3329" stroke-width="3"/>
      <rect x="326" y="60" width="26" height="482" fill="#f4e6d2" stroke="#4a3329" stroke-width="3"/>
      <rect x="500" y="60" width="26" height="482" fill="#f4e6d2" stroke="#4a3329" stroke-width="3"/>
    </g>
    <g class="pencil-line">
      <path d="M318 518h42" stroke="#6f6a78" stroke-width="3.2" stroke-linecap="round"/>
      <text x="306" y="512" text-anchor="end" class="pencil-text">PIP, FIRST NIGHT</text>
      <path d="M222 470q-30 10-20 30" class="crayon-arrow"/>
      <text x="150" y="458" class="pencil-text pencil-text--small">very low down</text>
    </g>
    <g transform="translate(30 478)">
      <rect width="62" height="62" rx="8" fill="#ffe58f" stroke="#4a3329" stroke-width="3" transform="rotate(-8 31 31)"/>
      <text x="31" y="44" text-anchor="middle" class="block-letter" transform="rotate(-8 31 31)">E</text>
    </g>
    <use href="#twinkle" x="120" y="120" width="34" height="34" opacity=".35"/>
    <use href="#twinkle" x="220" y="210" width="22" height="22" opacity=".3"/>`;

  // ---- crickets wiggle in the grass and chirp while this scene is on screen ----
  crickets.registerZone(section, 1);

  // ---- scroll beats ----
  let popped = false;
  const reduced = motionPrefs.reduced;

  function setPopped(on) {
    if (on === popped) return;
    popped = on;
    pipBtn.disabled = !on;
    pipBtn.classList.toggle("is-in", on);
    cloud.style.opacity = on ? "0" : "1";
    hum.classList.toggle("is-gone", on);
    notes.forEach((n) => n.classList.toggle("is-gone", on));
    if (on) {
      audio.ambient("pop");
      if (!reduced) {
        animate(pipImg, { transform: ["scale(0.92) translateY(4%)", "scale(1.03) translateY(-3%)", "scale(1) translateY(0%)"] }, { duration: 0.7, ease: [0.23, 1, 0.32, 1] });
        puffStars.forEach((s, i) => {
          const ang = (i / puffStars.length) * Math.PI * 2;
          s.animate(
            [
              { transform: "translate(0px, 0px) scale(0.4)", opacity: 1 },
              { transform: `translate(${Math.cos(ang) * 120}px, ${Math.sin(ang) * 90}px) scale(1)`, opacity: 0 },
            ],
            { duration: 900, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
          );
        });
      }
    }
  }

  onProgress(section, (p, m) => {
    const draw = seg(p, Math.max(0, m[1] - 0.06), m[2] - 0.04);
    hum.style.strokeDashoffset = String(1 - draw);
    notes.forEach((n, k) => n.classList.toggle("is-on", draw >= noteAt[k].at));
    setPopped(p >= m[2] - 0.02);
    setPan(seg(p, m[4] - 0.03, m[4] + 0.13));
  });
  markScene(section, 1);
  return { pipBtn };
}
