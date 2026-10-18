// The Easter egg: the crickets' postcard. It arrives on a real Tuesday, or when you tear the wall
// calendar until it says TUESDAY. Confetti, the crickets come home sunburnt, and Pip gets LOUD.
import confetti from "../vendor/confetti.module.mjs";
import { store, h, motionPrefs, bus } from "./state.js";
import { audio } from "./audio.js";
import { speak } from "./pip.js";
import { crickets } from "./crickets.js";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

let postcard = null;
let fired = false;

export function postcardMarkup() {
  return `
    <span class="postcard__inner">
      <span class="postcard__face postcard__front">
        <svg viewBox="0 0 300 190" aria-hidden="true" focusable="false">
          <rect width="300" height="190" fill="#bfe0f2"/>
          <circle cx="240" cy="44" r="24" fill="#ffd66b"/>
          <path d="M0 104q25-10 50 0t50 0 50 0 50 0 50 0 50 0V190H0z" fill="#7fb6d6"/>
          <path d="M0 120q25-8 50 0t50 0 50 0 50 0 50 0 50 0" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>
          <path d="M0 150q80-26 170-8t130-6V190H0z" fill="#f6deb0"/>
          <g transform="translate(40 128) scale(.9)"><use href="#cricket" width="64" height="46" style="--cr-nose:#ef6f7a"/><use href="#sunhat" width="64" height="46"/></g>
          <g transform="translate(110 138) scale(.8)"><use href="#cricket" width="64" height="46" style="--cr-nose:#ef6f7a"/><use href="#sunhat" width="64" height="46"/></g>
          <g transform="translate(176 130) scale(.85)"><use href="#cricket" width="64" height="46" style="--cr-nose:#ef6f7a"/><use href="#sunhat" width="64" height="46"/></g>
          <text x="16" y="34" class="postcard__title">Greetings from the seaside!</text>
        </svg>
      </span>
      <span class="postcard__face postcard__back">
        <span class="postcard__msg">Dear Pip, the sea never stops talking. You would LOVE it. Home soon. — The Crickets.<br><br>P.S. Bramble still has one of our chirps, please ask for it back.</span>
        <span class="postcard__addr"><span class="postcard__stamp" aria-hidden="true">🦗</span>To: Pip<br>The Midnight Nursery<br>Lantern Lane</span>
      </span>
    </span>`;
}

function pinPostcard({ animateIn = true } = {}) {
  if (!postcard) return;
  postcard.hidden = false;
  postcard.classList.add("is-pinned");
  if (animateIn && !motionPrefs.reduced) {
    postcard.animate(
      [{ opacity: 0, transform: "translateY(-30px) rotate(-14deg) scale(0.96)" }, { opacity: 1, transform: "translateY(0) rotate(-4deg) scale(1)" }],
      { duration: 650, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  }
}

export function triggerEgg(origin) {
  crickets.setBack(true);
  pinPostcard({ animateIn: !fired });
  store.set("pip-postcard", true);
  if (!motionPrefs.reduced) {
    const r = origin?.getBoundingClientRect?.();
    const o = r ? { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } : { x: 0.5, y: 0.4 };
    confetti({
      particleCount: 120, spread: 80, startVelocity: 38, origin: o, ticks: 220, scalar: 0.9,
      colors: ["#ffbe1a", "#f2a6bf", "#c9b6e4", "#bfe3c0", "#ffd1a6", "#a34063"],
      disableForReducedMotion: true,
    });
  }
  audio.play("hooray", origin);
  setTimeout(() => audio.ambient("chirp"), 500);
  setTimeout(() => audio.ambient("chirp"), 800);
  speak("HEE! They're back! It's LOUD!", { giggle: true, ms: 4200 });
  fired = true;
  bus.emit("egg");
}

/** The tear-off wall calendar. Starts on today; each click tears one page. */
export function mountCalendar(host) {
  const day = new Date();
  const btn = h("button", { type: "button", class: "calendar" });
  btn.innerHTML = `<span class="calendar__rings" aria-hidden="true"></span><span class="calendar__page"><span class="calendar__month"></span><span class="calendar__date"></span><span class="calendar__day"></span></span>`;
  const page = btn.querySelector(".calendar__page");
  const label = () => `Tear-off calendar. It says ${DAYS[day.getDay()].toLowerCase()} ${day.getDate()}. Click to tear off a page.`;
  const paint = () => {
    btn.querySelector(".calendar__month").textContent = MONTHS[day.getMonth()];
    btn.querySelector(".calendar__date").textContent = String(day.getDate());
    btn.querySelector(".calendar__day").textContent = DAYS[day.getDay()];
    btn.setAttribute("aria-label", label());
    btn.classList.toggle("is-tuesday", day.getDay() === 2);
  };
  paint();
  host.append(btn);

  btn.addEventListener("click", () => {
    if (!motionPrefs.reduced) {
      const torn = page.cloneNode(true);
      torn.classList.add("calendar__torn");
      torn.setAttribute("aria-hidden", "true");
      btn.append(torn);
      torn.animate(
        [{ transform: "translateY(0) rotate(0deg)", opacity: 1 }, { transform: "translate(18px, 70px) rotate(24deg)", opacity: 0 }],
        { duration: 600, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      ).finished.then(() => torn.remove(), () => torn.remove());
    }
    audio.play("tear", btn);
    day.setDate(day.getDate() + 1);
    paint();
    if (day.getDay() === 2) setTimeout(() => triggerEgg(btn), 250);
  });

  return btn;
}

export function initEgg(postcardEl) {
  postcard = postcardEl;
  postcard.innerHTML = postcardMarkup();
  postcard.addEventListener("click", () => {
    const flipped = postcard.getAttribute("aria-pressed") !== "true";
    postcard.setAttribute("aria-pressed", String(flipped));
    audio.play("tear", postcard);
  });
  if (store.get("pip-postcard", false)) pinPostcard({ animateIn: false });
  if (new Date().getDay() === 2) setTimeout(() => triggerEgg(null), 1600);
}
