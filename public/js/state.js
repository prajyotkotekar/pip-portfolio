// Small shared helpers: safe storage, a tiny event bus, motion preferences and maths.

function safeStore(kind) {
  return {
    get(key, fallback = null) {
      try {
        const raw = window[kind].getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window[kind].setItem(key, JSON.stringify(value));
      } catch {
        /* private mode or blocked storage: nothing to remember */
      }
    },
  };
}

export const store = safeStore("localStorage");
export const session = safeStore("sessionStorage");

const hub = new EventTarget();
export const bus = {
  on(type, fn) {
    const handler = (e) => fn(e.detail);
    hub.addEventListener(type, handler);
    return () => hub.removeEventListener(type, handler);
  },
  emit(type, detail) {
    hub.dispatchEvent(new CustomEvent(type, { detail }));
  },
};

const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
const fineQuery = matchMedia("(hover: hover) and (pointer: fine)");
export const motionPrefs = {
  get reduced() { return reduceQuery.matches; },
  get finePointer() { return fineQuery.matches; },
};

export const M = window.Motion || null;

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
/** progress of p through the window [a, b], clamped to 0..1 */
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** Motion's animate with a quiet fallback, so a missing library never throws. */
export function animate(el, keyframes, options) {
  if (M && el) {
    try {
      return M.animate(el, keyframes, options);
    } catch {
      /* fall through */
    }
  }
  return { finished: Promise.resolve(), stop() {}, cancel() {} };
}

/** Run fn whenever an element enters/leaves the viewport. */
export function watchVisible(el, fn, margin = "0px") {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => fn(entry.isIntersecting, entry));
  }, { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}

/** Threshold helper: calls onEnter / onLeave once each time p crosses `at`. */
export function crossing(at, onEnter, onLeave) {
  let inside = false;
  return (p) => {
    const now = p >= at;
    if (now !== inside) {
      inside = now;
      (now ? onEnter : onLeave)?.();
    }
  };
}

export const svgNS = "http://www.w3.org/2000/svg";
export function svg(markup, attrs = {}) {
  const el = document.createElementNS(svgNS, "svg");
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  el.innerHTML = markup;
  return el;
}

export function h(tag, attrs = {}, text) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v;
    else el.setAttribute(k, v);
  });
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Place an absolutely positioned element inside a square art box, in viewBox units (0-600). */
export function place(el, x, y, w, hgt, size = 600) {
  el.style.left = `${(x / size) * 100}%`;
  el.style.top = `${(y / size) * 100}%`;
  if (w !== undefined) el.style.width = `${(w / size) * 100}%`;
  if (hgt !== undefined) el.style.height = `${(hgt / size) * 100}%`;
  return el;
}
