// Little SVG drawing helpers for Lantern Lane. Everything returns markup strings.

const INK = "#22183a";

/** Seeded random, so the scenery looks the same on every visit. */
export function seeded(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function stars(n, { x0 = -600, x1 = 1200, y0 = -400, y1 = 330, seed = 3, cls = "twk" } = {}) {
  const r = seeded(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    const s = 6 + r() * 12;
    const color = r() > 0.7 ? "#c9b6e4" : "#ffd66b";
    out += `<use href="#twinkle" class="${cls}" style="--twinkle:${color};animation-delay:${(-r() * 4).toFixed(2)}s" x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(0)}" height="${s.toFixed(0)}"/>`;
  }
  return out;
}

/** Front view of a house. Windows are drawn separately so each one can change. */
export function house({ x, w, h, base = 470, roof = "#6a4a78", body = "#3e2f5c", roofH = 46, chimney = null, door = true }) {
  const top = base - h;
  return `<g class="house">
    ${chimney !== null ? `<rect x="${x + chimney}" y="${top - roofH * 0.8}" width="15" height="${roofH * 0.75}" fill="${roof}" stroke="${INK}" stroke-width="3"/>` : ""}
    <path d="M${x - 9} ${top + 3}L${x + w / 2} ${top - roofH}L${x + w + 9} ${top + 3}Z" fill="${roof}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${body}" stroke="${INK}" stroke-width="3"/>
    ${door ? `<path d="M${x + w / 2 - 11} ${base}v-24a11 11 0 0 1 22 0v24z" fill="#271d3d" stroke="${INK}" stroke-width="2"/>` : ""}
  </g>`;
}

/** Bramble's hedge, seen from the street. */
export function hedge(x, base, w = 130, hgt = 110) {
  return `<g class="hedge">
    <path d="M${x} ${base}C${x - 6} ${base - hgt * 0.6} ${x + w * 0.15} ${base - hgt} ${x + w * 0.5} ${base - hgt}C${x + w * 0.85} ${base - hgt} ${x + w + 6} ${base - hgt * 0.6} ${x + w} ${base}Z" fill="#3f6248" stroke="${INK}" stroke-width="3"/>
    <path d="M${x + 18} ${base - hgt * 0.55}q8-8 16 0M${x + w - 40} ${base - hgt * 0.7}q8-8 16 0M${x + w * 0.45} ${base - hgt * 0.85}q8-8 16 0" fill="none" stroke="#5c8a62" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

export function win({ x, y, w, h, id = "", round = false, cls = "win" }) {
  const shape = round
    ? `<ellipse class="${cls}" data-win="${id}" cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}"/>`
    : `<rect class="${cls}" data-win="${id}" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`;
  const bars = round
    ? `<path d="M${x + w / 2} ${y + 2}v${h - 4}M${x + 2} ${y + h / 2}h${w - 4}" class="win-bars"/>`
    : `<path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" class="win-bars"/>`;
  return `<g class="win-g" data-win-g="${id}">${shape}${bars}</g>`;
}

export function ground(y = 470, color = "#2c4134", blades = "#3f5f45") {
  let blade = "";
  for (let x = -700; x < 1300; x += 14) {
    blade += `M${x} ${y + 4}q3-14 7-16q-1 8 2 16`;
  }
  return `<rect x="-800" y="${y}" width="2200" height="900" fill="${color}"/>
    <path d="${blade}" fill="${blades}"/>`;
}

export function cricket(x, y, s = 1, { travel = false, cls = "" } = {}) {
  return `<g class="cricket ${cls}" transform="translate(${x} ${y}) scale(${s})">
    <g class="cricket__wiggle">
      <use href="#cricket" width="64" height="46"/>
      ${travel ? `<use href="#sunhat" class="cricket__hat" width="64" height="46"/><use href="#suitcase" width="64" height="46"/>` : `<use href="#sunhat" class="cricket__hat egg-only" width="64" height="46"/>`}
    </g>
  </g>`;
}

export function cloudShape(cx, cy, s = 1, fill = "#fffaf6", stroke = "#dcc0cd") {
  return `<path transform="translate(${cx} ${cy}) scale(${s})" d="M-86 22C-104 22-104-6-82-8C-84-30-56-40-40-26C-34-48-2-50 8-30C18-50 52-46 54-22C76-28 96-8 84 10C100 16 94 40 72 38C64 54 30 54 18 42C4 54-28 54-38 40C-54 50-82 44-86 22Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
}

/** Duckling lamp (three identical ones), Thimble's thimble lamp, Pip's cloud lamp. */
export function lampSVG(kind) {
  if (kind === "duck") {
    return `<svg viewBox="0 0 60 70" class="lamp-svg" aria-hidden="true" focusable="false">
      <ellipse class="lamp-glow" cx="30" cy="34" rx="30" ry="30"/>
      <rect x="14" y="56" width="32" height="10" rx="4" fill="#d9a87c" stroke="#5c4033" stroke-width="2.4"/>
      <path class="lamp-shade" d="M8 56C8 30 16 14 30 14S52 30 52 56Z" stroke="#5c4033" stroke-width="2.6"/>
      <path class="lamp-cut" d="M24 34a6 6 0 1 1 9 5l7 2q-4 7-13 6-8-1-8-7 0-3 5-6z"/>
      <circle cx="30" cy="10" r="4" fill="#ffd66b" stroke="#5c4033" stroke-width="2"/>
    </svg>`;
  }
  if (kind === "thimble") {
    return `<svg viewBox="0 0 60 70" class="lamp-svg" aria-hidden="true" focusable="false">
      <ellipse class="lamp-glow" cx="30" cy="36" rx="30" ry="30"/>
      <path class="lamp-shade" d="M12 62L16 22Q30 10 44 22L48 62Z" stroke="#5c4033" stroke-width="2.6"/>
      <g class="lamp-dots"><circle cx="22" cy="32" r="2.2"/><circle cx="30" cy="30" r="2.2"/><circle cx="38" cy="32" r="2.2"/><circle cx="20" cy="42" r="2.2"/><circle cx="28" cy="41" r="2.2"/><circle cx="36" cy="41" r="2.2"/><circle cx="42" cy="44" r="2.2"/><circle cx="19" cy="52" r="2.2"/><circle cx="27" cy="51" r="2.2"/><circle cx="35" cy="51" r="2.2"/><circle cx="43" cy="53" r="2.2"/></g>
      <rect x="9" y="60" width="42" height="7" rx="3" fill="#c9b6e4" stroke="#5c4033" stroke-width="2.2"/>
    </svg>`;
  }
  // Pip's cloud lamp
  return `<svg viewBox="0 0 60 70" class="lamp-svg" aria-hidden="true" focusable="false">
    <ellipse class="lamp-glow" cx="30" cy="36" rx="30" ry="30"/>
    <path d="M28 60V46" stroke="#5c4033" stroke-width="3"/>
    <rect x="18" y="58" width="22" height="8" rx="3" fill="#f2a6bf" stroke="#5c4033" stroke-width="2.2"/>
    <path class="lamp-shade" d="M12 44C2 44 4 30 14 30C14 18 30 14 36 24C46 18 58 28 52 38C58 44 52 48 46 46Z" stroke="#5c4033" stroke-width="2.6"/>
  </svg>`;
}

/** The shapes a lit lamp throws on the wall. */
export function wallShapes(kind, cx, cy, spread = 1) {
  const r = seeded(cx * 7 + cy);
  let out = "";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r() * 0.6;
    const d = (26 + r() * 34) * spread;
    const x = cx + Math.cos(a) * d * 1.4;
    const y = cy + Math.sin(a) * d * 0.8;
    const s = (10 + r() * 10) * spread;
    if (kind === "stars") out += `<use href="#twinkle" x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" style="--twinkle:#ffe2a0"/>`;
    else if (kind === "clouds") out += `<use href="#cloudlet" x="${x - s}" y="${y - s * 0.6}" width="${s * 2}" height="${s * 1.3}" opacity=".75"/>`;
    else if (kind === "hearts") out += `<path transform="translate(${x} ${y}) scale(${s / 12})" d="M0 3C-4-2-9 1-6 5L0 10 6 5C9 1 4-2 0 3Z" fill="#ffd0dd"/>`;
    else out += `<path transform="translate(${x} ${y}) scale(${s / 14})" d="M4-9A10 10 0 1 0 6 9 8 8 0 1 1 4-9Z" fill="#fff0c2"/>`;
  }
  return out;
}

/** Rattles: big round one, a small bell one, and the carrot. */
export function rattleSVG(kind) {
  if (kind === "carrot") {
    return `<svg viewBox="0 0 60 90" class="rattle-svg" aria-hidden="true" focusable="false">
      <path d="M22 18q-6-14 4-16 2 8 2 14M30 16q2-14 12-12-4 8-8 14M36 20q10-8 16-2-8 4-12 8" fill="#7fbf6a" stroke="#3f6b33" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M16 22Q30 14 44 22L32 86Q30 90 28 86Z" fill="#ff9f5a" stroke="#8a4a22" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M22 36h8M26 50h9M24 64h6" stroke="#c96a2c" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;
  }
  if (kind === "bell") {
    return `<svg viewBox="0 0 60 90" class="rattle-svg" aria-hidden="true" focusable="false">
      <rect x="26" y="36" width="8" height="42" rx="4" fill="#cdbdf0" stroke="#5a3d7a" stroke-width="2.4"/>
      <circle cx="30" cy="22" r="17" fill="#bfe3c0" stroke="#3f6b4c" stroke-width="2.6"/>
      <circle cx="30" cy="80" r="8" fill="#bfe3c0" stroke="#3f6b4c" stroke-width="2.4"/>
      <path d="M20 18q10-8 20 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 60 90" class="rattle-svg" aria-hidden="true" focusable="false">
    <rect x="25" y="40" width="10" height="44" rx="5" fill="#ffd1a6" stroke="#8a4a22" stroke-width="2.4"/>
    <circle cx="30" cy="26" r="23" fill="#f6b7c8" stroke="#8b3d5a" stroke-width="2.6"/>
    <circle cx="22" cy="20" r="3" fill="#fff"/><circle cx="36" cy="30" r="3" fill="#ffe58f"/><circle cx="30" cy="14" r="2.4" fill="#ffe58f"/><circle cx="40" cy="18" r="2.4" fill="#fff"/>
  </svg>`;
}

/** A small hinged music box for Scene 7 (the lid can sink shut). */
export function tinyMusicBox(x, y) {
  return `<g class="tiny-box" transform="translate(${x} ${y})">
    <rect x="0" y="22" width="86" height="46" rx="8" fill="#f8e6cf" stroke="#8b5e70" stroke-width="3"/>
    <rect x="-3" y="58" width="92" height="12" rx="5" fill="#f2b6c6" stroke="#8b5e70" stroke-width="3"/>
    <path d="M20 46q8-10 16 0t16 0 16 0" fill="none" stroke="#e3b048" stroke-width="2.4" stroke-linecap="round"/>
    <g class="tiny-lid"><rect x="-3" y="-6" width="92" height="28" rx="7" fill="#f2b6c6" stroke="#8b5e70" stroke-width="3"/><rect x="8" y="0" width="70" height="14" rx="4" fill="#fbe9d6" stroke="#e3b048" stroke-width="2"/></g>
  </g>`;
}
