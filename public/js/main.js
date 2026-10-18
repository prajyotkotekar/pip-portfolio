// Pip's homepage: wires every part together. Each part starts on its own, so one hiccup can't
// take the rest of the nursery down with it.
import { motionPrefs, pick } from "./state.js";
import { audio } from "./audio.js";
import { createPip, registerSpeakers } from "./pip.js";
import { initSettings } from "./settings.js";
import { initIdle } from "./idle.js";
import { initSparkles } from "./sparkle.js";
import { initCounter } from "./counter.js";
import { initGuestbook } from "./guestbook.js";
import { initSpin } from "./spin.js";
import { initProjects, greet } from "./projects.js";
import { initScene1 } from "./scenes/s1.js";
import { initScene2 } from "./scenes/s2.js";
import { initScene3 } from "./scenes/s3.js";
import { initScene4 } from "./scenes/s4.js";
import { initScene5 } from "./scenes/s5.js";
import { initScene6 } from "./scenes/s6.js";
import { initScene7 } from "./scenes/s7.js";
import { initCardFade } from "./scenes/common.js";

function safely(fn) {
  try {
    const out = fn();
    if (out && typeof out.catch === "function") out.catch(() => {});
  } catch {
    /* keep the rest of the page working */
  }
}

const GIGGLES = ["Hee! Again!", "Hee! Again!", "Hee hee! Socks!", "Hee! Spoon!"];

function initPips() {
  const heroHost = document.getElementById("hero-pip");
  const pocketHost = document.getElementById("pocket-pip");
  const night = document.documentElement.dataset.theme === "night";
  const hero = createPip(heroHost, { variant: "full", mood: night ? "sleepy" : "awake" });
  const pocket = createPip(pocketHost, { variant: "pocket", mood: night ? "sleepy" : "awake", bubble: "below" });
  registerSpeakers(hero, pocket);
  const hint = document.querySelector(".hint");
  heroHost.addEventListener("click", () => {
    hero.giggle(pick(GIGGLES));
    hint?.classList.add("gone");
  });
  pocketHost.addEventListener("click", () => pocket.giggle("Hee! Again!"));
}

function initTitleBlocks() {
  document.querySelectorAll(".blocks-title .lb").forEach((lb) => {
    lb.addEventListener("click", () => {
      audio.play("note", lb, Number(lb.dataset.note));
      if (motionPrefs.reduced) return;
      lb.classList.remove("bonk");
      void lb.offsetWidth;
      lb.classList.add("bonk");
    });
  });
}

function initRing() {
  const rooms = ["hello", "scene-1", "scene-2", "scene-3", "scene-4", "scene-5", "scene-6", "scene-7", "made", "wishes"];
  const go = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: motionPrefs.reduced ? "auto" : "smooth", block: "start" });
  };
  document.querySelectorAll("[data-ring]").forEach((btn) => {
    btn.addEventListener("click", () => {
      audio.play("click", btn);
      const kind = btn.dataset.ring;
      if (kind === "prev") go("wishes");
      else if (kind === "next") go("hello");
      else go(pick(rooms.slice(0, -1)));
    });
  });
}

safely(initSettings);
safely(initPips);
safely(initTitleBlocks);
const sections = {
  1: initScene1, 2: initScene2, 3: initScene3, 4: initScene4, 5: initScene5, 6: initScene6, 7: initScene7,
};
Object.entries(sections).forEach(([n, init]) => {
  const el = document.getElementById(`scene-${n}`);
  if (el) safely(() => init(el));
});
safely(initCardFade);
safely(initProjects);
safely(initGuestbook);
safely(initCounter);
safely(initSparkles);
safely(initSpin);
safely(initIdle);
safely(initRing);
safely(greet);
document.documentElement.classList.add("js-ready");
