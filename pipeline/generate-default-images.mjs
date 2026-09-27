// One-off: generates branded default images used when a recipe has no photo yet —
// public/images/default-recipe.jpg (1200×900, JSON-LD/OG fallback)
// public/images/og-default.jpg    (1200×630, site-wide Open Graph card)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "images");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function cardSvg(w, h, lines, sub) {
  const fontStack = "Georgia, 'Times New Roman', serif";
  const sansStack = "Arial, Helvetica, sans-serif";
  const size = w === 1200 && h === 630 ? 54 : 58;
  const lineH = size * 1.2;
  const startY = h / 2 - ((lines.length - 1) * lineH) / 2 - 10;
  const spans = lines
    .map((l, i) => `<tspan x="${w / 2}" y="${startY + i * lineH}" text-anchor="middle">${esc(l)}</tspan>`)
    .join("");
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.2" r="1">
      <stop offset="0" stop-color="#cfe8ce" stop-opacity="0.55"/>
      <stop offset="0.7" stop-color="#cfe8ce" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f2eee8"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <rect x="${w / 2 - 60}" y="${h / 2 - 150}" width="120" height="10" fill="#fff34a"/>
  <text font-family="${fontStack}" font-size="${size}" font-weight="bold" fill="#333132">${spans}</text>
  <text x="${w / 2}" y="${h / 2 + (lines.length * lineH) / 2 + 60}" font-family="${sansStack}" font-size="26" letter-spacing="6" fill="#46645b">${esc(sub)}</text>
</svg>`);
}

async function make(file, w, h, lines, sub) {
  await sharp({ create: { width: w, height: h, channels: 4, background: "#f2eee8" } })
    .composite([{ input: cardSvg(w, h, lines, sub) }])
    .jpeg({ quality: 88 })
    .toFile(path.join(OUT, file));
  console.log(`✓ ${file}`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await make("default-recipe.jpg", 1200, 900, ["Cheap, high-protein", "dinner recipe"], "PROTEINFORPENNIES.COM · PROTEIN + PRICE ON EVERY RECIPE");
  await make("og-default.jpg", 1200, 630, ["Strong food,", "small bill."], "HIGH-PROTEIN DINNERS UNDER $3 A SERVING");
})();
