// Rattles and the five note blocks. Built once, used in Scene 3 and in the Rattle & Block exhibit.
import { animate, motionPrefs, h } from "./state.js";
import { audio, NOTE_NAMES } from "./audio.js";
import { rattleSVG } from "./art.js";

// ---------- rattles ----------
const RATTLE_SOUND = { ball: ["rattle", 0], bell: ["rattle", 2], carrot: ["squeak"] };

export function rattleButton(kind, label) {
  const b = h("button", { type: "button", class: `rattle rattle--${kind}`, "aria-label": label });
  b.innerHTML = rattleSVG(kind);
  b.addEventListener("click", () => shakeRattle(b, kind));
  return b;
}

export function shakeRattle(b, kind) {
  const [name, arg] = RATTLE_SOUND[kind] || RATTLE_SOUND.ball;
  audio.play(name, b, arg);
  if (motionPrefs.reduced) return;
  b.firstElementChild.animate(
    [
      { transform: "rotate(0deg)" }, { transform: "rotate(-18deg)" }, { transform: "rotate(16deg)" },
      { transform: "rotate(-11deg)" }, { transform: "rotate(7deg)" }, { transform: "rotate(0deg)" },
    ],
    { duration: 520, easing: "ease-in-out" },
  );
}

// ---------- blocks ----------
const COLOURS = ["var(--blk-c)", "var(--blk-d)", "var(--blk-e)", "var(--blk-g)", "var(--blk-a)"];

export function noteGlyph(host, el, text = "♪") {
  if (motionPrefs.reduced) return;
  const hr = host.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const g = h("span", { class: "note-glyph", "aria-hidden": "true" }, text);
  g.style.left = `${r.left - hr.left + r.width / 2}px`;
  g.style.top = `${r.top - hr.top}px`;
  host.append(g);
  g.animate(
    [
      { transform: "translate(-50%, 0) scale(0.8)", opacity: 0 },
      { transform: "translate(-50%, -24px) scale(1.1)", opacity: 1, offset: 0.25 },
      { transform: "translate(-50%, -70px) scale(1)", opacity: 0 },
    ],
    { duration: 1000, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
  ).finished.then(() => g.remove(), () => g.remove());
}

/**
 * A block stacker inside `host` (a positioned box). Coordinates are in a W x H unit space.
 * Scripted mode (Scene 3): the scroll decides how many blocks are stacked, then knocks them over.
 * Free mode: every block starts in the pile and you play.
 */
export function createStacker(host, { W = 600, H = 600, ground = 520, cx = 450, size = 70, pile, scripted = false, onTopple, onTune, onAdd } = {}) {
  const reduced = motionPrefs.reduced;
  const blocks = NOTE_NAMES.map((name, i) => {
    const el = h("button", { type: "button", class: "block", "aria-label": `Block ${name}. Plays the note ${name}.` });
    el.style.setProperty("--c", COLOURS[i]);
    el.innerHTML = `<span aria-hidden="true">${name}</span>`;
    host.append(el);
    return { el, i, rot: 0, anim: null };
  });

  let stack = [];
  let interactive = !scripted;
  let mode = scripted ? 0 : "free";
  const wob = [-2, 3, -1, 2, -3];

  const stackSlot = (k) => ({ x: cx - size / 2, y: ground - size * (k + 1), rot: wob[k] });
  const pileSlot = (i) => pile[i];
  const waitSlot = (k) => ({ x: cx - size / 2, y: ground - size * (k + 1) - 260, rot: wob[k] });

  function apply(b, slot) {
    b.el.style.left = `${(slot.x / W) * 100}%`;
    b.el.style.top = `${(slot.y / H) * 100}%`;
    b.el.style.width = `${(size / W) * 100}%`;
    b.el.style.height = `${(size / H) * 100}%`;
    b.el.style.transform = `rotate(${slot.rot}deg)`;
    b.rot = slot.rot;
  }

  function move(b, slot, { delay = 0, bounce = 0.3 } = {}) {
    const r0 = b.el.getBoundingClientRect();
    const rot0 = b.rot;
    b.anim?.cancel();
    b.anim = null;
    apply(b, slot);
    if (reduced) return;
    const r1 = b.el.getBoundingClientRect();
    const dx = r0.left + r0.width / 2 - (r1.left + r1.width / 2);
    const dy = r0.top + r0.height / 2 - (r1.top + r1.height / 2);
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && rot0 === slot.rot) return;
    b.anim = animate(
      b.el,
      { transform: [`translate(${dx}px, ${dy}px) rotate(${rot0}deg)`, `translate(0px, 0px) rotate(${slot.rot}deg)`] },
      { type: "spring", bounce, duration: 0.65, delay },
    );
  }

  function setInteractive(on) {
    interactive = on;
    host.classList.toggle("is-playable", on);
    blocks.forEach((b) => { b.el.disabled = !on; });
  }

  function play(b) {
    audio.play("note", b.el, b.i);
    noteGlyph(host, b.el, "♪");
  }

  function addToStack(b) {
    if (stack.includes(b)) return;
    stack.push(b);
    b.el.classList.remove("waiting");
    move(b, stackSlot(stack.length - 1), { bounce: 0.35 });
    play(b);
    onAdd?.(stack.length);
    if (stack.length === 5 && stack.every((s, k) => s.i === k)) {
      setTimeout(playTune, 520);
    }
  }

  function playTune() {
    [0, 1, 2, 3, 4, 4].forEach((n, k) => {
      setTimeout(() => {
        const b = blocks[n];
        audio.play("note", b.el, n);
        noteGlyph(host, b.el, k === 5 ? "♫" : "♪");
        if (!reduced) b.el.animate([{ translate: "0 0" }, { translate: "0 -8%" }, { translate: "0 0" }], { duration: 260, easing: "ease-out" });
      }, k * 300);
    });
    setTimeout(() => onTune?.(), 1900);
  }

  function topple(byUser) {
    const fallen = [...stack].reverse();
    stack = [];
    fallen.forEach((b, k) => {
      setTimeout(() => {
        audio.play("note", b.el, b.i);
        noteGlyph(host, b.el, "♪");
      }, k * 120);
      move(b, pileSlot(b.i), { delay: k * 0.07, bounce: 0.45 });
    });
    blocks.forEach((b) => { if (!fallen.includes(b)) move(b, pileSlot(b.i)); b.el.classList.remove("waiting"); });
    onTopple?.(byUser);
  }

  function tap(b) {
    if (!interactive) return;
    const k = stack.indexOf(b);
    if (k === -1) addToStack(b);
    else if (k === 0 && stack.length >= 2) topple(true);
    else {
      play(b);
      if (!reduced) b.el.animate([{ translate: "0 0" }, { translate: "0 -10%" }, { translate: "0 0" }], { duration: 240, easing: "ease-out" });
    }
  }

  // pointer: tap or drag a pile block onto the stack
  blocks.forEach((b) => {
    let start = null;
    let dragging = false;
    b.el.addEventListener("pointerdown", (e) => {
      if (!interactive || e.button > 0) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      dragging = false;
      b.el.setPointerCapture(e.pointerId);
    });
    b.el.addEventListener("pointermove", (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) > 8 && !stack.includes(b)) {
        dragging = true;
        b.anim?.cancel();
        b.el.classList.add("dragging");
      }
      if (dragging) b.el.style.transform = `translate(${dx}px, ${dy}px) rotate(${b.rot}deg) scale(1.06)`;
    });
    const end = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const wasDrag = dragging;
      start = null;
      dragging = false;
      b.el.classList.remove("dragging");
      if (!wasDrag) {
        if (e.type === "pointerup") tap(b);
        return;
      }
      const hr = host.getBoundingClientRect();
      const ux = ((e.clientX - hr.left) / hr.width) * W;
      const uy = ((e.clientY - hr.top) / hr.height) * H;
      if (e.type === "pointerup" && Math.abs(ux - cx) < size * 1.1 && uy < ground + 10) addToStack(b);
      else move(b, pileSlot(b.i));
    };
    b.el.addEventListener("pointerup", end);
    b.el.addEventListener("pointercancel", end);
    // keyboard (Enter / Space) produces a click with detail 0
    b.el.addEventListener("click", (e) => { if (e.detail === 0) tap(b); });
  });

  // initial layout
  if (scripted) {
    blocks.forEach((b, k) => { apply(b, waitSlot(k)); b.el.classList.add("waiting"); });
  } else {
    blocks.forEach((b) => apply(b, pileSlot(b.i)));
  }
  setInteractive(interactive);

  return {
    /** Scripted mode: n blocks stacked (0-5), or "fallen". */
    setScripted(next) {
      if (next === mode) return;
      const prev = mode;
      mode = next;
      if (next === "fallen") {
        // build anything missing instantly, then knock it all over
        blocks.forEach((b, k) => { if (!stack.includes(b)) { stack[k] = b; b.el.classList.remove("waiting"); apply(b, stackSlot(k)); } });
        stack = blocks.slice();
        topple(false);
        setInteractive(true);
        return;
      }
      setInteractive(false);
      if (prev === "fallen" || typeof prev !== "number") {
        stack = [];
        blocks.forEach((b, k) => { b.el.classList.add("waiting"); move(b, waitSlot(k)); });
      }
      const n = next;
      blocks.forEach((b, k) => {
        if (k < n && !stack.includes(b)) {
          stack[k] = b;
          b.el.classList.remove("waiting");
          move(b, stackSlot(k), { bounce: 0.35 });
          audio.ambient("note", k);
        } else if (k >= n && stack.includes(b)) {
          stack.splice(stack.indexOf(b), 1);
          b.el.classList.add("waiting");
          move(b, waitSlot(k));
        }
      });
      stack = stack.filter(Boolean);
    },
    relayout() {
      blocks.forEach((b) => { b.anim?.cancel(); apply(b, { x: parseFloat(b.el.style.left) * W / 100, y: parseFloat(b.el.style.top) * H / 100, rot: b.rot }); });
    },
  };
}
