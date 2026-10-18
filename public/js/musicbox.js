// The Lullaby Lab engine: one generative music box shared by Scene 4 and the project exhibit.
// It walks slowly over the five block notes, makes a new phrase each time, never repeats the
// previous phrase, and keeps going for as long as it has been wound.
import { audio, NOTES } from "./audio.js";
import { bus, pick } from "./state.js";

const MAX_WIND = 90; // seconds of music a fully wound spring holds
const BEAT = 0.62; // seconds, slow like a yawn

let remaining = 0;
let playing = false;
let timers = [];
let lastSig = "";
let phraseNo = 0;
let pos = 2; // where the random walk currently is (index into NOTES)
let paused = false;

function makePhrase() {
  for (let attempt = 0; attempt < 12; attempt++) {
    const length = pick([4, 5, 5, 6]);
    const notes = [];
    let p = pos;
    for (let i = 0; i < length; i++) {
      const step = pick([-2, -1, -1, 1, 1, 2, 0]);
      p += step;
      if (p < 0) p = 1;
      if (p > 4) p = 3;
      notes.push(p);
    }
    const lengths = notes.map((_, i) => (i === length - 1 ? pick([2, 3]) : pick([1, 1, 1, 1.5, 2])));
    const sig = notes.join("") + "|" + lengths.join(",");
    if (sig !== lastSig) {
      lastSig = sig;
      pos = notes[notes.length - 1];
      return notes.map((n, i) => ({ n, beats: lengths[i] }));
    }
  }
  // extremely unlikely, but make sure the phrase differs
  pos = (pos + 2) % 5;
  return makePhrase();
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function playPhrase() {
  if (paused) return;
  if (remaining <= 0) {
    stop();
    return;
  }
  const phrase = makePhrase();
  phraseNo++;
  bus.emit("mb:phrase", { notes: phrase.map((x) => x.n), number: phraseNo });
  let t = 0;
  phrase.forEach((item, k) => {
    const at = t;
    timers.push(setTimeout(() => {
      const last = k === phrase.length - 1;
      audio.musicNote(NOTES[item.n], last ? 0.13 : 0.11, last ? 2.6 : 1.8);
      bus.emit("mb:note", { n: item.n, k, last });
    }, at * 1000));
    t += item.beats * BEAT;
  });
  t += BEAT * 0.8; // a breath between phrases
  remaining -= t;
  bus.emit("mb:wind", { remaining: Math.max(0, remaining), max: MAX_WIND });
  timers.push(setTimeout(playPhrase, t * 1000));
}

function start() {
  if (playing) return;
  playing = true;
  bus.emit("mb:start");
  playPhrase();
}

function stop() {
  clearTimers();
  if (!playing) return;
  playing = false;
  remaining = 0;
  bus.emit("mb:wind", { remaining: 0, max: MAX_WIND });
  bus.emit("mb:stop");
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && playing) {
    paused = true;
    clearTimers();
  } else if (!document.hidden && paused) {
    paused = false;
    if (playing) playPhrase();
  }
});

export const musicbox = {
  MAX_WIND,
  get playing() { return playing; },
  get remaining() { return Math.max(0, remaining); },
  get phrases() { return phraseNo; },

  /** Add `seconds` of spring. Starts the music if it was quiet. */
  wind(seconds) {
    remaining = Math.min(MAX_WIND, remaining + seconds);
    bus.emit("mb:wind", { remaining, max: MAX_WIND });
    start();
  },

  /** Scene 7: "Ting… ting… and it stopped." Two last notes, then quiet. */
  windDown() {
    if (!playing) return false;
    clearTimers();
    [3, 1].forEach((n, i) => {
      timers.push(setTimeout(() => {
        audio.musicNote(NOTES[n], 0.08 - i * 0.03, 2.4);
        bus.emit("mb:note", { n, k: i, last: i === 1 });
      }, i * 1100));
    });
    timers.push(setTimeout(stop, 2400));
    return true;
  },

  stop,
};
