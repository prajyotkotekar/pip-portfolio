// The three switches in the top bar: sound, the big light (day/night) and chaos mode.
import { store, bus } from "./state.js";
import { audio } from "./audio.js";
import { speak } from "./pip.js";

const root = document.documentElement;

export function setTheme(theme, { save = true } = {}) {
  root.dataset.theme = theme;
  const btn = document.getElementById("btn-light");
  btn?.setAttribute("aria-pressed", String(theme === "day"));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "night" ? "#1d1530" : "#fff8f1");
  if (save) store.set("pip-theme", theme);
  bus.emit("theme", theme);
}

export function initSettings() {
  // sound
  const sound = document.getElementById("btn-sound");
  const tip = document.getElementById("shh-tip");
  const syncSound = () => sound.setAttribute("aria-pressed", String(audio.muted));
  syncSound();
  sound.addEventListener("click", () => {
    audio.setMuted(!audio.muted);
    syncSound();
    if (!audio.muted) audio.play("ting", sound);
    tip.classList.add("show");
    clearTimeout(tip._t);
    tip._t = setTimeout(() => tip.classList.remove("show"), 2400);
  });
  sound.addEventListener("mouseleave", () => tip.classList.remove("show"));

  // the big light
  const light = document.getElementById("btn-light");
  setTheme(root.dataset.theme === "night" ? "night" : "day", { save: false });
  light.addEventListener("click", () => {
    const next = root.dataset.theme === "night" ? "day" : "night";
    setTheme(next);
    audio.play("bigClick", light);
  });
  document.getElementById("badge-night")?.addEventListener("click", () => {
    setTheme("night");
    audio.play("bigClick", document.getElementById("badge-night"));
  });

  // chaos mode
  const chaos = document.getElementById("btn-chaos");
  chaos.addEventListener("click", () => {
    const on = !root.classList.contains("chaos");
    root.classList.toggle("chaos", on);
    chaos.setAttribute("aria-pressed", String(on));
    audio.play(on ? "hooray" : "click", chaos);
    if (on) speak("Wheee! It's 1999 in here!");
    bus.emit("chaos", on);
  });
}
