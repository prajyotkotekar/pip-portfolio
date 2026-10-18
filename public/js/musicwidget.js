// The music box you can actually wind: the official render, a turning unicorn and a gold key.
// Drag the key round in a circle, press and hold it, or press Enter. Shared by Scene 4 and the Lab.
import { h, bus, motionPrefs, animate } from "./state.js";
import { musicbox } from "./musicbox.js";
import { audio } from "./audio.js";

const SECONDS_PER_TURN = 7;
const widgets = new Set();

bus.on("mb:start", () => widgets.forEach((w) => w.classList.add("is-playing")));
bus.on("mb:stop", () => widgets.forEach((w) => w.classList.remove("is-playing")));
bus.on("mb:wind", ({ remaining, max }) => {
  widgets.forEach((w) => {
    w.style.setProperty("--wound", (remaining / max).toFixed(3));
    w.classList.toggle("is-wound", remaining > 0.2);
  });
});

export function createMusicBox(host, { label = "music box" } = {}) {
  host.classList.add("mbox");
  host.innerHTML = `
    <img class="mbox__base" src="assets/img/pip_lullaby_box_cutout.webp" width="482" height="555" alt="Pip's pink and cream music box with a gold key and a unicorn on top" decoding="async">
    <div class="mbox__uni" aria-hidden="true"><img src="assets/img/pip_lullaby_box_cutout.webp" width="482" height="555" alt="" decoding="async"></div>
    <button type="button" class="mbox__unicorn" aria-label="Thimble's unicorn"></button>
    <button type="button" class="mbox__key" aria-label="Wind the ${label}: drag round in a circle, press and hold, or press Enter">
      <svg class="mbox__ring" viewBox="-50 -50 100 100" aria-hidden="true">
        <circle r="44" class="mbox__ring-track"/>
        <circle r="44" class="mbox__ring-fill" pathLength="1"/>
        <circle r="47" class="mbox__hint"/>
      </svg>
      <span class="mbox__shaft" aria-hidden="true"></span>
      <span class="mbox__turn" aria-hidden="true"><span class="mbox__spin">
        <svg viewBox="-30 -40 60 80"><path d="M-6 -4C-26 -6-30-34-8-36 0-37 4-30 0-22-2-14 6-8 6-4ZM-6 4C-26 6-30 34-8 36 0 37 4 30 0 22-2 14 6 8 6 4Z" fill="#f0c25a" stroke="#9a6a1c" stroke-width="3" stroke-linejoin="round"/><circle cx="-11" cy="-22" r="5" fill="#c99230"/><circle cx="-11" cy="22" r="5" fill="#c99230"/><rect x="-8" y="-7" width="16" height="14" rx="4" fill="#e3ad3f" stroke="#9a6a1c" stroke-width="3"/></svg>
      </span></span>
    </button>
    <div class="bubble bubble--above mbox__bubble" aria-hidden="true"></div>`;
  widgets.add(host);

  const key = host.querySelector(".mbox__key");
  const turn = host.querySelector(".mbox__turn");
  const unicorn = host.querySelector(".mbox__unicorn");
  const bubble = host.querySelector(".mbox__bubble");
  let angle = 0;
  let firstWind = true;

  function addWind(seconds, origin = key) {
    if (seconds <= 0) return;
    if (firstWind) {
      firstWind = false;
      host.classList.add("was-wound");
    }
    musicbox.wind(seconds);
    angle += seconds * (360 / SECONDS_PER_TURN);
    turn.style.transform = `rotateX(${angle.toFixed(1)}deg)`;
    if (Math.random() < 0.35) audio.play("click", origin);
  }

  // drag in a circle
  let drag = null;
  key.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    const r = key.getBoundingClientRect();
    drag = {
      id: e.pointerId,
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      last: Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)),
      moved: 0,
      t0: performance.now(),
    };
    key.setPointerCapture(e.pointerId);
    key.classList.add("is-held");
    // press and hold winds it too (the touch-friendly way)
    drag.hold = setInterval(() => { if (drag && drag.moved < 0.3) addWind(0.7); }, 170);
  });
  key.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
    let d = a - drag.last;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    drag.last = a;
    const turnAmount = Math.abs(d);
    if (turnAmount > 0.6) return; // jumped across the centre: ignore
    drag.moved += turnAmount;
    addWind((turnAmount / (Math.PI * 2)) * SECONDS_PER_TURN);
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    clearInterval(drag.hold);
    if (drag.moved < 0.3 && performance.now() - drag.t0 < 170 && e.type === "pointerup") addWind(2.5);
    drag = null;
    key.classList.remove("is-held");
  };
  key.addEventListener("pointerup", release);
  key.addEventListener("pointercancel", release);
  key.addEventListener("click", (e) => {
    if (e.detail !== 0) return; // keyboard: Enter or Space
    addWind(6);
    if (!motionPrefs.reduced) animate(turn, { transform: [`rotateX(${angle - 300}deg)`, `rotateX(${angle}deg)`] }, { duration: 0.5, ease: "easeOut" });
  });

  // Thimble's unicorn
  const sayPerfect = () => {
    bubble.textContent = "Thimble says it's PERFECT.";
    bubble.classList.add("show");
    clearTimeout(bubble._t);
    bubble._t = setTimeout(() => bubble.classList.remove("show"), 2400);
    const live = document.getElementById("pip-voice");
    if (live) live.textContent = "Thimble says it's PERFECT.";
  };
  unicorn.addEventListener("mouseenter", sayPerfect);
  unicorn.addEventListener("focus", sayPerfect);
  unicorn.addEventListener("click", sayPerfect);

  return { host, addWind };
}
