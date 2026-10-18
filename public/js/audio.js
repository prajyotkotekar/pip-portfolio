// Every sound on the page is synthesised here with the Web Audio API. No audio files.
// The AudioContext is only created inside a real user gesture (browser autoplay rule).
// When muted, sounds are drawn as little squiggles instead, so you still "hear" them.
import { store, bus, motionPrefs, rand } from "./state.js";

// The five block notes (C D E G A pentatonic). The music box uses the same five.
export const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0];
export const NOTE_NAMES = ["C", "D", "E", "G", "A"];

let ctx = null;
let master = null;
let echo = null;
let noiseBuf = null;
let muted = store.get("pip-muted", false) === true;

function chaosOn() {
  return document.documentElement.classList.contains("chaos");
}

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 4;
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.8;
  master.connect(comp).connect(ctx.destination);

  // a soft echo for the music box, so it sounds like a big quiet room
  echo = ctx.createGain();
  echo.gain.value = 0.22;
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.34;
  const fb = ctx.createGain();
  fb.gain.value = 0.28;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2200;
  echo.connect(delay).connect(lp).connect(fb).connect(delay);
  lp.connect(master);

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

/** Called from gesture handlers. Creates or resumes the context only with user activation. */
function unlock() {
  const active = navigator.userActivation ? navigator.userActivation.isActive : true;
  if (!active) return;
  if (!ctx) {
    build();
    if (ctx) bus.emit("audio:ready");
  }
  if (ctx && ctx.state === "suspended" && !muted && !document.hidden) ctx.resume().catch(() => {});
}

function onGesture(e) {
  if (e.type === "pointerdown" && e.pointerType !== "mouse") return; // touch activates on pointerup
  if (e.type === "keydown" && e.key === "Escape") return;
  unlock();
}
["pointerdown", "pointerup", "keydown", "click"].forEach((type) =>
  window.addEventListener(type, onGesture, { capture: true, passive: true }),
);

document.addEventListener("visibilitychange", () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend().catch(() => {});
  else if (!muted && navigator.userActivation?.hasBeenActive) ctx.resume().catch(() => {});
});

// ---------- building blocks ----------
function env(gainNode, t, peak, attack, decay) {
  const g = gainNode.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function osc(type, freq, t, peak, attack, decay, { dest = master, glideTo, glideTime } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + (glideTime || decay));
  env(g, t, peak, attack, decay);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
  return o;
}

function noise(t, dur, peak, { type = "bandpass", freq = 2000, q = 1, sweepTo } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, peak, Math.min(0.02, dur / 3), dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, rand(0, 0.5));
  src.stop(t + dur + 0.05);
}

// ---------- the sound palette ----------
const SOUNDS = {
  giggle(t) {
    const seq = [880, 1046, 932, 1175, 988, 1245];
    seq.forEach((f, i) => {
      const at = t + i * 0.085;
      const o = osc("triangle", f, at, 0.13, 0.008, 0.07, { glideTo: f * 1.12, glideTime: 0.06 });
      o.detune.setValueAtTime(rand(-20, 20), at);
    });
  },
  softGiggle(t) {
    [740, 880, 784].forEach((f, i) => osc("sine", f, t + i * 0.12, 0.06, 0.01, 0.1, { glideTo: f * 1.08 }));
  },
  note(t, i = 0) {
    const f = NOTES[i % NOTES.length];
    osc(chaosOn() ? "square" : "triangle", f, t, chaosOn() ? 0.06 : 0.16, 0.005, 0.6);
    osc("sine", f * 2, t, 0.04, 0.005, 0.3);
    osc("sine", 140, t, 0.14, 0.004, 0.09, { glideTo: 70 }); // the "bonk"
  },
  rattle(t, variant = 0) {
    const freqs = [2600, 4200, 5600];
    for (let i = 0; i < 5; i++) {
      noise(t + i * 0.075 + rand(0, 0.015), 0.045, 0.22, { freq: freqs[variant % 3] * rand(0.9, 1.1), q: 5 });
    }
  },
  squeak(t) {
    osc("sine", 900, t, 0.12, 0.01, 0.13, { glideTo: 1750, glideTime: 0.11 });
    osc("sine", 1500, t + 0.16, 0.09, 0.01, 0.12, { glideTo: 1100, glideTime: 0.1 });
  },
  ting(t) {
    osc("sine", 1568, t, 0.14, 0.004, 1.3);
    osc("sine", 3136, t, 0.035, 0.004, 0.6);
  },
  plip(t) {
    osc("sine", 1250, t, 0.16, 0.004, 0.14, { glideTo: 380, glideTime: 0.12 });
    osc("sine", 300, t + 0.13, 0.08, 0.004, 0.12, { glideTo: 170 });
  },
  click(t) {
    osc("square", 1800, t, 0.03, 0.002, 0.025);
  },
  bigClick(t) {
    osc("square", 900, t, 0.05, 0.002, 0.04);
    noise(t, 0.05, 0.08, { freq: 3000, q: 2 });
  },
  whoosh(t) {
    noise(t, 0.55, 0.12, { freq: 400, q: 1.5, sweepTo: 2400 });
  },
  chirp(t) {
    for (let i = 0; i < 3; i++) osc("sine", 4300 + rand(-150, 150), t + i * 0.055, 0.03, 0.006, 0.03);
  },
  whistle(t) {
    osc("sine", 1700, t, 0.05, 0.25, 0.6, { glideTo: 2500, glideTime: 0.8 });
  },
  snore(t, big = false) {
    noise(t, big ? 1.6 : 0.7, big ? 0.16 : 0.06, { type: "lowpass", freq: big ? 260 : 700, q: 0.8 });
    if (big) osc("sine", 70, t, 0.08, 0.5, 1.1);
  },
  pop(t) {
    osc("sine", 600, t, 0.08, 0.003, 0.08, { glideTo: 1400, glideTime: 0.05 });
  },
  tear(t) {
    noise(t, 0.22, 0.14, { freq: 3500, q: 0.7, sweepTo: 1500 });
  },
  hooray(t) {
    [0, 2, 4, 3, 4].forEach((n, i) => osc("triangle", NOTES[n] * 2, t + i * 0.09, 0.08, 0.005, 0.4));
  },
};

/** Music box tine: sine + octave + a slightly sour third partial, long soft decay. */
function musicNote(freq, gain = 0.12, dur = 1.9) {
  if (!ctx || muted || ctx.state !== "running") return false;
  const t = ctx.currentTime + 0.02;
  const out = ctx.createGain();
  out.gain.value = 1;
  out.connect(master);
  out.connect(echo);
  if (chaosOn()) {
    osc("square", freq, t, gain * 0.35, 0.005, dur * 0.5, { dest: out });
  } else {
    osc("sine", freq, t, gain, 0.006, dur, { dest: out });
    osc("triangle", freq * 2, t, gain * 0.18, 0.004, dur * 0.45, { dest: out });
    osc("sine", freq * 3.01, t, gain * 0.06, 0.003, dur * 0.25, { dest: out });
  }
  return true;
}

// ---------- squiggles: what a muted sound looks like ----------
const SHAPES = {
  giggle: "M4 30c6-14 10-14 12 0s8 14 12 0 8-14 12 0 8 14 12 0 6-12 10-4",
  rattle: "M4 22l6-10 6 20 6-20 6 20 6-20 6 20 6-20 6 10",
  note: "M4 26c8-16 16-16 22 0s14 16 22 0 12-12 18-6",
  ting: "M35 22c0-4 6-4 6 0s-10 8-12 0 4-14 14-10 12 12 4 20-24 6-26-6",
  snore: "M6 30h14L8 14h16M30 30h12l-10-12h14M50 26h10l-8-9h10",
  plip: "M35 4v14M24 26c4 8 18 8 22 0M28 34h14",
};
const KIND = {
  giggle: "giggle", softGiggle: "giggle", rattle: "rattle", squeak: "rattle", note: "note",
  hooray: "note", ting: "ting", chirp: "ting", whistle: "ting", snore: "snore",
  plip: "plip", pop: "plip", whoosh: "rattle", click: "plip", bigClick: "plip", tear: "rattle",
};
let squiggleCount = 0;

function originPoint(origin) {
  if (!origin) return { x: 60, y: 90 };
  if (typeof origin.getBoundingClientRect === "function") {
    const r = origin.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + Math.min(r.height * 0.3, 40) };
  }
  return origin;
}

export function squiggle(name, origin) {
  const layer = document.getElementById("squiggles");
  if (!layer || squiggleCount > 10) return;
  const { x, y } = originPoint(origin);
  if (x < -40 || y < -40 || x > innerWidth + 40 || y > innerHeight + 40) return;
  const d = SHAPES[KIND[name] || "note"];
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  el.setAttribute("class", "sq");
  el.setAttribute("viewBox", "0 0 70 44");
  el.innerHTML = `<path class="under" d="${d}" pathLength="1"/><path class="over" d="${d}" pathLength="1"/>`;
  el.style.left = `${Math.round(x - 35)}px`;
  el.style.top = `${Math.round(y - 52)}px`;
  layer.append(el);
  squiggleCount++;
  const paths = el.querySelectorAll("path");
  const tilt = rand(-12, 12);
  if (motionPrefs.reduced) {
    el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 1100, easing: "ease" });
  } else {
    paths.forEach((p) =>
      p.animate([{ strokeDasharray: "1", strokeDashoffset: "1" }, { strokeDasharray: "1", strokeDashoffset: "0" }], {
        duration: 420, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards",
      }),
    );
    el.animate(
      [
        { opacity: 1, transform: `translateY(0) rotate(${tilt}deg)` },
        { opacity: 1, transform: `translateY(-10px) rotate(${tilt}deg)`, offset: 0.6 },
        { opacity: 0, transform: `translateY(-22px) rotate(${tilt}deg)` },
      ],
      { duration: 1200, easing: "ease-out", fill: "forwards" },
    );
  }
  setTimeout(() => { el.remove(); squiggleCount--; }, 1250);
}

// ---------- public API ----------
export const audio = {
  get muted() { return muted; },
  get ready() { return !!ctx && ctx.state === "running"; },
  get ctx() { return ctx; },

  setMuted(value) {
    muted = !!value;
    store.set("pip-muted", muted);
    if (ctx && master) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(muted ? 0 : 0.8, t, 0.03);
      if (!muted && ctx.state === "suspended") ctx.resume().catch(() => {});
    }
    bus.emit("mute", muted);
  },

  /** Play a named sound. `origin` (an element or {x, y}) is where its squiggle goes when muted. */
  play(name, origin, arg) {
    if (muted) {
      squiggle(name, origin);
      return;
    }
    if (!ctx || ctx.state !== "running" || !SOUNDS[name]) return;
    SOUNDS[name](ctx.currentTime + 0.01, arg);
  },

  /** Ambient sounds (crickets, snores): never squiggle-spam, never play before a gesture. */
  ambient(name, arg) {
    if (muted || !ctx || ctx.state !== "running" || !SOUNDS[name]) return;
    SOUNDS[name](ctx.currentTime + 0.01, arg);
  },

  musicNote,
};
