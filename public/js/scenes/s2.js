// Scene 2: Gone to the Seaside. The crickets pack up and hop away (taking their chirps with them),
// the notes above the rooftops pop, and Lantern Lane's windows blink back on.
import { seg, crossing, motionPrefs, h, place, easeInOut } from "../state.js";
import { audio } from "../audio.js";
import { onProgress, artBox, hotspot, artBubble, markScene } from "./common.js";
import { stars, house, hedge, ground, cricket } from "../art.js";
import { crickets } from "../crickets.js";
import { mainPips } from "../pip.js";

const TRAVELLERS = [
  [232, 503, 0.85], [298, 520, 0.8], [360, 500, 0.85], [420, 521, 0.78], [482, 505, 0.85],
];
const BUBBLES = [[70, 236], [160, 196], [252, 226], [346, 190], [446, 232], [536, 198]];

export function lanternLane({ special = true } = {}) {
  // Lantern Lane from the street. Shared by Scenes 2, 3, 4 and 7.
  return `
    ${house({ x: -520, w: 120, h: 150, body: "#35294f", roof: "#5a4580", chimney: 20 })}
    ${house({ x: -380, w: 100, h: 120, body: "#3e2f5c", roof: "#6a4a78" })}
    ${house({ x: -250, w: 130, h: 175, body: "#392a52", roof: "#7a5070", chimney: 90 })}
    ${house({ x: -100, w: 90, h: 110, body: "#45335f", roof: "#5a4580" })}
    ${hedge(12, 470, 140, 118)}
    ${house({ x: 172, w: 110, h: 168, body: "#45335f", roof: "#7a5070", chimney: 76, roofH: 54 })}
    ${house({ x: 302, w: 108, h: 128, body: "#3b2d58", roof: "#5a4580", chimney: 14 })}
    ${house({ x: 432, w: 136, h: 150, body: "#4a3766", roof: "#6a4a78", chimney: 100, roofH: 50 })}
    ${house({ x: 610, w: 110, h: 140, body: "#3e2f5c", roof: "#7a5070", chimney: 70 })}
    ${house({ x: 750, w: 130, h: 115, body: "#35294f", roof: "#5a4580" })}
    ${house({ x: 910, w: 100, h: 160, body: "#45335f", roof: "#6a4a78", chimney: 20 })}
    <g class="windows">
      <g class="win-g" data-win-g="bramble"><ellipse class="win" cx="82" cy="404" rx="26" ry="22"/>${special ? `<use href="#hedgehog" class="resident" x="58" y="392" width="48" height="34"/>` : ""}<path class="win-bars" d="M56 404h52"/></g>
      <g class="win-g" data-win-g="mice"><rect class="win" x="188" y="330" width="34" height="40" rx="4"/>${special ? `<g class="resident">${Array.from({ length: 7 }, (_, i) => `<circle cx="${191 + i * 4.6}" cy="${364 - (i % 2) * 2}" r="2.4" fill="#cdbfc9"/>`).join("")}</g>` : ""}<path class="win-bars" d="M205 330v40"/></g>
      <g class="win-g" data-win-g="w3"><rect class="win" x="234" y="330" width="34" height="40" rx="4"/><path class="win-bars" d="M251 330v40M234 350h34"/></g>
      <g class="win-g" data-win-g="w4"><rect class="win" x="188" y="392" width="34" height="38" rx="4"/><path class="win-bars" d="M205 392v38M188 411h34"/></g>
      <g class="win-g" data-win-g="w5"><rect class="win" x="318" y="372" width="30" height="34" rx="4"/><path class="win-bars" d="M333 372v34M318 389h30"/></g>
      <g class="win-g" data-win-g="w6"><rect class="win" x="364" y="372" width="30" height="34" rx="4"/><path class="win-bars" d="M379 372v34M364 389h30"/></g>
      <g class="win-g" data-win-g="ducks"><ellipse class="win" cx="500" cy="374" rx="30" ry="26"/>${special ? `<g class="resident"><use href="#duckling" x="474" y="364" width="20" height="18"/><use href="#duckling" x="490" y="361" width="20" height="18"/><use href="#duckling" x="506" y="364" width="20" height="18"/></g>` : ""}<path class="win-bars" d="M470 374h60"/></g>
      <g class="win-g" data-win-g="w8"><rect class="win" x="448" y="414" width="28" height="32" rx="4"/><path class="win-bars" d="M462 414v32"/></g>
      <g class="win-g" data-win-g="w9"><rect class="win" x="626" y="356" width="30" height="34" rx="4"/><path class="win-bars" d="M641 356v34"/></g>
      <g class="win-g" data-win-g="w10"><rect class="win" x="674" y="356" width="30" height="34" rx="4"/><path class="win-bars" d="M689 356v34"/></g>
      <g class="win-g" data-win-g="w11"><rect class="win" x="-500" y="352" width="30" height="34" rx="4"/><path class="win-bars" d="M-485 352v34"/></g>
      <g class="win-g" data-win-g="w12"><rect class="win" x="-224" y="330" width="32" height="38" rx="4"/><path class="win-bars" d="M-208 330v38"/></g>
      <g class="win-g" data-win-g="w13"><rect class="win" x="930" y="350" width="30" height="34" rx="4"/><path class="win-bars" d="M945 350v34"/></g>
      <g class="win-g" data-win-g="w14"><rect class="win" x="-80" y="392" width="30" height="34" rx="4"/><path class="win-bars" d="M-65 392v34"/></g>
      <g class="win-g" data-win-g="w15"><rect class="win" x="790" y="390" width="30" height="34" rx="4"/><path class="win-bars" d="M805 390v34"/></g>
    </g>`;
}

export const WINDOW_ORDER = ["w5", "bramble", "w9", "w3", "w12", "mice", "w10", "w4", "w14", "ducks", "w6", "w11", "w8", "w13", "w15"];

export function initScene2(section) {
  const stage = section.querySelector(".stage");
  const A = artBox(stage);
  A.svg.innerHTML = `
    ${stars(40, { seed: 21 })}
    <use href="#moon" x="420" y="16" width="150" height="150"/>
    <g class="moon-z"><text x="440" y="70">z</text><text x="456" y="52">z</text><text x="470" y="36">z</text></g>
    ${lanternLane()}
    <g class="soap">${BUBBLES.map(([x, y], i) => `<g class="soap__b" data-i="${i}" transform="translate(${x} ${y})"><g class="soap__in"><circle r="24" class="soap__ring"/><path d="M-12-10a14 14 0 0 1 10-6" class="soap__shine"/><text y="9" text-anchor="middle" class="soap__note">${i % 2 ? "♫" : "♪"}</text></g></g>`).join("")}</g>
    ${ground(470)}
    <path d="M70 492q4-30 -6-58" stroke="#5c8a62" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g class="travellers">${TRAVELLERS.map(([x, y, s]) => cricket(x, y, s, { travel: true })).join("")}</g>`;

  const travellers = [...A.svg.querySelectorAll(".travellers .cricket")];
  const soap = [...A.svg.querySelectorAll(".soap__b")];
  const winMap = Object.fromEntries([...A.svg.querySelectorAll("[data-win-g]")].map((g) => [g.dataset.winG, g]));

  // the crickets' note, pinned to a blade of grass
  const note = h("button", { type: "button", class: "hot cricket-note", "aria-pressed": "false", "aria-label": "The crickets' note. Click to flip it over." });
  note.innerHTML = `<span class="cricket-note__inner"><span class="cricket-note__face cricket-note__front">GONE TO THE SEASIDE.<br>BACK TUESDAY.<br>— THE CRICKETS</span><span class="cricket-note__face cricket-note__back">P.S. We'll send a postcard.</span></span>`;
  place(note, 14, 488, 168, 92);
  A.box.append(note);
  note.addEventListener("click", () => {
    const flipped = note.getAttribute("aria-pressed") !== "true";
    note.setAttribute("aria-pressed", String(flipped));
    audio.play("tear", note);
  });

  // peek into the three lit windows
  const PEEKS = {
    bramble: { x: 56, y: 380, w: 52, h: 48, at: [82, 376], text: "Bramble: sheep number 12. Or 13. Starting again.", label: "Peek into Bramble's window" },
    mice: { x: 184, y: 326, w: 42, h: 48, at: [205, 322], text: "Velvet mice: 7 awake, 0 asleep, 1 pretending.", label: "Peek into the Velvet mice's window" },
    ducks: { x: 468, y: 346, w: 64, h: 56, at: [500, 344], text: "Duckling triplets: arguing about whose turn it is to be awake.", label: "Peek into the duckling triplets' window" },
  };
  const peekBtns = Object.entries(PEEKS).map(([id, c]) => {
    const btn = hotspot(A.box, { x: c.x, y: c.y, w: c.w, h: c.h, label: c.label, cls: "peek", disabled: true });
    btn.addEventListener("click", () => {
      audio.play("click", btn);
      artBubble(A.box, c.text, c.at[0], c.at[1], { ms: 3400 });
    });
    return [id, btn];
  });

  crickets.registerZone(section, 2);
  const reduced = motionPrefs.reduced;
  const itch = crossing(0.999, () => mainPips().pocket?.fidget());
  let litCount = -1;

  onProgress(section, (p, m) => {
    // 1. crickets leave, one by one (rightmost first)
    const leaveA = Math.max(0, m[1] - 0.04);
    const leaveB = m[2] - 0.02;
    const span = (leaveB - leaveA) / (travellers.length + 1);
    let home = 0;
    travellers.forEach((g, i) => {
      const order = travellers.length - 1 - i;
      const t = seg(p, leaveA + order * span, leaveA + order * span + span * 1.8);
      const [x, y, s] = TRAVELLERS[i];
      if (t < 0.5) home++;
      if (reduced) {
        g.style.opacity = String(1 - t);
        return;
      }
      const e = easeInOut(t);
      const hop = Math.abs(Math.sin(t * Math.PI * 4)) * 26 * (t > 0 && t < 1 ? 1 : 0);
      g.setAttribute("transform", `translate(${(x + e * 460).toFixed(1)} ${(y - hop).toFixed(1)}) scale(${s})`);
    });
    crickets.setPresent(home);

    // 2. the notes above the rooftops pop like soap bubbles
    const popped = Math.floor(seg(p, m[2] - 0.05, m[3] - 0.06) * (soap.length + 0.999));
    soap.forEach((b, i) => {
      const was = b.classList.contains("is-popped");
      const now = i < popped;
      if (was !== now) {
        b.classList.toggle("is-popped", now);
        if (now) audio.ambient("pop");
      }
    });

    // 3. windows blink back on, one after another
    const lit = Math.floor(seg(p, m[3] - 0.06, m[4] - 0.05) * (WINDOW_ORDER.length + 0.999));
    if (lit !== litCount) {
      litCount = lit;
      WINDOW_ORDER.forEach((id, i) => winMap[id]?.classList.toggle("lit", i < lit));
      peekBtns.forEach(([id, btn]) => { btn.disabled = !winMap[id].classList.contains("lit"); });
    }

    // 4. Pip's toes itch like never before
    itch(seg(p, m[4] - 0.02, m[4]));
  });
  markScene(section, 2);
}
