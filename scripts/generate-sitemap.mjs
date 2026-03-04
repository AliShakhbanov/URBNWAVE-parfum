import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(root, "src", "app", "data", "products.ts");
const outPath = path.join(root, "public", "sitemap.xml");

const SITE_URL = "https://urbnwave.ru";
const staticPaths = [
  "/",
  "/catalog",
  "/decants",
  "/atelier",
  "/quiz",
  "/guides",
  "/delivery",
  "/returns",
  "/payment",
  "/faq",
  "/about",
  "/contacts",
  "/stores",
  "/careers",
];

const source = fs.readFileSync(dataPath, "utf8");
const productIds = [...source.matchAll(/\bid:\s*(\d+)\s*,/g)]
  .map((m) => Number(m[1]))
  .filter((n, idx, arr) => arr.indexOf(n) === idx)
  .sort((a, b) => a - b);

const urls = [
  ...staticPaths,
  ...productIds.map((id) => `/product/${id}`),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`)
  .join("\n")}\n</urlset>\n`;

fs.writeFileSync(outPath, xml, "utf8");
console.log(`Sitemap generated: ${urls.length} URLs`);
