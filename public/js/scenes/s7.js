// Scene 7: What Everybody Sounds Like. The music box stops, the street snores, and back in the
// nursery the new growth marks draw themselves sideways. They link to the projects.
import { seg, crossing, motionPrefs, h, place, bus } from "../state.js";
import { audio } from "../audio.js";
import { onProgress, artBox, pan, artBubble, markScene } from "./common.js";
import { stars, ground, tinyMusicBox } from "../art.js";
import { lanternLane } from "./s2.js";
import { musicbox } from "../musicbox.js";
import { createPip } from "../pip.js";

const MARKS = [
  { text: "Can make 41 rattles go at once", project: "project-4", icon: `<circle cx="0" cy="-8" r="7" fill="#f6b7c8" stroke="#5a3448" stroke-width="2"/><path d="M0-1v12" stroke="#5a3448" stroke-width="3" stroke-linecap="round"/>` },
  { text: "Can stack 9 blocks (before testing the floor)", project: "project-4", icon: `<rect x="-8" y="-10" width="16" height="16" rx="3" fill="#ffe58f" stroke="#5a3448" stroke-width="2"/><rect x="-6" y="-24" width="13" height="13" rx="3" fill="#bfe3c0" stroke="#5a3448" stroke-width="2" transform="rotate(8)"/>` },
  { text: "Can wind a song that doesn't end", project: "project-1", icon: `<text x="0" y="5" text-anchor="middle" font-size="22" fill="#a34063">♫</text>` },
  { text: "Can make the dark smaller", project: "project-2", icon: `<path d="M-8 6C-8-6-4-14 0-14S8-6 8 6Z" fill="#ffe2a0" stroke="#5a3448" stroke-width="2"/><rect x="-6" y="6" width="12" height="4" fill="#c99a78"/>` },
  { text: "Can find every roof (eventually)", project: "project-3", icon: `<path d="M-11 6V-3L0-12 11-3V6Z" fill="#c9b6e4" stroke="#5a3448" stroke-width="2" stroke-linejoin="round"/>` },
  { text: "Can giggle softly (once)", project: "project-6", icon: `<circle r="10" fill="#fbf5ec" stroke="#5a3448" stroke-width="2"/><path d="M-5 2q5 5 10 0" stroke="#5a3448" stroke-width="2" fill="none" stroke-linecap="round"/>` },
];
const TICK_X = [168, 236, 304, 372, 440, 508];
const LINE_Y = 524;

export function initScene7(section) {
  const stage = section.querySelector(".stage");
  const { a, b, set: setPan } = pan(stage);
  const reduced = motionPrefs.reduced;

  // ---- panel A: the sleeping street, seen from the nursery windowsill ----
  const A = artBox(a);
  A.svg.innerHTML = `
    ${stars(40, { seed: 71 })}
    <use href="#moon" x="380" y="-6" width="200" height="200"/>
    ${lanternLane({ special: false })}
    ${ground(470)}
    <rect x="-900" y="530" width="2400" height="30" fill="#f4e6d2" stroke="#4a3329" stroke-width="3"/>
    <rect x="-900" y="560" width="2400" height="300" fill="#e2cdb6"/>
    ${tinyMusicBox(30, 460)}
    <g class="snore" data-s="0"><text class="snore__t" x="60" y="320">fweee</text></g>
    <g class="snore" data-s="1">${Array.from({ length: 7 }, (_, i) => `<text class="snore__t snore__t--tiny" x="${178 + i * 11}" y="${310 - (i % 2) * 8}" style="animation-delay:${i * 0.12}s">z</text>`).join("")}</g>
    <g class="snore" data-s="2">${[0, 1, 2].map((i) => `<text class="snore__t snore__t--duck" x="${474 + i * 20}" y="330" style="animation-delay:${i * 0.25}s">z</text>`).join("")}</g>
    <g class="snore snore--moon" data-s="3"><text class="snore__t snore__t--big" x="330" y="150">Z</text></g>`;
  const lid = A.svg.querySelector(".tiny-lid");
  const snores = [...A.svg.querySelectorAll(".snore")];

  // ---- panel B: the nursery at dawn ----
  const B = artBox(b, "s7-nursery");
  B.svg.innerHTML = `
    <rect x="40" y="24" width="520" height="190" rx="12" fill="#211c40"/>
    <rect class="dawn" x="40" y="24" width="520" height="190" rx="12"/>
    ${stars(10, { x0: 60, x1: 540, y0: 40, y1: 180, seed: 77, cls: "twk night-only" })}
    <rect x="40" y="24" width="520" height="190" rx="12" fill="none" stroke="#f4e6d2" stroke-width="12"/>
    <path d="M300 24v190" stroke="#f4e6d2" stroke-width="6"/>
    <rect x="-900" y="560" width="2400" height="300" fill="#5c4033"/>
    <rect x="-900" y="546" width="2400" height="16" fill="#e9d6c2" stroke="#4a3329" stroke-width="3"/>
    <rect x="22" y="250" width="22" height="300" fill="#f4e6d2" stroke="#4a3329" stroke-width="3"/>
    <rect x="98" y="250" width="22" height="300" fill="#f4e6d2" stroke="#4a3329" stroke-width="3"/>
    <rect x="22" y="236" width="98" height="18" fill="#f4e6d2" stroke="#4a3329" stroke-width="3"/>
    <rect x="44" y="254" width="54" height="292" fill="#2a1d3a"/>
    <path d="M92 ${LINE_Y}h34" stroke="#6f6a78" stroke-width="3.2" stroke-linecap="round"/>
    <text x="60" y="${LINE_Y - 30}" class="pencil-text pencil-text--tiny" transform="rotate(-90 60 ${LINE_Y - 30})">PIP, FIRST NIGHT</text>
    <path class="marks-line" d="M126 ${LINE_Y}H566" pathLength="1"/>
    ${TICK_X.map((x, i) => `<g class="tick" data-i="${i}"><path d="M${x} ${LINE_Y - 14}v28" stroke="#a34063" stroke-width="4" stroke-linecap="round"/><g transform="translate(${x} ${LINE_Y - 34})">${MARKS[i].icon}</g></g>`).join("")}`;
  const marksLine = B.svg.querySelector(".marks-line");
  const ticks = [...B.svg.querySelectorAll(".tick")];

  // the tagline writes itself across the dawn sky
  const tagline = h("p", { class: "s7-tagline", "aria-hidden": "true" }, "“I build the dreams you fall asleep inside.”");
  place(tagline, 60, 54, 480, 140);
  B.box.append(tagline);

  // Pip, curled up on his cloud, eye-lights down to two soft glows
  const pipHost = h("div", { class: "s7-pip", "aria-hidden": "true" });
  place(pipHost, 196, 226, 168, 230);
  B.box.append(pipHost);
  const pip = createPip(pipHost, { variant: "full", mood: "asleep", track: false });
  pip.fixedMood = "asleep";

  // sideways marks: hover or tap to read, click to visit the project
  const caption = h("div", { class: "bubble bubble--below s7-caption", "aria-hidden": "true" });
  B.box.append(caption);
  let selected = -1;
  let lastPointer = "mouse";
  const show = (i) => {
    selected = i;
    caption.textContent = MARKS[i].text;
    place(caption, Math.min(Math.max(TICK_X[i] - 20, 20), 360), LINE_Y + 20);
    caption.classList.add("show");
  };
  const hide = () => { caption.classList.remove("show"); selected = -1; };
  const jump = (i) => {
    const target = document.getElementById(MARKS[i].project);
    if (!target) return;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
  };
  const markBtns = MARKS.map((mk, i) => {
    const btn = h("button", { type: "button", class: "hot s7-mark", "aria-label": `Growth mark: ${mk.text}. Go to the project.`, disabled: "" });
    place(btn, TICK_X[i] - 26, LINE_Y - 58, 52, 80);
    B.box.append(btn);
    btn.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") show(i); });
    btn.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
    btn.addEventListener("pointerdown", (e) => { lastPointer = e.pointerType; });
    btn.addEventListener("focus", () => show(i));
    btn.addEventListener("blur", hide);
    btn.addEventListener("click", (e) => {
      if (e.detail !== 0 && lastPointer !== "mouse" && selected !== i) {
        show(i);
        audio.play("click", btn);
        return;
      }
      audio.play("click", btn);
      jump(i);
    });
    return btn;
  });

  const seeBtn = h("a", { class: "toy-btn s7-see", href: "#made", tabindex: "-1" });
  seeBtn.innerHTML = `See what Pip made <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path d="M3 13c5-1 11-1 16-1m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  place(seeBtn, 372, 330);
  B.box.append(seeBtn);

  // silence timer, reversed: Pip sleeps instead of complaining
  bus.on("idle:sleep", () => {
    if (document.documentElement.dataset.scene === "7") artBubble(B.box, "pip… pip…", 280, 226, { ms: 2600 });
  });

  // ---- scroll beats ----
  const windDown = crossing(1, () => { if (musicbox.windDown()) artBubble(A.box, "Ting… ting…", 74, 440, { ms: 2200 }); });
  const giggle = crossing(1, () => audio.ambient("softGiggle"));
  const snoreSounds = ["whistle", "snore", "snore", "snore"];
  let snoreState = [false, false, false, false];
  let shown = 0;

  onProgress(section, (p, m) => {
    const close = seg(p, Math.max(0, m[1] - 0.07), m[1] + 0.01);
    lid.style.transform = `rotate(${(-38 * (1 - close)).toFixed(1)}deg)`;
    windDown(seg(p, m[1] - 0.04, m[1] - 0.03));

    const at = [m[2] - 0.08, m[2] - 0.05, m[2] - 0.02, m[2] + 0.02];
    snores.forEach((s, i) => {
      const on = p >= at[i] && p < m[3] - 0.04;
      if (on !== snoreState[i]) {
        snoreState[i] = on;
        s.classList.toggle("is-on", on);
        if (on && p < at[i] + 0.03) audio.ambient(snoreSounds[i], i === 3);
      }
    });

    setPan(seg(p, m[3] - 0.08, m[3] + 0.02));
    giggle(seg(p, m[3], m[3] + 0.01));

    const draw = seg(p, m[3] + 0.0, m[3] + 0.13);
    marksLine.style.strokeDashoffset = String(1 - draw);
    const n = Math.floor(draw * 6.999);
    if (n !== shown) {
      shown = n;
      ticks.forEach((t, i) => t.classList.toggle("is-on", i < n));
      markBtns.forEach((btn, i) => { btn.disabled = i >= n; });
    }
    b.style.setProperty("--dawn", seg(p, m[3] - 0.02, m[4] + 0.04).toFixed(3));
    const write = seg(p, m[3] + 0.1, Math.min(0.97, m[4] + 0.06));
    tagline.style.clipPath = `inset(0 ${((1 - write) * 100).toFixed(2)}% 0 0)`;
    const end = p >= Math.min(0.96, m[4]);
    seeBtn.classList.toggle("is-in", end);
    seeBtn.tabIndex = end ? 0 : -1;
  });
  markScene(section, 7);
}
