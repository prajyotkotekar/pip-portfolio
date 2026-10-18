// The dream-wish jar: a live guestbook wired to /api/guestbook.
// All text is rendered with textContent. Empty wishes, links and the 20 s cooldown are checked
// here first, so the server rarely has to say no. If the API is away, the jar says so softly.
import { store, h, motionPrefs } from "./state.js";
import { audio } from "./audio.js";
import { speak } from "./pip.js";

const STICKERS = [
  ["🌙", "moon"], ["⭐", "star"], ["🧸", "teddy"], ["🍼", "bottle"], ["🦔", "hedgehog"],
  ["🦆", "duck"], ["🦄", "unicorn"], ["🐭", "mouse"], ["🦗", "cricket"], ["☁️", "cloud"],
];
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|xyz|ru|top|info|biz|link|click)\b)/i;
const COOLDOWN = 20_000;
const SHOW_FIRST = 12;

function when(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days} nights ago`;
}

function slip(entry, i) {
  const li = h("li", { class: "slip" });
  li.style.setProperty("--tilt", `${[-2, 1.5, -1, 2.2, -1.6, 0.8][i % 6]}deg`);
  if (entry.sticker) li.append(h("span", { class: "slip__sticker", "aria-hidden": "true" }, entry.sticker));
  li.append(h("p", { class: "slip__msg" }, entry.message));
  const meta = h("p", { class: "slip__meta" });
  meta.append(h("span", { class: "slip__name" }, entry.name || "a sleepy visitor"), document.createTextNode(`, ${when(entry.createdAt)}`));
  li.append(meta);
  return li;
}

export function initGuestbook() {
  const form = document.getElementById("wish-form");
  const list = document.getElementById("wish-list");
  const status = document.getElementById("wish-status");
  const more = document.getElementById("wish-more");
  const msg = document.getElementById("wish-msg");
  const name = document.getElementById("wish-name");
  const site = document.getElementById("wish-site");
  const send = document.getElementById("wish-send");
  const count = document.getElementById("wish-count");
  const row = document.getElementById("sticker-row");
  if (!form || !list) return;

  // sticker picker (radio buttons)
  const none = h("label", { class: "sticker" });
  none.innerHTML = `<input type="radio" name="sticker" value="" checked><span>none</span>`;
  row.append(none);
  STICKERS.forEach(([emoji, label]) => {
    const l = h("label", { class: "sticker" });
    const input = h("input", { type: "radio", name: "sticker", value: emoji, "aria-label": label });
    const face = h("span", { "aria-hidden": "true" }, emoji);
    l.append(input, face);
    row.append(l);
  });

  let entries = [];
  let expanded = false;

  function render() {
    list.replaceChildren();
    list.setAttribute("aria-busy", "false");
    if (!entries.length) {
      list.append(h("li", { class: "slip slip--empty" }, "Be the first to leave Pip a dream wish."));
      more.hidden = true;
      return;
    }
    const shown = expanded ? entries : entries.slice(0, SHOW_FIRST);
    shown.forEach((e, i) => list.append(slip(e, i)));
    more.hidden = expanded || entries.length <= SHOW_FIRST;
  }

  function soft(text) {
    list.replaceChildren(h("li", { class: "slip slip--empty" }, text));
    list.setAttribute("aria-busy", "false");
    more.hidden = true;
  }

  async function load() {
    list.setAttribute("aria-busy", "true");
    soft("Pip is unscrewing the lid…");
    try {
      const res = await fetch("/api/guestbook", { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      entries = Array.isArray(data.entries) ? data.entries : [];
      render();
    } catch {
      soft("The jar's lid is stuck right now, so the wishes are hiding. Try again in a little while.");
    }
  }

  more.addEventListener("click", () => { expanded = true; render(); });
  msg.addEventListener("input", () => { count.textContent = `${Array.from(msg.value).length} / 160`; });

  let cooldownTimer = 0;
  function startCooldown(seconds) {
    const until = Date.now() + seconds * 1000;
    store.set("pip-wish-at", Date.now() - (COOLDOWN - seconds * 1000));
    send.disabled = true;
    clearInterval(cooldownTimer);
    const tick = () => {
      const left = Math.ceil((until - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(cooldownTimer);
        send.disabled = false;
        send.textContent = "Drop it in the jar";
        return;
      }
      send.textContent = `One wish at a time (${left} s)`;
    };
    tick();
    cooldownTimer = setInterval(tick, 1000);
  }
  const lastAt = store.get("pip-wish-at", 0);
  if (Date.now() - lastAt < COOLDOWN) startCooldown(Math.ceil((COOLDOWN - (Date.now() - lastAt)) / 1000));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = msg.value.trim();
    if (!message) {
      status.textContent = "Pip can't hear an empty wish. Write something in the box.";
      msg.focus();
      return;
    }
    if (LINK.test(message)) {
      status.textContent = "No links please, just wishes.";
      msg.focus();
      return;
    }
    if (send.disabled) return;
    const sticker = form.querySelector('input[name="sticker"]:checked')?.value || null;
    send.disabled = true;
    status.textContent = "Folding your wish into the jar…";
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ name: name.value.trim(), message, sticker, website: site.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) {
        if (data.entry) entries = [data.entry, ...entries.filter((x) => x.id !== data.entry.id)];
        render();
        const first = list.firstElementChild;
        if (first && !motionPrefs.reduced) first.animate([{ opacity: 0, transform: "translateY(-12px) scale(0.97)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
        status.textContent = "Your wish is in the jar. Pip will read it slowly, with his finger.";
        msg.value = "";
        count.textContent = "0 / 160";
        audio.play("ting", send);
        speak("Hee! A new wish!");
        startCooldown(COOLDOWN / 1000);
        return;
      }
      if (res.status === 429) {
        status.textContent = "One wish at a time. The jar needs a moment.";
        startCooldown(Number(data.retryAfter) || 20);
        return;
      }
      status.textContent = data.error || "That wish didn't fit in the jar. Try different words.";
      send.disabled = false;
    } catch {
      status.textContent = "The jar's lid is stuck, so your wish is still here. Try again in a little while.";
      send.disabled = false;
    }
  });

  load();
}
