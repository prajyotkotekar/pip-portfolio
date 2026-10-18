// Pip's head in 3D (Zdog). Drag to spin. It sways gently on its own unless motion is reduced,
// and it only renders while it's on screen.
import { motionPrefs, bus } from "./state.js";

export function initSpin() {
  const canvas = document.getElementById("zdog-pip");
  const Z = window.Zdog;
  if (!canvas || !Z) {
    canvas?.closest(".spin")?.setAttribute("hidden", "");
    return;
  }
  const { TAU } = Z;
  let dragging = false;
  let idleSince = 0;

  const illo = new Z.Illustration({
    element: canvas,
    zoom: 5.4,
    dragRotate: true,
    rotate: { x: -0.12, y: 0.3 },
    onDragStart() { dragging = true; },
    onDragEnd() { dragging = false; idleSince = performance.now(); },
  });

  const head = new Z.Anchor({ addTo: illo, translate: { y: 8 } });
  const FACE = "#fbf5ec";
  const INK = "#4a3440";

  // skull face: a soft capsule, a little wider than tall
  new Z.Shape({ addTo: head, path: [{ x: -3 }, { x: 3 }], stroke: 42, color: FACE });

  // eye sockets with warm amber pinpricks
  const glows = [];
  [-1, 1].forEach((side) => {
    const eye = new Z.Anchor({ addTo: head, translate: { x: side * 8.9, y: 1.5, z: 18.6 }, rotate: { y: side * 0.45 } });
    new Z.Ellipse({ addTo: eye, width: 13.6, height: 14.6, fill: true, stroke: 1.5, color: "#33232c" });
    glows.push(new Z.Shape({ addTo: eye, translate: { x: -side * 0.6, y: 1.6, z: 0.8 }, stroke: 6.5, color: "rgba(255, 196, 90, 0.45)" }));
    new Z.Shape({ addTo: eye, translate: { x: -side * 0.6, y: 1.6, z: 1.3 }, stroke: 3.2, color: "#ffd98a" });
    new Z.Ellipse({ addTo: head, diameter: 5.5, fill: true, stroke: 1, color: "rgba(244, 161, 182, 0.75)", translate: { x: side * 14.5, y: 9.5, z: 14.8 }, rotate: { y: side * 0.78 } });
  });

  // nose and crooked smile
  new Z.Polygon({ addTo: head, sides: 3, radius: 1.9, fill: true, stroke: 1, color: INK, translate: { y: 8, z: 21.2 }, rotate: { z: TAU / 2 } });
  new Z.Shape({
    addTo: head,
    path: [{ x: -3.6, y: 0 }, { bezier: [{ x: -1, y: 2.6 }, { x: 2.6, y: 2.6 }, { x: 4.6, y: -0.6 }] }],
    closed: false, stroke: 1.3, color: INK, translate: { y: 12.4, z: 19.6 },
  });

  // nightcap: brim, dome, floppy tail and pom-pom
  const cap = new Z.Anchor({ addTo: head, rotate: { z: -0.12 } });
  new Z.Hemisphere({ addTo: cap, diameter: 41, color: "#f7ecd6", backface: "#efe1c4", translate: { y: -9 }, rotate: { x: TAU / 4 } });
  new Z.Ellipse({ addTo: cap, diameter: 41, stroke: 6.5, color: "#efe1c4", translate: { y: -9 }, rotate: { x: TAU / 4 } });
  // the floppy end: a chain of shrinking soft spheres that flops over to the left
  const tail = [
    [0, -29, -2, 19], [-5, -34.5, -3, 16], [-11.5, -37.5, -3.5, 14], [-18.5, -37, -4, 12.5], [-24.5, -33.5, -4, 11],
    [-28.5, -28, -3.5, 10], [-31, -21.5, -3, 9], [-32, -14.5, -2, 8],
  ];
  tail.forEach(([x, y, z, s]) => new Z.Shape({ addTo: cap, translate: { x, y, z }, stroke: s, color: "#f7ecd6" }));
  new Z.Shape({ addTo: cap, translate: { x: -32, y: -6, z: -1 }, stroke: 11, color: "#efe1c3" });
  // gold stars dotted over the dome
  for (let i = 0; i < 9; i++) {
    const az = (i / 9) * TAU + 0.3;
    const pol = 0.55 + (i % 3) * 0.28;
    const r = 20.8;
    new Z.Shape({
      addTo: cap,
      translate: { x: Math.sin(pol) * Math.cos(az) * r, y: -9 - Math.cos(pol) * r, z: Math.sin(pol) * Math.sin(az) * r },
      stroke: 2.6, color: "#e3b048",
    });
  }
  // the pink bow, front left of the brim
  const bow = new Z.Anchor({ addTo: cap, translate: { x: -13, y: -10, z: 15 }, rotate: { y: -0.7 } });
  new Z.Shape({ addTo: bow, path: [{ x: -1 }, { x: -5, y: -1.5 }], stroke: 4.6, color: "#f4a3bc" });
  new Z.Shape({ addTo: bow, path: [{ x: 1 }, { x: 5, y: -1.5 }], stroke: 4.6, color: "#f4a3bc" });
  new Z.Shape({ addTo: bow, stroke: 3.4, color: "#ef8fae", translate: { z: 0.6 } });

  const setGlow = (theme) => glows.forEach((g) => { g.color = theme === "night" ? "rgba(255, 196, 90, 0.75)" : "rgba(255, 196, 90, 0.45)"; });
  setGlow(document.documentElement.dataset.theme);
  bus.on("theme", setGlow);

  let visible = false;
  let raf = 0;
  let t = 0;
  function frame() {
    raf = 0;
    if (!visible || document.hidden) return;
    const chaos = document.documentElement.classList.contains("chaos");
    if (!motionPrefs.reduced && !dragging && performance.now() - idleSince > 1500) {
      if (chaos) illo.rotate.y += 0.06;
      else {
        // a gentle sway around wherever you left it, no drift
        const before = Math.sin(t) * 0.38;
        t += 0.014;
        illo.rotate.y += Math.sin(t) * 0.38 - before;
      }
    }
    illo.updateRenderGraph();
    raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }).observe(canvas);
  document.addEventListener("visibilitychange", wake);
  illo.updateRenderGraph();
}
