// Sparkle cursor trail: little stars that fall off the mouse pointer. Mouse only; off with
// reduced motion. The animation loop only runs while there are sparkles to draw.
import { motionPrefs, rand } from "./state.js";

const COLOURS = ["#ffbe1a", "#ffd66b", "#c9b6e4", "#f2a6bf", "#fff3c4"];
const CHAOS = ["#ff6fb5", "#ffd23f", "#3ec1ff", "#7be07b", "#b98cff"];

export function initSparkles() {
  const canvas = document.getElementById("sparkles");
  if (!canvas || motionPrefs.reduced) return;
  const ctx = canvas.getContext("2d");
  const parts = [];
  let raf = 0;
  let dpr = 1;
  let lastSpawn = 0;

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  };
  resize();
  addEventListener("resize", resize, { passive: true });

  function star(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + (i * Math.PI) / 4;
      const rr = i % 2 ? r * 0.38 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }

  function frame(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const t = (now - p.born) / p.life;
      if (t >= 1) {
        parts.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.035;
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = p.c;
      star(p.x, p.y, p.r * (1 - t * 0.5), p.rot + t * 2);
    }
    ctx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(frame) : 0;
  }

  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse" || !motionPrefs.finePointer || document.hidden) return;
      const now = performance.now();
      const chaos = document.documentElement.classList.contains("chaos");
      if (now - lastSpawn < (chaos ? 16 : 34)) return;
      lastSpawn = now;
      const palette = chaos ? CHAOS : COLOURS;
      const n = chaos ? 2 : 1;
      for (let k = 0; k < n && parts.length < 60; k++) {
        parts.push({
          x: e.clientX + rand(-4, 4), y: e.clientY + rand(-4, 4),
          vx: rand(-0.6, 0.6), vy: rand(-0.4, 0.4),
          r: rand(3, chaos ? 8 : 6), rot: rand(0, 3), c: palette[Math.floor(Math.random() * palette.length)],
          born: now, life: rand(550, 850),
        });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    },
    { passive: true },
  );
}
