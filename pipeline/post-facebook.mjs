// Posts the LATEST unposted recipe (with its hero image + an appetizing description)
// to the Protein for Pennies Facebook Page via Facebook Graph API.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "recipes");
const IMG_DIR = path.join(ROOT, "public", "images", "recipes");
const POSTED_LOG = path.join(ROOT, "automation", "facebook-posted.json");
const QUEUE_CSV = path.join(ROOT, "automation", "teaser-queue.csv");

function readEnv(key) {
  if (process.env[key]) return process.env[key];
  for (const f of [".env.local", ".env"]) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, "utf-8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  }
  return null;
}

const SITE_URL = (readEnv("NEXT_PUBLIC_SITE_URL") || "https://proteinforpennies.com").replace(/\/$/, "");
const FB_PAGE_ID = readEnv("FB_PAGE_ID");
const FB_PAGE_ACCESS_TOKEN = readEnv("FB_PAGE_ACCESS_TOKEN");

if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN) {
  console.error("Missing FB_PAGE_ID or FB_PAGE_ACCESS_TOKEN in recipe-site/.env.local");
  process.exit(1);
}

// Load already-posted slugs
let posted = {};
if (fs.existsSync(POSTED_LOG)) {
  try {
    posted = JSON.parse(fs.readFileSync(POSTED_LOG, "utf-8"));
  } catch {
    posted = {};
  }
}

// Find all recipes that have a hero image, sorted newest first
const candidates = fs
  .readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const fullPath = path.join(CONTENT_DIR, f);
    const stat = fs.statSync(fullPath);
    const parsed = matter(fs.readFileSync(fullPath, "utf-8"));
    const slug = parsed.data.slug || f.replace(/\.md$/, "");
    const heroPath = path.join(IMG_DIR, `${slug}-hero.jpg`);
    return {
      slug,
      data: parsed.data,
      body: parsed.content.trim(),
      heroPath,
      hasImage: fs.existsSync(heroPath),
      mtimeMs: stat.mtimeMs,
    };
  })
  .filter((r) => r.hasImage && !posted[r.slug])
  .sort((a, b) => b.mtimeMs - a.mtimeMs);

if (candidates.length === 0) {
  console.log("No new unposted recipes with hero images found.");
  process.exit(0);
}

const recipe = candidates[0];
const paragraphs = recipe.body
  .split(/\r?\n\r?\n/)
  .map((p) => p.replace(/\r?\n/g, " ").trim())
  .filter(Boolean);

const introText = paragraphs[0] || recipe.data.tagline;
const timeText = (recipe.data.totalTime || "PT30M").replace(/^PT/, "").toLowerCase();
const costText = Number(recipe.data.costPerServing || 2.0).toFixed(2);
const proteinText = recipe.data.nutrition?.protein || 25;
const caloriesText = recipe.data.nutrition?.calories || 500;
const linkUrl = `${SITE_URL}/recipes/${recipe.slug}`;

const caption = [
  `${recipe.data.title}`,
  ``,
  `${introText}`,
  ``,
  `💪 ${proteinText}g Protein per serving · 🔥 ${caloriesText} kcal · 💰 $${costText}/serving · ⏱️ Ready in ${timeText}`,
  ``,
  `Full recipe & step-by-step instructions: ${linkUrl}`,
].join("\n");

console.log(`Posting latest recipe "${recipe.slug}" with hero photo to Facebook Page ${FB_PAGE_ID}...`);

const form = new FormData();
const bytes = fs.readFileSync(recipe.heroPath);
form.append("source", new Blob([bytes], { type: "image/jpeg" }), `${recipe.slug}-hero.jpg`);
form.append("caption", caption);
form.append("access_token", FB_PAGE_ACCESS_TOKEN);

const res = await fetch(`https://graph.facebook.com/v24.0/${FB_PAGE_ID}/photos`, {
  method: "POST",
  body: form,
});
const result = await res.json();

if (!res.ok || result.error) {
  console.error("Facebook API error:", JSON.stringify(result, null, 2));
  process.exit(1);
}

const nowIso = new Date().toISOString();
posted[recipe.slug] = {
  postId: result.post_id || result.id,
  postedAt: nowIso,
  title: recipe.data.title,
};
fs.writeFileSync(POSTED_LOG, JSON.stringify(posted, null, 2));

// Also mark in teaser-queue.csv if present
if (fs.existsSync(QUEUE_CSV)) {
  const csv = fs.readFileSync(QUEUE_CSV, "utf-8");
  const updated = csv.replace(
    new RegExp(`("${linkUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",)Pending`),
    `$1Posted (${nowIso.slice(0, 10)})`
  );
  fs.writeFileSync(QUEUE_CSV, updated);
}

console.log(`✓ Posted "${recipe.data.title}" to Facebook! Post ID: ${result.post_id || result.id}`);
