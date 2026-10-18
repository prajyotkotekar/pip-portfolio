// Pip, drawn in SVG so his eyes can move: cursor tracking, blinking, moods, giggles and speech.
import { animate, motionPrefs, rand, svg, h, bus } from "./state.js";
import { audio } from "./audio.js";

const OUT = "#6b4a5a";
const FACE = "#fbf5ec";
const EYES = [
  { side: "l", cx: 74, cy: 128, rx: 24, ry: 25, px: 78, py: 132 },
  { side: "r", cx: 136, cy: 126, rx: 25, ry: 26, px: 131, py: 130 },
];
const HEAD_CENTER = { x: 104, y: 128 };

function star(cx, cy, r, fill = "#e3b048") {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.48 : r;
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${fill}" stroke-width="${(r * 0.35).toFixed(1)}" stroke-linejoin="round"/>`;
}

function heart(x, y, s = 1, fill = "#f2a9bc") {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M0 3C-4-2-9 1-6 5L0 10 6 5C9 1 4-2 0 3Z" fill="${fill}"/>`;
}

function headMarkup(id) {
  const eyes = EYES.map((e) => {
    const lidRy = e.ry + 6;
    return `
      <clipPath id="${id}-c${e.side}"><ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}"/></clipPath>
      <g clip-path="url(#${id}-c${e.side})">
        <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="url(#${id}-sock)"/>
        <g transform="translate(${e.px} ${e.py})"><g class="look">
          <circle class="eyeglow" r="13" fill="url(#${id}-glow)"/>
          <circle class="pupil" r="5.6" fill="#ffd98a"/>
          <circle r="1.8" cx="-1.7" cy="-1.9" fill="#fffbe8"/>
        </g></g>
        <ellipse class="lid" data-ry="${e.ry}" cx="${e.cx}" cy="${e.cy - e.ry - lidRy}" rx="${e.rx + 8}" ry="${lidRy}" fill="${FACE}" stroke="${OUT}" stroke-width="3"/>
      </g>`;
  }).join("");

  return `
    <defs>
      <radialGradient id="${id}-sock" cx="50%" cy="45%" r="60%">
        <stop offset="0" stop-color="#4d3743"/><stop offset="1" stop-color="#2d1f28"/>
      </radialGradient>
      <radialGradient id="${id}-glow">
        <stop offset="0" stop-color="#ffcf6b" stop-opacity=".95"/><stop offset=".45" stop-color="#ffbe4a" stop-opacity=".45"/><stop offset="1" stop-color="#ffbe4a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <g class="head">
      <ellipse cx="104" cy="114" rx="77" ry="64" fill="${FACE}" stroke="${OUT}" stroke-width="3"/>
      ${eyes}
      <path d="M98 147Q104 144 110 147Q107 155 104 156Q101 155 98 147Z" fill="#4a3440"/>
      <path class="mouth-smile" d="M91 163Q102 171 115 162M115 162l3-3" fill="none" stroke="#4a3440" stroke-width="3" stroke-linecap="round"/>
      <path class="mouth-open" d="M90 161Q103 178 117 160Q103 166 90 161Z" fill="#7b3f55" stroke="#4a3440" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse class="mouth-o" cx="104" cy="165" rx="4" ry="4.6" fill="#7b3f55"/>
      <g opacity=".62">
        <ellipse cx="46" cy="153" rx="14" ry="8" fill="#f4a1b6"/><ellipse cx="164" cy="151" rx="14" ry="8" fill="#f4a1b6"/>
      </g>
      <path d="M40 152l3-4M46 153l3-4M52 152l3-4M158 150l3-4M164 151l3-4M170 150l3-4" stroke="#e5869f" stroke-width="1.6" stroke-linecap="round"/>
      <g class="cap">
        <path d="M31 99C26 60 52 20 104 18C156 16 184 56 179 96C140 82 70 84 31 99Z" fill="#f7ecd6" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
        ${star(98, 40, 6)}${star(134, 34, 6.5)}${star(160, 56, 6)}${star(120, 64, 5.5)}${star(86, 68, 5)}${star(150, 78, 4.5)}
        <path d="M30 101C70 84 140 82 180 96" fill="none" stroke="${OUT}" stroke-width="21" stroke-linecap="round"/>
        <path d="M30 101C70 84 140 82 180 96" fill="none" stroke="#efe1c4" stroke-width="15" stroke-linecap="round"/>
        <path class="cap-tail" d="M120 17C70 7 24 34 12 100L28 99C31 72 57 45 114 40Z" fill="#f7ecd6" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
        ${star(52, 34, 5)}${star(30, 64, 5)}${star(72, 26, 4)}
        <g class="bow">
          <ellipse cx="44" cy="88" rx="13" ry="8.5" transform="rotate(-25 44 88)" fill="#f4a3bc" stroke="${OUT}" stroke-width="2.6"/>
          <ellipse cx="68" cy="85" rx="13" ry="8.5" transform="rotate(20 68 85)" fill="#f4a3bc" stroke="${OUT}" stroke-width="2.6"/>
          <circle cx="56" cy="88" r="5.6" fill="#ef8fae" stroke="${OUT}" stroke-width="2.4"/>
        </g>
      </g>
      <g class="pompom">
        <circle cx="20" cy="110" r="15" fill="#efe1c3" stroke="${OUT}" stroke-width="3" stroke-dasharray="3.2 2.4"/>
        <circle cx="16" cy="105" r="5" fill="#fffaf0"/>
      </g>
      <g class="zzz" fill="#c9b6e4" font-family="Fredoka, sans-serif" font-weight="700">
        <text x="176" y="40" font-size="22">z</text><text x="190" y="18" font-size="15">z</text>
      </g>
    </g>`;
}

function bodyMarkup() {
  return `
    <path d="M16 268C4 268 4 248 20 246C18 230 40 222 54 232C60 216 88 214 98 228C108 214 136 214 144 230C158 220 182 228 180 244C198 244 204 266 188 270C190 286 166 292 150 284C138 296 112 296 102 286C88 296 62 294 56 282C40 292 18 288 16 268Z" fill="#fffaf6" stroke="#dcc0cd" stroke-width="3"/>
    <path d="M76 178C70 208 66 236 72 256H150C156 236 152 208 146 178Z" fill="#fbf0de" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    ${heart(92, 206)}${heart(130, 220)}${heart(104, 236, 0.9)}${heart(136, 194, 0.8)}${heart(84, 236, 0.75)}
    <circle cx="111" cy="196" r="2.6" fill="#e2a9b9"/><circle cx="111" cy="212" r="2.6" fill="#e2a9b9"/>
    <path d="M80 190C60 204 58 228 74 236C82 240 90 232 88 222Z" fill="#fbf0de" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M142 190C162 204 164 228 148 236C140 240 132 232 134 222Z" fill="#fbf0de" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="80" cy="232" r="8" fill="${FACE}" stroke="${OUT}" stroke-width="2.6"/>
    <circle cx="142" cy="232" r="8" fill="${FACE}" stroke="${OUT}" stroke-width="2.6"/>
    <ellipse cx="90" cy="256" rx="22" ry="14" fill="#fbf0de" stroke="${OUT}" stroke-width="3"/>
    <ellipse cx="132" cy="256" rx="22" ry="14" fill="#fbf0de" stroke="${OUT}" stroke-width="3"/>
    <ellipse class="foot" cx="82" cy="266" rx="15" ry="11" fill="#cdb7e8" stroke="${OUT}" stroke-width="3"/>
    <ellipse class="foot" cx="140" cy="266" rx="15" ry="11" fill="#cdb7e8" stroke="${OUT}" stroke-width="3"/>`;
}

function pocketMarkup() {
  return `
    <path d="M86 206v30M122 206v30" stroke="${OUT}" stroke-width="20" stroke-linecap="round"/>
    <path d="M86 206v30M122 206v30" stroke="#fbf0de" stroke-width="14" stroke-linecap="round"/>
    ${heart(80, 214, 0.6)}${heart(118, 222, 0.6)}
    <ellipse class="foot" cx="86" cy="248" rx="13" ry="10" fill="#cdb7e8" stroke="${OUT}" stroke-width="3"/>
    <ellipse class="foot" cx="122" cy="248" rx="13" ry="10" fill="#cdb7e8" stroke="${OUT}" stroke-width="3"/>
    <path d="M66 172C62 192 62 206 66 214H142C146 206 146 192 142 172Z" fill="#fbf0de" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="62" cy="210" r="9" fill="${FACE}" stroke="${OUT}" stroke-width="2.6"/>
    <circle cx="146" cy="210" r="9" fill="${FACE}" stroke="${OUT}" stroke-width="2.6"/>`;
}

// ---------- registry, eye tracking, blinking ----------
const pips = new Set();
let uid = 0;
let pointer = null;
let lastPointerAt = 0;
let rafPending = false;

const LIDS = { awake: 0, sleepy: 0.5, asleep: 0.74, closed: 1 };

class Pip {
  constructor(host, { variant = "full", mood = "awake", label = "", track = true, bubble = "above" } = {}) {
    this.id = `pip${++uid}`;
    this.variant = variant;
    this.track = track;
    const box = variant === "full" ? "0 0 220 300" : variant === "pocket" ? "0 0 200 270" : "0 0 210 190";
    const inner =
      variant === "full"
        ? `${bodyMarkup()}<g transform="translate(6 2)">${headMarkup(this.id)}</g>`
        : variant === "pocket"
          ? `${pocketMarkup()}${headMarkup(this.id)}`
          : headMarkup(this.id);
    this.offset = variant === "full" ? { x: 6, y: 2 } : { x: 0, y: 0 };
    this.vb = box.split(" ").map(Number);
    this.svg = svg(inner, { viewBox: box, class: "pip-svg", "aria-hidden": "true", focusable: "false" });
    if (label) {
      this.svg.removeAttribute("aria-hidden");
      this.svg.setAttribute("role", "img");
      this.svg.setAttribute("aria-label", label);
    }
    host.append(this.svg);
    this.host = host;
    this.looks = [...this.svg.querySelectorAll(".look")];
    this.lids = [...this.svg.querySelectorAll(".lid")];
    this.head = this.svg.querySelector(".head");
    this.pompom = this.svg.querySelector(".pompom");
    this.visible = false;
    this.bubbleSide = bubble;
    this.fixedMood = null;
    this.mood = "awake";
    this.setMood(mood);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(this.svg);
    pips.add(this);
    this.scheduleBlink();
  }

  lidOffset(lid, amount) {
    const ry = Number(lid.dataset.ry);
    return amount * (2 * ry + 4);
  }

  setLids(amount) {
    this.lidAmount = amount;
    this.lids.forEach((lid) => { lid.style.transform = `translateY(${this.lidOffset(lid, amount)}px)`; });
  }

  setMood(mood) {
    if (this.fixedMood && mood !== this.fixedMood) return;
    this.mood = mood;
    this.svg.classList.toggle("is-asleep", mood === "asleep");
    this.setLids(LIDS[mood] ?? 0);
    if (mood === "asleep") this.look(0, 0.9);
  }

  /** dx, dy in -1..1 */
  look(dx, dy) {
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    this.looks.forEach((g) => { g.style.transform = `translate(${(dx * 9).toFixed(2)}px, ${(dy * 8).toFixed(2)}px)`; });
  }

  centre() {
    const r = this.svg.getBoundingClientRect();
    const [, , w, hh] = this.vb;
    return {
      x: r.left + (r.width * (HEAD_CENTER.x + this.offset.x)) / w,
      y: r.top + (r.height * (HEAD_CENTER.y + this.offset.y)) / hh,
      scale: r.width / w,
    };
  }

  lookAtPoint(x, y) {
    if (this.mood === "asleep" || !this.track) return;
    const c = this.centre();
    const dx = x - c.x;
    const dy = y - c.y;
    const dist = Math.hypot(dx, dy) || 1;
    const reach = Math.min(1, dist / (220 * Math.max(0.6, c.scale)));
    this.look((dx / dist) * reach, (dy / dist) * reach);
  }

  blink() {
    if (this.mood === "asleep" || this.mood === "closed") return;
    const from = this.lidAmount;
    this.lids.forEach((lid) => {
      const a = `translateY(${this.lidOffset(lid, from)}px)`;
      const b = `translateY(${this.lidOffset(lid, 1)}px)`;
      lid.animate([{ transform: a }, { transform: b }, { transform: a }], { duration: 190, easing: "ease-in-out" });
    });
  }

  scheduleBlink() {
    clearTimeout(this.blinkTimer);
    this.blinkTimer = setTimeout(() => {
      if (this.visible && !document.hidden) {
        this.blink();
        if (Math.random() < 0.2) setTimeout(() => this.blink(), 260);
      }
      this.scheduleBlink();
    }, rand(2400, 6000));
  }

  giggle(line = "Hee! Again!", { sound = true } = {}) {
    this.svg.classList.add("is-giggling");
    clearTimeout(this.gTimer);
    this.gTimer = setTimeout(() => this.svg.classList.remove("is-giggling"), 900);
    if (!motionPrefs.reduced) {
      animate(this.head, { transform: ["rotate(0deg)", "rotate(-6deg)", "rotate(5deg)", "rotate(-3deg)", "rotate(0deg)"] }, { duration: 0.6, ease: "easeInOut" });
      animate(this.pompom, { transform: ["translateY(0px)", "translateY(-10px)", "translateY(0px)", "translateY(-4px)", "translateY(0px)"] }, { duration: 0.6, ease: "easeOut" });
    }
    if (sound) audio.play("giggle", this.svg);
    if (line) this.say(line);
  }

  fidget() {
    if (motionPrefs.reduced) return;
    this.svg.classList.remove("fidget");
    void this.svg.getBoundingClientRect();
    this.svg.classList.add("fidget");
    clearTimeout(this.fTimer);
    this.fTimer = setTimeout(() => this.svg.classList.remove("fidget"), 1700);
  }

  ensureBubble() {
    if (this.bubble) return this.bubble;
    const b = h("div", { class: `bubble bubble--${this.bubbleSide}`, "aria-hidden": "true" });
    if (this.variant === "pocket") {
      b.classList.add("pocket-bubble");
      document.body.append(b);
    } else {
      this.host.append(b);
    }
    this.bubble = b;
    return b;
  }

  say(text, ms = 3200) {
    const b = this.ensureBubble();
    b.textContent = text;
    b.classList.add("show");
    announce(text);
    clearTimeout(this.sTimer);
    this.sTimer = setTimeout(() => b.classList.remove("show"), ms);
  }
}

export function createPip(host, options) {
  return new Pip(host, options);
}

let announceTimer = 0;
function announce(text) {
  const live = document.getElementById("pip-voice");
  if (!live) return;
  clearTimeout(announceTimer);
  live.textContent = "";
  announceTimer = setTimeout(() => { live.textContent = `Pip: ${text}`; }, 60);
}

function frame() {
  rafPending = false;
  if (!pointer) return;
  pips.forEach((p) => { if (p.visible) p.lookAtPoint(pointer.x, pointer.y); });
}

function queue(x, y) {
  pointer = { x, y };
  lastPointerAt = performance.now();
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(frame);
  }
}

window.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") queue(e.clientX, e.clientY); }, { passive: true });
window.addEventListener("pointerdown", (e) => queue(e.clientX, e.clientY), { passive: true });
window.addEventListener("scroll", () => { if (pointer) queue(pointer.x, pointer.y); }, { passive: true });

// When nobody is pointing (touch screens, or a still mouse), the eyes drift around on their own.
setInterval(() => {
  if (document.hidden || performance.now() - lastPointerAt < 4000) return;
  const dx = rand(-0.7, 0.7);
  const dy = rand(-0.5, 0.6);
  pips.forEach((p) => { if (p.visible && p.mood !== "asleep" && p.track) p.look(dx, dy); });
}, 2600);

export function setAllMoods(mood) {
  pips.forEach((p) => p.setMood(mood));
}

// ---------- who talks ----------
let heroPip = null;
let pocketPip = null;
export function registerSpeakers(hero, pocket) {
  heroPip = hero;
  pocketPip = pocket;
}

/** Pip says something from wherever he's visible: the hero if on screen, else the shelf. */
export function speaker() {
  return heroPip && heroPip.visible && heroPip.svg.getBoundingClientRect().top > 0 ? heroPip : pocketPip;
}

export function speak(text, { giggle = false, ms } = {}) {
  const target = speaker();
  if (!target) return null;
  if (giggle) target.giggle(text);
  else target.say(text, ms);
  return target;
}

export function mainPips() {
  return { hero: heroPip, pocket: pocketPip };
}

bus.on("theme", (theme) => setAllMoods(theme === "night" ? "sleepy" : "awake"));
