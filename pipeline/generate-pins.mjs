// Generates 1000×1500 Pinterest pins per recipe.
// - 2 branded text pins (always possible, no photo needed)
// - 1 photo pin per available hero image (re-run after Antigravity images are added)
// Also writes pipeline/pinterest-queue.csv ready for manual/bulk pinning:
// title,image,link,description
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "recipes");
const IMG_DIR = path.join(ROOT, "public", "images", "recipes");
const PINS_DIR = path.join(ROOT, "public", "pins");
const SITE_URL = (readEnv("NEXT_PUBLIC_SITE_URL") || "https://proteinforpennies.com").replace(/\/$/, "");
const SITE_NAME = readEnv("NEXT_PUBLIC_SITE_NAME") || "Protein for Pennies";

function readEnv(key) {
  for (const f of [".env.local", ".env"]) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, "utf-8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
  return null;
}

const W = 1000;
const H = 1500;

const THEMES = [
  { bg1: "#241f17", bg2: "#121008", accent: "#f0a626", text: "#f2ebdf", muted: "#a89c8a" },
  { bg1: "#1c2318", bg2: "#0d100a", accent: "#8fce5a", text: "#eef2e4", muted: "#9aa88e" },
];

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text, maxChars, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      lines.push(cur.trim());
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur.trim());
  return lines;
}

function textPinSvg(recipe, theme) {
  // Georgia bold averages ~0.55×font-size per char; usable width is ~820px.
  const titleLines = wrap(recipe.title.toUpperCase(), 18, 4);
  const fontStack = "Georgia, 'Times New Roman', serif";
  const sansStack = "Arial, Helvetica, sans-serif";
  const titleSize = titleLines.some((l) => l.length > 14) ? 62 : 72;
  const lineHeight = titleSize * 1.14;
  const startY = 440;

  const titleSpans = titleLines
    .map(
      (l, i) =>
        `<tspan x="100" y="${startY + i * lineHeight}">${esc(l)}</tspan>`
    )
    .join("");

  const metaY = startY + titleLines.length * lineHeight + 40;

  return Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.bg1}"/>
      <stop offset="1" stop-color="${theme.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.15" r="0.9">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.18"/>
      <stop offset="0.6" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="100" y="330" width="120" height="10" fill="${theme.accent}"/>
  <text x="100" y="300" font-family="${sansStack}" font-size="30" font-weight="bold" letter-spacing="6" fill="${theme.accent}">DINNER UNDER $${recipe.costPerServing.toFixed(2)}</text>
  <text font-family="${fontStack}" font-size="${titleSize}" font-weight="bold" fill="${theme.text}">${titleSpans}</text>
  <text x="100" y="${metaY}" font-family="${sansStack}" font-size="44" font-weight="bold" fill="${theme.accent}">${recipe.nutrition.protein}g PROTEIN PER SERVING</text>
  <text x="100" y="${metaY + 70}" font-family="${sansStack}" font-size="34" fill="${theme.muted}">${recipe.totalTime.replace("PT", "").toLowerCase()} · ${recipe.servings} servings · one-pan friendly</text>
  <rect x="0" y="${H - 110}" width="${W}" height="110" fill="${theme.accent}" opacity="0.08"/>
  <text x="100" y="${H - 52}" font-family="${fontStack}" font-size="40" font-weight="bold" fill="${theme.text}">${esc(SITE_NAME)}</text>
</svg>`);
}

function photoPinSvg(recipe) {
  const titleLines = wrap(recipe.title.toUpperCase(), 19, 3);
  const fontStack = "Georgia, 'Times New Roman', serif";
  const sansStack = "Arial, Helvetica, sans-serif";
  const titleSize = titleLines.some((l) => l.length > 15) ? 54 : 62;
  const lineHeight = titleSize * 1.14;
  const bandTop = H - 330 - titleLines.length * lineHeight + lineHeight;

  const titleSpans = titleLines
    .map((l, i) => `<tspan x="80" y="${H - 300 + i * lineHeight}">${esc(l)}</tspan>`)
    .join("");

  return Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0f0d0a" stop-opacity="0"/>
      <stop offset="0.55" stop-color="#0f0d0a" stop-opacity="0.78"/>
      <stop offset="1" stop-color="#0f0d0a" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#shade)"/>
  <text x="80" y="${H - 430}" font-family="${sansStack}" font-size="34" font-weight="bold" letter-spacing="5" fill="#f0a626">${recipe.nutrition.protein}g PROTEIN · $${recipe.costPerServing.toFixed(2)}/SERVING</text>
  <text font-family="${fontStack}" font-size="${titleSize}" font-weight="bold" fill="#f2ebdf">${titleSpans}</text>
  <rect x="80" y="${H - 130}" width="840" height="4" fill="#f0a626" opacity="0.7"/>
  <text x="80" y="${H - 70}" font-family="${fontStack}" font-size="38" font-weight="bold" fill="#f2ebdf">${esc(SITE_NAME)}</text>
</svg>`);
}

async function main() {
  fs.mkdirSync(PINS_DIR, { recursive: true });
  const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".md"));
  const queue = ["title,image,link,description"];

  let textPins = 0;
  let photoPins = 0;

  for (const f of files) {
    const { data } = matter(fs.readFileSync(path.join(CONTENT, f), "utf-8"));
    const slug = data.slug;
    const heroPath = fs.existsSync(path.join(IMG_DIR, `${slug}-hero.jpg`))
      ? path.join(IMG_DIR, `${slug}-hero.jpg`)
      : fs.existsSync(path.join(IMG_DIR, `${slug}-hero.png`))
        ? path.join(IMG_DIR, `${slug}-hero.png`)
        : null;

    const desc = `${data.tagline} Only $${data.costPerServing.toFixed(2)} per serving with ${data.nutrition.protein}g protein. Cheap high-protein dinner idea for busy weeknights.`;

    // Text pin variant 1 (amber) — always
    await sharp({
      create: { width: W, height: H, channels: 4, background: "#121008" },
    })
      .composite([{ input: textPinSvg(data, THEMES[0]) }])
      .png()
      .toFile(path.join(PINS_DIR, `${slug}-pin1.png`));
    textPins++;

    // Text pin variant 2 (green) — always
    await sharp({
      create: { width: W, height: H, channels: 4, background: "#0d100a" },
    })
      .composite([{ input: textPinSvg(data, THEMES[1]) }])
      .png()
      .toFile(path.join(PINS_DIR, `${slug}-pin2.png`));
    textPins++;

    // Photo pin — when the hero image exists
    if (heroPath) {
      const hero = await sharp(heroPath).resize(W, H, { fit: "cover" }).toBuffer();
      await sharp(hero)
        .composite([{ input: photoPinSvg(data) }])
        .png()
        .toFile(path.join(PINS_DIR, `${slug}-pin3.png`));
      photoPins++;
    }

    const links = [`${slug}-pin1.png`, `${slug}-pin2.png`];
    if (heroPath) links.push(`${slug}-pin3.png`);
    for (const l of links) {
      queue.push(
        `"${data.title.replace(/"/g, '""')}","${l}","${SITE_URL}/recipes/${slug}","${desc.replace(/"/g, '""')}"`
      );
    }
    console.log(`✓ pins: ${slug}${heroPath ? " (+photo)" : ""}`);
  }

  fs.writeFileSync(path.join(__dirname, "pinterest-queue.csv"), queue.join("\n"));
  console.log(`\nDone: ${textPins} text pins, ${photoPins} photo pins.`);
  console.log(`Queue file: pipeline/pinterest-queue.csv`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
