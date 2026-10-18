// Local dev server: serves the site and the /api routes.
// Usage: node server/dev.mjs [--port 5173] [--root .] [--data .data]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createApi } from "./handler.mjs";
import { createFileStore } from "./stores.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, []),
);

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const root = resolve(args.root ?? projectRoot);
const port = Number(args.port ?? process.env.PORT ?? 5173);
const api = createApi(createFileStore(resolve(args.data ?? join(projectRoot, ".data"))));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".webmanifest": "application/manifest+json",
};

function readBody(req) {
  return new Promise((done) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size <= 4096) chunks.push(c);
    });
    req.on("end", () => done(Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => done(""));
  });
}

async function serveFile(pathname, res) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  let file = resolve(join(root, decoded));
  if (file !== root && !file.startsWith(root + sep)) return false;
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const data = await readFile(file);
    res.writeHead(200, {
      "content-type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
      "cache-control": "no-cache",
    });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname.startsWith("/api/")) {
    const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "anon").split(",")[0].trim();
    const { status, body } = await api({
      method: req.method,
      path: url.pathname,
      rawBody: req.method === "POST" ? await readBody(req) : "",
      clientId: createHash("sha256").update(ip).digest("hex").slice(0, 16),
    });
    res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(JSON.stringify(body));
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end();
    return;
  }
  if (!(await serveFile(url.pathname, res))) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Pip's dev server listening on http://127.0.0.1:${port} (root: ${root})`);
});
