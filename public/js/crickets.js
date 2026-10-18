// The crickets' chirping. It only plays while a cricket scene is on screen, one chirp per
// cricket still at home, so each cricket that leaves (Scene 2) takes its chirp with it.
// After the Easter egg they come back and chirp softly across the whole page.
import { audio } from "./audio.js";

const zones = new Map();
let present = 5;
let back = false;

export const crickets = {
  registerZone(section, id) {
    zones.set(id, false);
    new IntersectionObserver(([e]) => zones.set(id, e.isIntersecting)).observe(section);
  },
  setPresent(n) {
    present = n;
  },
  get back() {
    return back;
  },
  setBack(value) {
    back = value;
    document.documentElement.classList.toggle("crickets-back", value);
  },
};

setInterval(() => {
  if (document.hidden) return;
  const inZone = [...zones.values()].some(Boolean);
  let count = 0;
  let chance = 0.24;
  if (back) {
    count = inZone ? 5 : 2;
    chance = inZone ? 0.3 : 0.18;
  } else if (inZone) {
    count = present;
  }
  for (let i = 0; i < count; i++) {
    if (Math.random() < chance) setTimeout(() => audio.ambient("chirp"), Math.random() * 700);
  }
}, 950);
