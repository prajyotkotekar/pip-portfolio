// Dream Delivery Routes: Pip's crayon map of Lantern Lane. The dotted route draws itself (on scroll
// in Scene 6, or when you press "Fly the route" in the exhibit) and his cloud wobbles along it.
import { svg, h, place, motionPrefs, M, svgNS } from "./state.js";
import { audio } from "./audio.js";

/**
 * Points every `step` units along a path made of one M and then C (cubic) segments, as a flat
 * [x0, y0, x1, y1, …] list. Done with plain maths because getPointAtLength is slow, and the route
 * never changes, so both maps share the result.
 */
function sampleRoute(d, step) {
  const n = d.match(/-?\d*\.?\d+/g).map(Number);
  const fine = [n[0], n[1]];
  for (let i = 2; i + 5 < n.length; i += 6) {
    const [x0, y0] = fine.slice(-2);
    const [x1, y1, x2, y2, x3, y3] = n.slice(i, i + 6);
    for (let k = 1; k <= 40; k++) {
      const t = k / 40;
      const u = 1 - t;
      fine.push(
        u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
      );
    }
  }
  const out = [fine[0], fine[1]];
  let next = step;
  let run = 0;
  for (let i = 2; i < fine.length; i += 2) {
    const ax = fine[i - 2], ay = fine[i - 1], bx = fine[i], by = fine[i + 1];
    const seg = Math.hypot(bx - ax, by - ay);
    while (run + seg >= next) {
      const k = (next - run) / seg;
      out.push(ax + (bx - ax) * k, ay + (by - ay) * k);
      next += step;
    }
    run += seg;
  }
  return out;
}
const routeSamples = new Map();

const ROUTE =
  "M100 112C160 64 260 70 330 96C380 114 418 124 428 144C438 190 390 236 336 254C282 270 252 300 272 334C292 372 352 366 354 322C356 282 304 270 276 286C226 314 166 370 158 422C154 466 224 506 296 494C346 486 384 466 404 446C420 432 438 432 448 440C462 450 482 448 494 438";

const STOPS = [
  { id: "bramble", x: 428, y: 142, dream: "pancake", label: "Drop the pancake dream down Bramble's chimney" },
  { id: "thimble", x: 158, y: 424, dream: "mouse", label: "Drop the being-enormous dream down Thimble's chimney" },
  { id: "duck1", x: 404, y: 446, dream: "puddle", label: "Drop a puddle dream down the first duckling's chimney" },
  { id: "duck2", x: 448, y: 440, dream: "puddle", label: "Drop a puddle dream down the second duckling's chimney" },
  { id: "duck3", x: 494, y: 438, dream: "puddle", label: "Drop a puddle dream down the third duckling's chimney" },
];

const ICON = {
  pancake: `<ellipse cy="4" rx="8" ry="3" fill="#e9b36a"/><ellipse cy="0" rx="8" ry="3" fill="#f2c27f"/><ellipse cy="-4" rx="8" ry="3" fill="#f7d08f"/><rect x="-2" y="-8" width="4" height="3" fill="#ffe58f"/>`,
  mouse: `<circle cx="-5" cy="-4" r="4" fill="#cdbfc9"/><circle cx="5" cy="-4" r="4" fill="#cdbfc9"/><ellipse cy="2" rx="7" ry="6" fill="#d9ccd5"/><circle cx="0" cy="4" r="1.3" fill="#e98aa5"/>`,
  puddle: `<path d="M-9 3c0-6 6-4 9-7 4 3 10 2 9 7 0 4-18 4-18 0z" fill="#9fc6e8"/><path d="M-3 1h5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
};

function roof(x, y, w, hh, fill, ridge = true) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="6" fill="${fill}" stroke="#7a5566" stroke-width="3"/>${ridge ? `<path d="M${x + 8} ${y + hh / 2}h${w - 16}" stroke="#7a5566" stroke-width="2.4" stroke-linecap="round"/>` : ""}`;
}
function tree(x, y, r = 16) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#a9cf8f" stroke="#5f8a4c" stroke-width="2.6"/><path d="M${x - r * 0.4} ${y - r * 0.1}q${r * 0.4}-${r * 0.5} ${r * 0.8} 0" stroke="#5f8a4c" stroke-width="2" fill="none"/>`;
}

export function createMap(host, { mode = "scroll", onAllDone, onDeliver } = {}) {
  host.classList.add("map");
  const id = `map${Math.random().toString(36).slice(2, 7)}`;
  const s = svg(
    `
    <defs>
      <mask id="${id}-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600">
        <path class="map__reveal" d="${ROUTE}" pathLength="1" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round"/>
      </mask>
    </defs>
    <g class="map__paper" filter="url(#crayon)">
      <rect x="18" y="18" width="564" height="564" rx="10" fill="#fbf3e4" stroke="#c9a98a" stroke-width="4"/>
      <path d="M24 214h552v40H24zM236 24h40v552h-40z" fill="#efe1c9"/>
      <path d="M24 214h552M24 254h552M236 24v552M276 24v552" stroke="#d7bfa0" stroke-width="2.4" stroke-dasharray="14 10"/>
      ${roof(46, 62, 110, 78, "#f6c7d4")}
      <path d="M440 70c40 0 66 30 60 64s-40 54-70 50-62-24-58-58 30-56 68-56z" fill="#8fbf7e" stroke="#4f7a44" stroke-width="3"/>
      <path d="M402 98q8-8 16 0M446 86q8-8 16 0M466 150q8-8 16 0M398 150q8-8 16 0" stroke="#4f7a44" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${roof(262, 282, 96, 68, "#c9b6e4")}
      ${roof(88, 398, 132, 92, "#ffd1a6")}
      ${roof(376, 410, 164, 82, "#ffe58f")}
      ${roof(186, 84, 40, 56, "#bfe3c0")}${roof(482, 300, 72, 60, "#f6b7c8")}${roof(44, 290, 90, 60, "#cdbdf0")}${roof(312, 508, 90, 52, "#bfe3c0")}${roof(470, 40, 80, 20, "#ffd1a6", false)}
      ${tree(206, 186)}${tree(354, 182, 13)}${tree(534, 232, 15)}${tree(60, 520, 18)}${tree(210, 540, 14)}${tree(540, 540, 16)}${tree(150, 300, 12)}
      <path d="M416 126c-18 6-18 30 4 30s26-28 6-34-34 10-26 30 40 16 40-4M410 120c-24 2-30 36-4 42" stroke="#9a91a8" stroke-width="1.8" fill="none" opacity=".75"/>
      <text x="450" y="210" class="map__label map__label--small">3 times??</text>
    </g>
    <g class="map__labels">
      <text x="62" y="160" class="map__label">nursery</text>
      <text x="470" y="64" class="map__label">Bramble</text>
      <text x="94" y="512" class="map__label">Velvet mice</text>
      <text x="398" y="512" class="map__label">ducklings</text>
      <text x="290" y="240" class="map__label map__label--lane">Lantern Lane</text>
    </g>
    <g class="map__vane" transform="translate(310 316)">
      <g class="map__vane-spin">
        <path d="M-26 0H26M0-26V26" stroke="#5c4033" stroke-width="3" stroke-linecap="round"/>
        <path d="M-22 0L14-7v14z" fill="#a34063" stroke="#5c4033" stroke-width="2"/>
        <path d="M14-9l14 9-14 9z" fill="#ffbe1a" stroke="#5c4033" stroke-width="2"/>
        <text y="-30" class="map__nesw">N</text><text x="34" y="5" class="map__nesw">E</text><text y="42" class="map__nesw">S</text><text x="-36" y="5" class="map__nesw">W</text>
      </g>
    </g>
    ${STOPS.map((st) => `<g class="stop" data-stop="${st.id}"><rect x="${st.x - 8}" y="${st.y - 8}" width="16" height="16" rx="3" fill="#a87b5f" stroke="#5c4033" stroke-width="2.4"/><rect class="stop__light" x="${st.x + 12}" y="${st.y - 4}" width="16" height="12" rx="2"/><text class="stop__z" x="${st.x}" y="${st.y - 18}">z z z</text></g>`).join("")}
    <path class="map__route" d="${ROUTE}" mask="url(#${id}-reveal)"/>
    <g class="map__drops"></g>
    <g class="map__cloud" transform="translate(100 112)">
      <g class="map__cloud-bob">
        <g class="map__dreams">
          <g data-dream="pancake" transform="translate(-22 -46)"><circle r="12" class="dream-bubble"/>${ICON.pancake}</g>
          <g data-dream="mouse" transform="translate(0 -56)"><circle r="12" class="dream-bubble"/>${ICON.mouse}</g>
          <g data-dream="puddle" transform="translate(22 -46)"><circle r="12" class="dream-bubble"/>${ICON.puddle}</g>
        </g>
        <use href="#cloudlet" x="-30" y="-20" width="60" height="38"/>
        <circle cx="2" cy="-18" r="11" fill="#fbf5ec" stroke="#6b4a5a" stroke-width="2.4"/>
        <path d="M-9-22c0-12 22-14 22 0" fill="#f7ecd6" stroke="#6b4a5a" stroke-width="2.4"/>
        <circle cx="-2" cy="-17" r="2.6" fill="#3a2830"/><circle cx="7" cy="-17" r="2.6" fill="#3a2830"/>
      </g>
    </g>`,
    { viewBox: "0 0 600 600", class: "map__svg", "aria-hidden": "true", focusable: "false" },
  );
  host.append(s);

  const route = s.querySelector(".map__route");
  const reveal = s.querySelector(".map__reveal");
  const cloud = s.querySelector(".map__cloud");
  const drops = s.querySelector(".map__drops");
  const vane = s.querySelector(".map__vane-spin");
  const total = route.getTotalLength();
  const bubble = h("div", { class: "bubble bubble--above map__bubble", "aria-hidden": "true" });
  host.append(bubble);

  // the chimneys and the cloud read positions from these samples
  const STEP = 4;
  const key = route.getAttribute("d");
  if (!routeSamples.has(key)) routeSamples.set(key, sampleRoute(key, STEP));
  const samples = routeSamples.get(key);
  const pointAt = (l) => {
    const f = Math.min(Math.max(l, 0) / STEP, samples.length / 2 - 1);
    const i = Math.floor(f);
    const j = Math.min(i + 1, samples.length / 2 - 1);
    const k = f - i;
    return { x: samples[i * 2] + (samples[j * 2] - samples[i * 2]) * k, y: samples[i * 2 + 1] + (samples[j * 2 + 1] - samples[i * 2 + 1]) * k };
  };

  // how far along the route each chimney is
  const stops = STOPS.map((st) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < samples.length; i += 2) {
      const d = Math.hypot(samples[i] - st.x, samples[i + 1] - st.y);
      if (d < bestD) { bestD = d; best = (i / 2) * STEP; }
    }
    const btn = h("button", { type: "button", class: "hot map__stop", "aria-label": st.label });
    place(btn, st.x - 22, st.y - 30, 44, 56);
    host.append(btn);
    return { ...st, at: best / total, btn, g: s.querySelector(`[data-stop="${st.id}"]`), done: false };
  });

  let drawn = 0;
  function say(text, x, y, ms = 2600) {
    bubble.textContent = text;
    place(bubble, x, y);
    bubble.classList.add("show");
    const live = document.getElementById("pip-voice");
    if (live) live.textContent = text;
    clearTimeout(bubble._t);
    bubble._t = setTimeout(() => bubble.classList.remove("show"), ms);
  }

  function setDrawn(t) {
    drawn = t;
    reveal.style.strokeDashoffset = String(1 - t);
    const pt = pointAt(t * total - 6);
    cloud.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    stops.forEach((st) => {
      const ready = mode === "play" || t >= st.at - 0.02;
      st.btn.disabled = !ready || st.done;
      st.g.classList.toggle("is-ready", ready && !st.done);
    });
  }

  function deliver(st) {
    if (st.done) return;
    st.done = true;
    st.btn.disabled = true;
    const drop = document.createElementNS(svgNS, "g");
    drop.innerHTML = `<g><circle r="12" class="dream-bubble"/>${ICON[st.dream]}</g>`;
    drop.setAttribute("transform", `translate(${st.x} ${st.y})`);
    drops.append(drop);
    const land = () => {
      drop.remove();
      audio.play("plip", st.btn);
      st.g.classList.remove("is-ready");
      st.g.classList.add("is-done");
      const left = stops.filter((x) => !x.done);
      if (!left.some((x) => x.dream === st.dream)) s.querySelector(`[data-dream="${st.dream}"]`)?.classList.add("is-gone");
      onDeliver?.(stops.length - left.length, stops.length);
      if (!left.length) {
        setTimeout(() => {
          say("I'm not sleepy. I'm doing a long blink.", 300, 250, 3400);
          onAllDone?.();
        }, 500);
      }
    };
    if (motionPrefs.reduced) {
      land();
      return;
    }
    drop.firstElementChild.animate(
      [{ transform: "translate(0px, -80px) scale(1)", opacity: 0 }, { transform: "translate(0px, -50px) scale(1)", opacity: 1, offset: 0.3 }, { transform: "translate(0px, 0px) scale(0.4)", opacity: 1 }],
      { duration: 700, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "forwards" },
    ).finished.then(land, land);
  }
  stops.forEach((st) => st.btn.addEventListener("click", () => deliver(st)));

  const vaneBtn = h("button", { type: "button", class: "hot map__vane-btn", "aria-label": "The weathervane Pip bonked. Click it." });
  place(vaneBtn, 276, 282, 68, 68);
  host.append(vaneBtn);
  let spins = 0;
  vaneBtn.addEventListener("click", () => {
    spins++;
    audio.play("whoosh", vaneBtn);
    setTimeout(() => audio.play("giggle", vaneBtn), 380);
    say("Sorry! Sorry.", 310, 268, 2000);
    if (!motionPrefs.reduced) {
      vane.animate([{ transform: `rotate(${(spins - 1) * 720}deg)` }, { transform: `rotate(${spins * 720}deg)` }], { duration: 1200, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" });
    }
  });

  setDrawn(mode === "play" ? 1 : 0);

  return {
    setDrawn,
    reset() {
      stops.forEach((st) => {
        st.done = false;
        st.g.classList.remove("is-done");
      });
      s.querySelectorAll("[data-dream]").forEach((g) => g.classList.remove("is-gone"));
      setDrawn(drawn);
    },
    fly() {
      this.reset();
      if (motionPrefs.reduced || !M) {
        setDrawn(1);
        return Promise.resolve();
      }
      return M.animate(0, 1, { duration: 6.5, ease: "easeInOut", onUpdate: setDrawn }).finished;
    },
    get delivered() { return stops.filter((x) => x.done).length; },
  };
}
