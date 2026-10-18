// The silence timer. Pip hates silence: about 5 seconds of stillness and his toes start to itch.
// In the last scene it's reversed: he just falls asleep and snores a tiny "pip… pip…".
import { bus } from "./state.js";
import { speaker, mainPips } from "./pip.js";
import { musicbox } from "./musicbox.js";
import { audio } from "./audio.js";

const LINES = [
  "Hello? Say something. A cough is fine.",
  "Is it Tuesday yet?",
  "Hello? Say something. A cough is fine.",
  "Cozy is a whole job, actually.",
];
const IDLE_MS = 5000;

export function initIdle() {
  let last = performance.now();
  let fired = null;
  let count = 0;

  const wake = () => {
    last = performance.now();
    if (!fired) return;
    const was = fired;
    fired = null;
    if (was.kind === "sleep") {
      const { pocket } = mainPips();
      pocket?.setMood(document.documentElement.dataset.theme === "night" ? "sleepy" : "awake");
      return;
    }
    if (was.kind === "complain") was.pip?.giggle("Hee! There you are.");
  };

  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach((type) =>
    addEventListener(type, wake, { passive: true }),
  );

  setInterval(() => {
    if (fired || document.hidden || performance.now() - last < IDLE_MS) return;
    const scene = document.documentElement.dataset.scene;
    const pip = speaker();
    if (scene === "7") {
      fired = { kind: "sleep" };
      const { pocket } = mainPips();
      pocket?.setMood("asleep");
      audio.ambient("snore");
      bus.emit("idle:sleep");
      return;
    }
    if (musicbox.playing) {
      fired = { kind: "hum" };
      pip?.say("♪ hmm hmm hmmm ♪");
      return;
    }
    fired = { kind: "complain", pip };
    pip?.fidget();
    pip?.say(LINES[count % LINES.length], 3800);
    count++;
  }, 500);
}
