// One request handler for /api/*, shared by the dev server and the Netlify function.
import { createGuestbook, createCounter } from "./core.mjs";

const MAX_BODY = 2048;

export function createApi(store, options) {
  const guestbook = createGuestbook(store, options);
  const counter = createCounter(store);

  // request: { method, path, rawBody, clientId }  →  { status, body }
  return async function handleApi({ method, path, rawBody = "", clientId = "anon" }) {
    const route = path.replace(/\/+$/, "") || "/";

    const parse = () => {
      if (rawBody.length > MAX_BODY) return { error: "That wish is too long." };
      if (!rawBody) return { value: {} };
      try {
        return { value: JSON.parse(rawBody) };
      } catch {
        return { error: "Pip couldn't read that." };
      }
    };

    try {
      switch (route) {
        case "/api/health":
          return { status: 200, body: { ok: true } };

        case "/api/guestbook": {
          if (method === "GET") return { status: 200, body: { entries: await guestbook.list() } };
          if (method !== "POST") return { status: 405, body: { error: "Method not allowed" } };
          const parsed = parse();
          if (parsed.error) return { status: 400, body: { error: parsed.error } };
          const result = await guestbook.add(parsed.value, clientId);
          if (!result.ok) {
            const body = { error: result.error };
            if (result.retryAfter) body.retryAfter = result.retryAfter;
            return { status: result.status, body };
          }
          return { status: 201, body: { entry: result.entry } };
        }

        case "/api/hits":
          if (method === "GET") return { status: 200, body: { count: await counter.get() } };
          if (method === "POST") return { status: 200, body: { count: await counter.hit() } };
          return { status: 405, body: { error: "Method not allowed" } };

        default:
          return { status: 404, body: { error: "Nothing here but a sleepy cricket." } };
      }
    } catch {
      return { status: 500, body: { error: "Pip dropped something. Try again soon." } };
    }
  };
}
