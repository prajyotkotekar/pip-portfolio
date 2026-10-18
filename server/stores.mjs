// Key-value stores used by the dev server and tests.
// (The deployed site uses Netlify Blobs with the same get/set shape.)
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";

export function createMemoryStore(initial = {}) {
  const data = new Map(Object.entries(structuredClone(initial)));
  return {
    async get(key) {
      return data.has(key) ? structuredClone(data.get(key)) : null;
    },
    async set(key, value) {
      data.set(key, structuredClone(value));
    },
  };
}

export function createFileStore(dir) {
  const file = (key) => join(dir, `${key.replace(/[^a-z0-9_-]/gi, "_")}.json`);
  let queue = Promise.resolve();
  const serial = (task) => (queue = queue.then(task, task));

  return {
    async get(key) {
      try {
        return JSON.parse(await readFile(file(key), "utf8"));
      } catch {
        return null;
      }
    },
    set(key, value) {
      return serial(async () => {
        await mkdir(dir, { recursive: true });
        const tmp = `${file(key)}.tmp`;
        await writeFile(tmp, JSON.stringify(value));
        await rename(tmp, file(key));
      });
    },
  };
}
