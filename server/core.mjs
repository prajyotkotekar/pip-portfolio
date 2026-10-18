// Guestbook ("dream wishes") and hit counter logic, independent of where the data lives.
// A store is anything with async get(key) and set(key, value).

export const LIMITS = Object.freeze({
  name: 24,
  message: 160,
  stored: 200,
  listed: 50,
  cooldownMs: 20_000,
});

export const STICKERS = Object.freeze(["🌙", "⭐", "🧸", "🍼", "🦔", "🦆", "🦄", "🐭", "🦗", "☁️"]);

const DEFAULT_NAME = "a sleepy visitor";
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|xyz|ru|top|info|biz|link|click)\b)/i;
// Control characters, zero-width characters and bidi overrides, built from code points.
const INVISIBLE = new RegExp(
  `[${[[0x00, 0x08], [0x0b, 0x0c], [0x0e, 0x1f], [0x7f, 0x7f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x2064], [0xfeff, 0xfeff]]
    .map(([from, to]) => `${String.fromCharCode(from)}-${String.fromCharCode(to)}`)
    .join("")}]`,
  "g",
);

function clean(value, max) {
  const text = String(value ?? "")
    .replace(INVISIBLE, "")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(text).slice(0, max).join("").trim();
}

const fail = (status, error, extra = {}) => ({ ok: false, status, error, ...extra });

export function createGuestbook(store, { now = Date.now, limits = LIMITS } = {}) {
  async function entries() {
    const list = await store.get("guestbook");
    return Array.isArray(list) ? list : [];
  }

  return {
    async list() {
      return (await entries()).slice(0, limits.listed);
    },

    async add(input, clientId = "anon") {
      const body = input && typeof input === "object" ? input : {};

      // Bots fill every field; people never see this one.
      if (clean(body.website, 200)) return { ok: true, entry: null };

      const message = clean(body.message, limits.message);
      if (!message) return fail(400, "Pip can't hear an empty wish. Write something!");
      if (LINK.test(message)) return fail(400, "No links please, just wishes.");

      const t = now();
      const rate = (await store.get("rate")) ?? {};
      const last = rate[clientId] ?? 0;
      if (t - last < limits.cooldownMs) {
        return fail(429, "Shh, one wish at a time. Try again in a moment.", {
          retryAfter: Math.ceil((limits.cooldownMs - (t - last)) / 1000),
        });
      }

      const entry = {
        id: `${t.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        name: clean(body.name, limits.name) || DEFAULT_NAME,
        message,
        sticker: STICKERS.includes(body.sticker) ? body.sticker : null,
        createdAt: t,
      };

      await store.set("guestbook", [entry, ...(await entries())].slice(0, limits.stored));

      // Remember recent posters only, so the rate table stays small.
      const fresh = Object.fromEntries(
        Object.entries(rate).filter(([, at]) => t - at < limits.cooldownMs),
      );
      fresh[clientId] = t;
      await store.set("rate", fresh);

      return { ok: true, entry };
    },
  };
}

export function createCounter(store) {
  const read = async () => {
    const value = Number(await store.get("hits"));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  };
  return {
    get: read,
    async hit() {
      const next = (await read()) + 1;
      await store.set("hits", next);
      return next;
    },
  };
}
