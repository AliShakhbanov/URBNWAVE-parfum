import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const PORT = Number(process.env.ANALYTICS_PORT || 8787);
const HOST = process.env.ANALYTICS_HOST || "0.0.0.0";
const root = process.cwd();
const outDir = path.join(root, "analytics");

fs.mkdirSync(outDir, { recursive: true });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function writeEvent(payload) {
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(outDir, `events-${date}.ndjson`);
  fs.appendFileSync(file, `${JSON.stringify(payload)}\n`, "utf8");
}

function getEventFiles() {
  return fs
    .readdirSync(outDir)
    .filter((name) => /^events-\d{4}-\d{2}-\d{2}\.ndjson$/.test(name))
    .sort()
    .map((name) => path.join(outDir, name));
}

function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function readEvents(limit = 5000) {
  const files = getEventFiles();
  const result = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    for (const line of lines) {
      const parsed = parseLine(line);
      if (parsed) result.push(parsed);
    }
  }

  if (limit <= 0) return result;
  return result.slice(-limit);
}

function toDate(value) {
  const d = new Date(value || "");
  return Number.isNaN(d.valueOf()) ? null : d;
}

function toIsoDate(value) {
  const d = toDate(value);
  return d ? d.toISOString().slice(0, 10) : null;
}

function buildMetrics(events) {
  const byEvent = {};
  const topPaths = {};
  const clients = new Set();
  const now = Date.now();
  let last24h = 0;

  for (const e of events) {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
    topPaths[e.path || "/"] = (topPaths[e.path || "/"] || 0) + 1;
    if (e.clientId) clients.add(e.clientId);

    const dt = toDate(e.receivedAt || e.at);
    if (dt && now - dt.getTime() <= 24 * 60 * 60 * 1000) {
      last24h += 1;
    }
  }

  const byDay = {};
  for (const e of events) {
    const day = toIsoDate(e.receivedAt || e.at);
    if (!day) continue;
    byDay[day] = (byDay[day] || 0) + 1;
  }

  const daily = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date, count }));

  const funnelSteps = ["page_view", "add_to_cart", "begin_checkout", "checkout_submit"];
  const funnel = {};
  for (const step of funnelSteps) {
    funnel[step] = byEvent[step] || 0;
  }
  funnel.conversionPercent = funnel.page_view > 0
    ? Number(((funnel.checkout_submit / funnel.page_view) * 100).toFixed(2))
    : 0;

  return {
    totals: {
      events: events.length,
      clients: clients.size,
      last24h,
    },
    byEvent,
    topPaths,
    daily,
    funnel,
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json", ...corsHeaders });
  res.end(JSON.stringify(payload));
}

function parseUrl(req) {
  const host = req.headers.host || "localhost";
  return new URL(req.url || "/", `http://${host}`);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { ok: false, error: "Bad request" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  const url = parseUrl(req);
  const pathname = url.pathname;

  if (pathname === "/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, service: "analytics" });
    return;
  }

  if (pathname === "/events" && req.method === "GET") {
    const requested = Number(url.searchParams.get("limit") || "100");
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(1000, requested)) : 100;
    const events = readEvents(limit).reverse();
    sendJson(res, 200, { ok: true, count: events.length, events });
    return;
  }

  if (pathname === "/metrics" && req.method === "GET") {
    const events = readEvents(0);
    sendJson(res, 200, buildMetrics(events));
    return;
  }

  if (pathname !== "/collect" || req.method !== "POST") {
    sendJson(res, 404, { ok: false, error: "Not found" });
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 256 * 1024) req.destroy();
  });

  req.on("end", () => {
    try {
      const event = JSON.parse(body || "{}");
      const normalized = {
        ...event,
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
        ua: req.headers["user-agent"] || "",
        receivedAt: new Date().toISOString(),
      };
      writeEvent(normalized);
      sendJson(res, 202, { ok: true });
    } catch {
      sendJson(res, 400, { ok: false, error: "Invalid JSON" });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Analytics server listening on http://${HOST}:${PORT}`);
  console.log("POST /collect, GET /health, GET /events, GET /metrics");
});
