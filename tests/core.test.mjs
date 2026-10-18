import { test } from "node:test";
import assert from "node:assert/strict";
import { createGuestbook, createCounter, STICKERS } from "../server/core.mjs";
import { createMemoryStore } from "../server/stores.mjs";

function setup(start = 1_700_000_000_000) {
  let now = start;
  const clock = { now: () => now, advance: (ms) => (now += ms) };
  const store = createMemoryStore();
  return { clock, store, book: createGuestbook(store, { now: clock.now }) };
}

test("a new guestbook is empty", async () => {
  const { book } = setup();
  assert.deepEqual(await book.list(), []);
});

test("a signed entry shows up first in the list, trimmed", async () => {
  const { book } = setup();
  const res = await book.add({ name: "  Bramble ", message: " Sheep number 12. Or 13. ", sticker: "🦔" }, "ip-1");
  assert.equal(res.ok, true);
  const [entry] = await book.list();
  assert.equal(entry.name, "Bramble");
  assert.equal(entry.message, "Sheep number 12. Or 13.");
  assert.equal(entry.sticker, "🦔");
  assert.equal(typeof entry.id, "string");
  assert.equal(entry.createdAt, 1_700_000_000_000);
});

test("newest entries come first", async () => {
  const { book, clock } = setup();
  await book.add({ name: "Thimble", message: "first" }, "a");
  clock.advance(60_000);
  await book.add({ name: "Duck", message: "second" }, "b");
  const names = (await book.list()).map((e) => e.name);
  assert.deepEqual(names, ["Duck", "Thimble"]);
});

test("an empty name falls back to 'a sleepy visitor'", async () => {
  const { book } = setup();
  await book.add({ name: "   ", message: "night night" }, "a");
  assert.equal((await book.list())[0].name, "a sleepy visitor");
});

test("an empty message is rejected", async () => {
  const { book } = setup();
  const res = await book.add({ name: "Pip", message: "   " }, "a");
  assert.equal(res.ok, false);
  assert.equal(res.status, 400);
  assert.deepEqual(await book.list(), []);
});

test("overlong name and message are cut to the limits", async () => {
  const { book } = setup();
  await book.add({ name: "N".repeat(80), message: "m".repeat(500) }, "a");
  const [entry] = await book.list();
  assert.equal(entry.name.length, 24);
  assert.equal(entry.message.length, 160);
});

test("links are refused so the wall can't be used for spam", async () => {
  const { book } = setup();
  for (const message of ["visit http://spam.example", "go to www.spam.example", "spam.example.com/deal"]) {
    const res = await book.add({ name: "x", message }, `ip-${message}`);
    assert.equal(res.ok, false, message);
    assert.equal(res.status, 400);
  }
});

test("a filled honeypot field is quietly accepted but never stored", async () => {
  const { book } = setup();
  const res = await book.add({ name: "bot", message: "hello", website: "http://bot" }, "a");
  assert.equal(res.ok, true);
  assert.deepEqual(await book.list(), []);
});

test("control characters are stripped from text", async () => {
  const { book } = setup();
  await book.add({ name: "Pi\u0000p​", message: "hi\u0007 there" }, "a");
  const [entry] = await book.list();
  assert.equal(entry.name, "Pip");
  assert.equal(entry.message, "hi there");
});

test("unknown stickers are dropped, known ones kept", async () => {
  const { book, clock } = setup();
  await book.add({ name: "a", message: "one", sticker: "💣" }, "a");
  clock.advance(60_000);
  await book.add({ name: "b", message: "two", sticker: STICKERS[0] }, "a");
  const [b, a] = await book.list();
  assert.equal(a.sticker, null);
  assert.equal(b.sticker, STICKERS[0]);
});

test("the same visitor must wait before signing again", async () => {
  const { book, clock } = setup();
  assert.equal((await book.add({ name: "a", message: "one" }, "ip-1")).ok, true);
  const second = await book.add({ name: "a", message: "two" }, "ip-1");
  assert.equal(second.ok, false);
  assert.equal(second.status, 429);
  assert.ok(second.retryAfter > 0);
  assert.equal((await book.add({ name: "b", message: "other visitor" }, "ip-2")).ok, true);
  clock.advance(21_000);
  assert.equal((await book.add({ name: "a", message: "three" }, "ip-1")).ok, true);
});

test("the list returns at most 50 entries and storage keeps at most 200", async () => {
  const { book, clock, store } = setup();
  for (let i = 0; i < 230; i++) {
    await book.add({ name: `v${i}`, message: `m${i}` }, `ip-${i}`);
    clock.advance(1);
  }
  const listed = await book.list();
  assert.equal(listed.length, 50);
  assert.equal(listed[0].name, "v229");
  assert.equal((await store.get("guestbook")).length, 200);
});

test("the hit counter starts at zero and counts up", async () => {
  const counter = createCounter(createMemoryStore());
  assert.equal(await counter.get(), 0);
  assert.equal(await counter.hit(), 1);
  assert.equal(await counter.hit(), 2);
  assert.equal(await counter.get(), 2);
});
