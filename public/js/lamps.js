// The nightlights: shared by Scene 5 (find them in the dark) and the Nightlight Collection.
import { h } from "./state.js";
import { lampSVG } from "./art.js";
import { audio } from "./audio.js";

export const SHAPES = { lantern: "stars", thimble: "clouds", duck: "moons", cloud: "hearts" };

export function lampButton(kind, label) {
  const b = h("button", { type: "button", class: `lamp lamp--${kind}`, "aria-pressed": "false", "aria-label": label });
  b.innerHTML =
    kind === "lantern"
      ? `<span class="lamp__halo" aria-hidden="true"></span><img src="assets/img/pip_dream_lantern_cutout.webp" alt="" width="439" height="632" decoding="async">`
      : lampSVG(kind);
  return b;
}

export function setLit(b, on, { sound = true } = {}) {
  const was = b.classList.contains("is-lit");
  if (was === on) return;
  b.classList.toggle("is-lit", on);
  b.setAttribute("aria-pressed", String(on));
  if (sound) audio.play(on ? "ting" : "click", b);
}
