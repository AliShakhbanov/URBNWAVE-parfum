import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(root, "src", "app", "data", "products.ts");
const outDir = path.join(root, "public", "og");

const source = fs.readFileSync(dataPath, "utf8");

const ids = [...source.matchAll(/\bid:\s*(\d+)\s*,/g)].map((m) => Number(m[1]));
const names = [...source.matchAll(/\bname:\s*"([^"]+)"\s*,/g)].map((m) => m[1]);

const records = ids.map((id, idx) => ({ id, name: names[idx] ?? `Product ${id}` }));

fs.mkdirSync(outDir, { recursive: true });

const escape = (v) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const makeSvg = (title) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111111"/>
      <stop offset="100%" stop-color="#2d2415"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="48" y="48" width="1104" height="534" rx="22" fill="none" stroke="#7a5a2d" stroke-opacity="0.45"/>
  <text x="80" y="130" fill="#c9a06a" font-size="28" font-family="Georgia, serif" letter-spacing="4">URBNWAVE</text>
  <text x="80" y="300" fill="#ffffff" font-size="62" font-family="Georgia, serif">${escape(title)}</text>
  <text x="80" y="365" fill="#cfcfcf" font-size="28" font-family="Arial, sans-serif">Премиальный распив и Atelier-парфюмерия</text>
</svg>`;

for (const item of records) {
  const file = path.join(outDir, `product-${item.id}.svg`);
  fs.writeFileSync(file, makeSvg(item.name), "utf8");
}

fs.writeFileSync(path.join(outDir, "default.svg"), makeSvg("Каталог URBNWAVE"), "utf8");
console.log(`OG images generated: ${records.length + 1}`);
