// Things Pip made: five exhibits built from the same toys the story uses.
import { h, svg, bus, store, session, motionPrefs, animate } from "./state.js";
import { NOTE_NAMES } from "./audio.js";
import { audio } from "./audio.js";
import { createMusicBox } from "./musicwidget.js";
import { musicbox } from "./musicbox.js";
import { lampButton, setLit, SHAPES } from "./lamps.js";
import { wallShapes, cricket } from "./art.js";
import { createMap } from "./map.js";
import { rattleButton, createStacker } from "./toys.js";
import { createPip, speak } from "./pip.js";
import { mountCalendar, initEgg } from "./egg.js";

const NOTE_Y = [48, 42, 36, 24, 18]; // C5 D5 E5 G5 A5 on a treble staff
const BLOCK_VARS = ["--blk-c", "--blk-d", "--blk-e", "--blk-g", "--blk-a"];

// ---------- 1. The Lullaby Lab ----------
function lab(host) {
  const dresser = h("div", { class: "lab__dresser" });
  const boxHost = h("div", { class: "lab__box" });
  dresser.append(boxHost);
  createMusicBox(boxHost, { label: "Lullaby Lab music box" });

  const read = h("div", { class: "lab__readout" });
  const staff = svg(
    `<g class="staff__lines">${[30, 42, 54, 66, 78].map((y) => `<path d="M8 ${y}H352"/>`).join("")}</g>
     <text x="14" y="70" class="staff__clef">♪</text>
     <g class="staff__notes"></g>`,
    { viewBox: "0 0 360 110", class: "staff", role: "img", "aria-label": "The notes of the phrase the music box is playing" },
  );
  const notesG = staff.querySelector(".staff__notes");
  const phrase = h("p", { class: "lab__phrase" }, "Wind the gold key to hear phrase one.");
  const spring = h("div", { class: "lab__spring" });
  spring.innerHTML = `<span class="lab__spring-label">Spring</span><span class="lab__spring-bar" aria-hidden="true"><span></span></span><span class="lab__spring-secs">0 s</span>`;
  const secs = spring.querySelector(".lab__spring-secs");
  const legend = h("p", { class: "lab__legend" });
  legend.innerHTML = NOTE_NAMES.map((n, i) => `<span style="--c: var(${BLOCK_VARS[i]})">${n}</span>`).join("");
  read.append(staff, phrase, spring, legend);
  host.append(dresser, read);

  let heads = [];
  bus.on("mb:phrase", ({ notes, number }) => {
    notesG.replaceChildren();
    const gap = Math.min(56, 290 / notes.length);
    heads = notes.map((n, i) => {
      const x = 60 + i * gap;
      const y = NOTE_Y[n];
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "staff__note");
      g.innerHTML = `${y <= 18 ? `<path d="M${x - 13} 18h26" class="staff__ledger"/>` : ""}<ellipse cx="${x}" cy="${y}" rx="8" ry="6" style="fill: var(${BLOCK_VARS[n]})"/><path d="M${x + 7} ${y - 2}V${y - 30}" class="staff__stem"/><text x="${x}" y="104" text-anchor="middle">${NOTE_NAMES[n]}</text>`;
      notesG.append(g);
      return g;
    });
    phrase.textContent = number > 1 ? `Phrase ${number}. Never the same as phrase ${number - 1}.` : "Phrase 1. A brand new one.";
  });
  bus.on("mb:note", ({ k }) => {
    heads.forEach((g, i) => g.classList.toggle("is-playing", i === k));
  });
  bus.on("mb:wind", ({ remaining, max }) => {
    secs.textContent = `${Math.round(remaining)} s`;
    spring.style.setProperty("--wound", (remaining / max).toFixed(3));
  });
  bus.on("mb:stop", () => {
    heads.forEach((g) => g.classList.remove("is-playing"));
    phrase.textContent = `It stopped after ${musicbox.phrases} phrase${musicbox.phrases === 1 ? "" : "s"}. Wind it again?`;
  });
}

// ---------- 2. Nightlight Collection ----------
function sill(host) {
  const LAMPS = [
    { kind: "lantern", tag: "Bramble's bell", label: "Bramble's bell lamp" },
    { kind: "thimble", tag: "Thimble's thimble", label: "Thimble's thimble lamp" },
    { kind: "duck", tag: "a duckling's", label: "A duckling's lamp", duck: true },
    { kind: "duck", tag: "a duckling's", label: "Another duckling's lamp", duck: true },
    { kind: "duck", tag: "a duckling's", label: "The other duckling's lamp", duck: true },
    { kind: "cloud", tag: "Pip's cloud", label: "Pip's cloud lamp" },
  ];
  const wall = h("div", { class: "sill__wall" });
  const row = h("div", { class: "sill__row" });
  const count = h("p", { class: "sill__count", "aria-live": "polite" }, "All six are off. The dark is big.");
  host.append(wall, row, count);

  let lit = 0;
  LAMPS.forEach((l) => {
    const item = h("div", { class: "sill__item" });
    const shapes = svg(wallShapes(SHAPES[l.kind], 60, 60, 0.9), { viewBox: "0 0 120 120", class: "sill__shapes", "aria-hidden": "true" });
    const b = lampButton(l.kind, l.label);
    const tag = h("span", { class: "sill__tag" }, l.tag);
    const bubble = h("span", { class: "bubble bubble--above sill__bubble", "aria-hidden": "true" }, "That one's mine.");
    item.append(shapes, b, tag, bubble);
    row.append(item);
    const mine = () => {
      if (!l.duck) return;
      bubble.classList.add("show");
      clearTimeout(bubble._t);
      bubble._t = setTimeout(() => bubble.classList.remove("show"), 1500);
    };
    b.addEventListener("click", () => {
      const on = !b.classList.contains("is-lit");
      setLit(b, on);
      item.classList.toggle("is-lit", on);
      lit += on ? 1 : -1;
      count.textContent = lit === 0 ? "All six are off. The dark is big." : lit === 6 ? "All six on. The dark got edges." : `${lit} of 6 on. The dark is getting smaller.`;
      if (on) mine();
    });
    b.addEventListener("mouseenter", mine);
  });
}

// ---------- 3. Dream Delivery Routes ----------
function routes(host) {
  const box = h("div", { class: "routes__map" });
  const controls = h("div", { class: "routes__controls" });
  const fly = h("button", { type: "button", class: "toy-btn" }, "Fly the route");
  const status = h("p", { class: "routes__status", "aria-live": "polite" }, "Dreams delivered tonight: 0 of 5");
  controls.append(fly, status);
  host.append(box, controls);
  const map = createMap(box, {
    mode: "play",
    onDeliver(n, total) { status.textContent = `Dreams delivered tonight: ${n} of ${total}`; },
  });
  fly.addEventListener("click", async () => {
    fly.disabled = true;
    status.textContent = "Dreams delivered tonight: 0 of 5";
    audio.play("whoosh", fly);
    try { await map.fly(); } catch { /* interrupted */ }
    fly.disabled = false;
  });
}

// ---------- 4. Rattle & Block Toys ----------
function shelf(host) {
  const rack = h("div", { class: "shelf__rack" });
  const tally = h("p", { class: "shelf__tally", "aria-live": "polite" }, "Rattles shaken: 0 of 41");
  let shaken = 0;
  [["ball", "Shake the big round rattle"], ["bell", "Shake the small rattle"], ["carrot", "Shake the carrot rattle"]].forEach(([kind, label]) => {
    const b = rattleButton(kind, label);
    b.addEventListener("click", () => {
      shaken++;
      if (shaken === 41) {
        tally.textContent = "Forty-one! Nobody slept, but everybody giggled.";
        speak("Hee! That counts as half a win.", { giggle: true });
      } else if (shaken < 41) tally.textContent = `Rattles shaken: ${shaken} of 41`;
      else tally.textContent = `Rattles shaken: ${shaken}. That's more than forty-one.`;
    });
    rack.append(b);
  });
  const play = h("div", { class: "shelf__blocks" });
  const hint = h("p", { class: "shelf__hint" }, "Tap or drag a block onto the stack. Colour order plays a tune.");
  host.append(rack, tally, play, hint);
  createStacker(play, {
    W: 600, H: 340, ground: 320, cx: 470, size: 76,
    pile: [
      { x: 40, y: 244, rot: -8 }, { x: 128, y: 246, rot: 6 }, { x: 214, y: 242, rot: -4 },
      { x: 300, y: 246, rot: 9 }, { x: 84, y: 168, rot: 14 },
    ],
    onTopple(byUser) { if (byUser) speak("That wasn't a fall. I was testing the floor."); },
    onTune() { speak("It almost sounded like a song!", { giggle: true }); },
  });
}

// ---------- 6. Pip's Growth Chart ----------
function doorway(host) {
  const visits = store.get("pip-visits", 0);
  const chart = h("div", { class: "door__chart" });
  const frame = svg(
    `<rect x="0" y="0" width="220" height="520" fill="#2a1d3a"/>
     <rect x="0" y="0" width="30" height="520" class="door__post"/><rect x="190" y="0" width="30" height="520" class="door__post"/>
     <rect x="0" y="0" width="220" height="24" class="door__post"/>
     ${Array.from({ length: 24 }, (_, i) => { const y = 500 - i * 20; return `<path d="M30 ${y}h${i % 5 === 0 ? 14 : 8}" class="door__tick"/>`; }).join("")}
     <path d="M190 410h-40" class="door__pencil-line"/>
     <text x="146" y="402" text-anchor="end" class="door__pencil-text">PIP, FIRST NIGHT</text>
     <g class="door__pencil" transform="translate(150 60)"><path d="M0 0l40-14 6 12-40 14z" fill="#ffbe1a" stroke="#5c4033" stroke-width="2.4"/><path d="M0 0l-10 7 14-1z" fill="#5c4033"/></g>`,
    { viewBox: "0 0 220 520", class: "door__frame", "aria-hidden": "true" },
  );
  const pipBox = h("div", { class: "door__pip", "aria-hidden": "true" });
  chart.append(frame, pipBox);
  const mini = createPip(pipBox, { variant: "head" });
  mini.svg.classList.add("door__pip-svg");

  const side = h("div", { class: "door__side" });
  const measure = h("button", { type: "button", class: "toy-btn" }, "Measure Pip");
  const marks = h("ol", { class: "door__marks", "aria-label": "Sideways marks" });
  const calHost = h("div", { class: "door__cal" });
  const postcard = h("button", { type: "button", class: "postcard", "aria-pressed": "false", "aria-label": "A postcard from the crickets. Click to flip it over.", hidden: "" });
  const mine = h("form", { class: "door__mine", novalidate: "" });
  mine.innerHTML = `<label class="door__mine-label" for="mark-input">Add your own sideways mark</label>
    <span class="door__mine-row"><span class="door__mine-can" aria-hidden="true">Can</span><input id="mark-input" name="mark" type="text" maxlength="40" autocomplete="off" placeholder="yawn on purpose">
    <button type="submit" class="toy-btn toy-btn--soft">Draw it</button></span>
    <span class="door__mine-status" role="status" aria-live="polite"></span>`;
  side.append(measure, marks, mine, calHost, postcard);
  const grass = h("div", { class: "door__grass", "aria-hidden": "true" });
  grass.append(svg(Array.from({ length: 5 }, (_, i) => cricket(20 + i * 120, 8, 0.9, { cls: "egg-cricket" })).join(""), { viewBox: "0 0 620 52", preserveAspectRatio: "xMidYMax meet" }));
  host.append(chart, side, grass);

  const addMark = (text, fresh = false) => {
    const li = h("li", { class: "door__mark" }, text);
    marks.append(li);
    while (marks.children.length > 6) marks.firstElementChild.remove();
    if (fresh && !motionPrefs.reduced) li.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 700, easing: "cubic-bezier(0.77, 0, 0.175, 1)" });
  };
  const visitText = (n) => (n === 1 ? "Night 1: you found the nursery" : n === 2 ? "Night 2: you came back!" : `Night ${n}: you came back again`);
  for (let n = Math.max(1, visits - 3); n <= visits; n++) addMark(visitText(n));

  // visitors grow sideways too: their marks are kept in this browser
  const myMarks = () => store.get("pip-my-marks", []).filter((t) => typeof t === "string").slice(-3);
  myMarks().forEach((t) => addMark(`Can ${t}`));
  const input = mine.querySelector("input");
  const status = mine.querySelector(".door__mine-status");
  mine.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.replace(/\s+/g, " ").trim().replace(/^can\s+/i, "").slice(0, 40);
    if (!text) {
      status.textContent = "Write something you can do. Anything counts. Even yawning.";
      input.focus();
      return;
    }
    store.set("pip-my-marks", [...myMarks(), text].slice(-3));
    addMark(`Can ${text}`, true);
    input.value = "";
    status.textContent = "Drawn! You grow sideways too.";
    audio.play("note", mine.querySelector("button"), 4);
    speak("Look at you! Sideways growing is the best kind.");
  });

  let measured = 0;
  const pencil = frame.querySelector(".door__pencil");
  measure.addEventListener("click", () => {
    measured++;
    audio.play("tear", measure);
    const done = () => {
      speak(measured === 1 ? "Same line as last time. Drawing it sideways." : "Still very low down. Sideways again!");
      addMark(measured === 1 ? "Measured tonight: still very low down" : `Measured again (${measured} times): still very low down`, true);
    };
    if (motionPrefs.reduced) { done(); return; }
    animate(pencil, { transform: ["translate(150px, 60px)", "translate(152px, 404px)", "translate(152px, 404px) rotate(-8deg)", "translate(150px, 60px)"] }, { duration: 1.6, ease: "easeInOut" }).finished.then(done, done);
    animate(mini.svg, { transform: ["translateY(0px)", "translateY(-6px)", "translateY(0px)"] }, { duration: 0.5, delay: 0.6 });
  });

  mountCalendar(calHost);
  initEgg(postcard);
}

export function initProjects() {
  // remember the visitor: one visit per browser session
  if (!session.get("pip-visit-counted", false)) {
    store.set("pip-visits", store.get("pip-visits", 0) + 1);
    session.set("pip-visit-counted", true);
  }
  const mounts = [["lab", lab], ["sill", sill], ["routes", routes], ["shelf", shelf], ["doorway", doorway]];
  mounts.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      fn(el);
    } catch {
      el.append(h("p", { class: "exhibit__oops" }, "This toy is having a nap. Try reloading the page."));
    }
  });
  document.querySelectorAll(".exhibit").forEach((a) => a.setAttribute("tabindex", "-1"));
}

export function greet() {
  const visits = store.get("pip-visits", 1);
  const line = visits <= 1 ? "Hi! I'm Pip. Click me, I giggle." : `You came back! That's visit ${visits}. I drew you a mark.`;
  setTimeout(() => speak(line, { ms: 3600 }), 1200);
}
