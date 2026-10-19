// Smooth wheel scrolling. The browser normally scrolls on its own thread while the story's
// drawings update a frame later, so pinned scenes seemed to swim and stutter. Here the wheel
// sets a target and the page eases toward it each frame, in step with everything that animates.
// Touch, keyboard, the scrollbar and jump links stay native; reduced motion turns this off.
import { motionPrefs } from "./state.js";

const EASE = 0.11; // share of the remaining distance covered per 60 fps frame
const LINE = 16;   // pixels per "line" when a mouse reports wheel steps in lines

/** true when something under the pointer can scroll in that direction itself (a textarea, a list) */
function innerScroller(el, dy) {
  for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const s = getComputedStyle(el);
    if (!/(auto|scroll)/.test(s.overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
    if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
  }
  return false;
}

export function initSmoothScroll() {
  if (motionPrefs.reduced) return;
  const root = document.documentElement;
  let target = scrollY;
  let current = scrollY;
  let raf = 0;
  let last = 0;
  let wrote = -1;

  const max = () => root.scrollHeight - innerHeight;

  function frame(now) {
    const dt = Math.min(64, now - (last || now - 16.7));
    last = now;
    // someone else moved the page (keyboard, scrollbar, a link): hand control back
    if (wrote >= 0 && Math.abs(scrollY - wrote) > 2) {
      target = current = scrollY;
      raf = 0;
      wrote = -1;
      return;
    }
    const k = 1 - Math.pow(1 - EASE, dt / 16.7);
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.4) current = target;
    wrote = Math.round(current);
    window.scrollTo({ top: current, behavior: "instant" });
    wrote = scrollY;
    if (current !== target) raf = requestAnimationFrame(frame);
    else { raf = 0; wrote = -1; last = 0; }
  }

  addEventListener("wheel", (e) => {
    if (e.defaultPrevented || e.ctrlKey || motionPrefs.reduced) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    let dy = e.deltaY * (e.deltaMode === 1 ? LINE : e.deltaMode === 2 ? innerHeight : 1);
    if (!dy || innerScroller(e.target, dy)) return;
    e.preventDefault();
    if (!raf) target = current = scrollY;
    target = Math.max(0, Math.min(max(), target + dy));
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }, { passive: false });

  // keep in step when the page moves without us
  addEventListener("scroll", () => { if (!raf) target = current = scrollY; }, { passive: true });
  addEventListener("resize", () => { target = Math.min(target, max()); }, { passive: true });
}
