// Integration tests: start the real dev server and talk to it over HTTP.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = 5600 + Math.floor(Math.random() * 300);
const base = `http://127.0.0.1:${port}`;
let server;
let dataDir;

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "pip-data-"));
  server = spawn(process.execPath, ["server/dev.mjs", "--port", String(port), "--data", dataDir], { cwd: root });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("dev server did not start")), 8000);
    server.stdout.on("data", (chunk) => {
      if (String(chunk).includes("listening")) { clearTimeout(timer); resolve(); }
    });
    server.on("exit", (code) => reject(new Error(`dev server exited early (${code})`)));
  });
});

after(() => {
  server?.kill();
  rmSync(dataDir, { recursive: true, force: true });
});

const post = (path, body, headers = {}) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

test("health check answers", async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("guestbook round trip: sign, then read it back", async () => {
  const empty = await (await fetch(`${base}/api/guestbook`)).json();
  assert.deepEqual(empty.entries, []);

  const created = await post("/api/guestbook", { name: "Thimble", message: "Make the unicorn bigger", sticker: "🦄" });
  assert.equal(created.status, 201);
  const { entry } = await created.json();
  assert.equal(entry.name, "Thimble");

  const { entries } = await (await fetch(`${base}/api/guestbook`)).json();
  assert.equal(entries[0].message, "Make the unicorn bigger");
});

test("signing twice too fast is told to wait", async () => {
  const headers = { "x-forwarded-for": "10.0.0.9" };
  assert.equal((await post("/api/guestbook", { name: "a", message: "one" }, headers)).status, 201);
  const res = await post("/api/guestbook", { name: "a", message: "two" }, headers);
  assert.equal(res.status, 429);
  assert.ok((await res.json()).retryAfter > 0);
});

test("bad input gets a 400 with a friendly reason", async () => {
  const res = await post("/api/guestbook", { name: "a", message: "" }, { "x-forwarded-for": "10.0.0.10" });
  assert.equal(res.status, 400);
  assert.equal(typeof (await res.json()).error, "string");
});

test("broken JSON gets a 400, not a crash", async () => {
  const res = await fetch(`${base}/api/guestbook`, { method: "POST", headers: { "content-type": "application/json" }, body: "{nope" });
  assert.equal(res.status, 400);
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
});

test("hit counter counts each POST and GET reads it", async () => {
  const start = (await (await fetch(`${base}/api/hits`)).json()).count;
  const after1 = (await (await post("/api/hits", {})).json()).count;
  const after2 = (await (await post("/api/hits", {})).json()).count;
  assert.equal(after1, start + 1);
  assert.equal(after2, start + 2);
});

test("unknown API routes and wrong methods are handled", async () => {
  assert.equal((await fetch(`${base}/api/nope`)).status, 404);
  assert.equal((await fetch(`${base}/api/hits`, { method: "DELETE" })).status, 405);
});

test("the site is served from public/, and the server refuses to leave it", async () => {
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  assert.match(await page.text(), /Pip/);
  const image = await fetch(`${base}/assets/img/pip_portrait.webp`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/webp");
  assert.equal((await fetch(`${base}/package.json`)).status, 404);
  const sneaky = await fetch(`${base}/..%2fpackage.json`);
  assert.equal(sneaky.status, 404);
});
