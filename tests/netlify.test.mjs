// The Netlify function wiring, tested with a fake Blobs store.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createNetlifyHandler } from "../server/netlify.mjs";

function fakeBlobs() {
  const data = new Map();
  return {
    async get(key, opts) {
      assert.deepEqual(opts, { type: "json" });
      return data.has(key) ? JSON.parse(data.get(key)) : null;
    },
    async setJSON(key, value) {
      data.set(key, JSON.stringify(value));
    },
  };
}

function setup() {
  const blobs = fakeBlobs();
  const names = [];
  const handler = createNetlifyHandler((opts) => {
    names.push(opts.name);
    return blobs;
  });
  const call = (path, init = {}, ip = "1.2.3.4") =>
    handler(new Request(`https://pip.example${path}`, init), { ip });
  return { call, names };
}

test("answers the health check as JSON, uncached", async () => {
  const { call } = setup();
  const res = await call("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.deepEqual(await res.json(), { ok: true });
});

test("stores wishes in the site's blob store and reads them back", async () => {
  const { call, names } = setup();
  const created = await call("/api/guestbook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Bramble", message: "Pancake dream please" }),
  });
  assert.equal(created.status, 201);
  const { entries } = await (await call("/api/guestbook")).json();
  assert.equal(entries[0].message, "Pancake dream please");
  assert.ok(names.every((n) => n === "pip-portfolio"));
});

test("rate limit is per visitor IP", async () => {
  const { call } = setup();
  const post = (ip, message) =>
    call("/api/guestbook", { method: "POST", body: JSON.stringify({ message }) }, ip);
  assert.equal((await post("9.9.9.9", "one")).status, 201);
  assert.equal((await post("9.9.9.9", "two")).status, 429);
  assert.equal((await post("8.8.8.8", "three")).status, 201);
});

test("counts hits", async () => {
  const { call } = setup();
  assert.equal((await (await call("/api/hits", { method: "POST" })).json()).count, 1);
  assert.equal((await (await call("/api/hits")).json()).count, 1);
});
