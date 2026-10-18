// Scene 6: The Long Way Round the Weathervane. The crayon map's dotted route draws itself as you
// scroll and Pip's cloud wobbles along behind it. Click the roofs to drop the dreams.
import { seg, h } from "../state.js";
import { onProgress, markScene } from "./common.js";
import { createMap } from "../map.js";

export function initScene6(section) {
  const stage = section.querySelector(".stage");
  const box = h("div", { class: "art s6-map" });
  stage.append(box);
  const map = createMap(box, { mode: "scroll" });
  onProgress(section, (p, m) => {
    map.setDrawn(seg(p, Math.max(0, m[1] - 0.07), m[3] + 0.03));
  });
  markScene(section, 6);
}
