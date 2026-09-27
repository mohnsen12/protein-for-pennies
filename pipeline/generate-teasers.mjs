// Generates automation/teaser-queue.csv — a ready-to-import Google Sheet for the
// n8n Facebook workflow. One teaser per day starting tomorrow, cycling 3 copy
// templates over all recipes.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "recipes");
const OUT = path.join(__dirname, "..", "automation", "teaser-queue.csv");

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || readEnv("NEXT_PUBLIC_SITE_URL") || "https://proteinforpennies.com").replace(/\/$/, "");

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

const recipes = fs
  .readdirSync(CONTENT)
  .filter((f) => f.endsWith(".md"))
  .map((f) => matter(fs.readFileSync(path.join(CONTENT, f), "utf-8")).data)
  .sort((a, b) => a.costPerServing - b.costPerServing);

const templates = [
  (r) => `Dinner for $${r.costPerServing.toFixed(2)} a serving — with ${r.nutrition.protein}g of protein. ${r.tagline} Full recipe: ${SITE_URL}/recipes/${r.slug}`,
  (r) => `${r.nutrition.protein}g of protein for less than a takeout coffee. ${r.title} is on the table in ${r.totalTime.replace("PT", "").toLowerCase()}. Get the recipe: ${SITE_URL}/recipes/${r.slug}`,
  (r) => `Cheap dinner that actually keeps you full. ${r.tagline} Cost per serving: $${r.costPerServing.toFixed(2)}. Recipe + macros: ${SITE_URL}/recipes/${r.slug}`,
];

// Preserve existing statuses (e.g. "Posted") by Link URL
const existingStatus = new Map();
if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, "utf-8").split(/\r?\n/).slice(1)) {
    const m = line.match(/,"([^"]+)",([^,]+)$/);
    if (m && m[2] && m[2] !== "Pending") {
      existingStatus.set(m[1], m[2]);
    }
  }
}

const rows = ["Date,Content,Link,Status"];
const start = new Date();
start.setDate(start.getDate() + 1);

recipes.forEach((r, i) => {
  const d = new Date(start);
  d.setDate(start.getDate() + i);
  const date = d.toISOString().slice(0, 10);
  const link = `${SITE_URL}/recipes/${r.slug}`;
  const content = templates[i % templates.length](r);
  const status = existingStatus.get(link) || "Pending";
  rows.push(`${date},"${content.replace(/"/g, '""')}","${link}",${status}`);
});

fs.writeFileSync(OUT, rows.join("\n"));
console.log(`Wrote ${recipes.length} teasers to automation/teaser-queue.csv (${existingStatus.size} already posted preserved).`);
