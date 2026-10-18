// The baby monitor's hit counter: an odometer of rolling digits, wired to /api/hits.
// Counts once per browser session. If the API is away, it quietly shows a local count.
import { store, session, motionPrefs } from "./state.js";

const DIGITS = 7;

function buildOdometer(el) {
  const cols = [];
  for (let i = 0; i < DIGITS; i++) {
    const d = document.createElement("span");
    d.className = "odo-digit";
    d.setAttribute("aria-hidden", "true");
    const col = document.createElement("span");
    col.className = "odo-col";
    col.innerHTML = Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join("");
    col.style.transitionDelay = `${(DIGITS - i) * 70}ms`;
    d.append(col);
    el.append(d);
    cols.push(col);
  }
  return cols;
}

function show(cols, count) {
  const text = String(Math.max(0, count)).padStart(DIGITS, "0").slice(-DIGITS);
  cols.forEach((col, i) => { col.style.transform = `translateY(${-Number(text[i]) * 10}%)`; });
  const sr = document.getElementById("hits-text");
  if (sr) sr.textContent = `${count.toLocaleString("en")} dreams delivered`;
  document.querySelectorAll(".marquee__count").forEach((b) => { b.textContent = text; });
}

async function api(method) {
  const res = await fetch("/api/hits", { method, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  if (!Number.isFinite(data.count)) throw new Error("bad count");
  return data.count;
}

export async function initCounter() {
  const el = document.getElementById("odometer");
  if (!el) return;
  const cols = buildOdometer(el);
  if (motionPrefs.reduced) cols.forEach((c) => { c.style.transition = "none"; });

  const counted = session.get("pip-counted", false);
  let count;
  try {
    count = await api(counted ? "GET" : "POST");
    session.set("pip-counted", true);
    store.set("pip-last-count", count);
  } catch {
    // offline or no backend: a local count, so the monitor still has something to show
    const local = store.get("pip-local-count", store.get("pip-last-count", 0)) + (counted ? 0 : 1);
    store.set("pip-local-count", local);
    session.set("pip-counted", true);
    count = local;
  }
  const sr = document.getElementById("hits-text");
  if (sr) sr.textContent = `${count.toLocaleString("en")} dreams delivered`;
  // roll up when the monitor comes into view
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    requestAnimationFrame(() => show(cols, count));
  });
  io.observe(el);
}
