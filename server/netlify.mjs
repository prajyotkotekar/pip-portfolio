// Adapts the shared /api handler to a Netlify Function backed by Netlify Blobs.
import { createApi, clientIdFor } from "./handler.mjs";

const STORE_NAME = "pip-portfolio";

// Netlify Blobs speaks get(key, { type: "json" }) / setJSON(key, value).
function blobsToKeyValue(blobs) {
  return {
    get: (key) => blobs.get(key, { type: "json" }),
    set: (key, value) => blobs.setJSON(key, value),
  };
}

export function createNetlifyHandler(getStore) {
  return async function handler(request, context = {}) {
    const url = new URL(request.url);
    const api = createApi(blobsToKeyValue(getStore({ name: STORE_NAME, consistency: "strong" })));
    const ip = context.ip ?? request.headers.get("x-nf-client-connection-ip") ?? "anon";
    const { status, body } = await api({
      method: request.method,
      path: url.pathname,
      rawBody: request.method === "POST" ? await request.text() : "",
      clientId: clientIdFor(ip),
    });
    return Response.json(body, { status, headers: { "cache-control": "no-store" } });
  };
}
