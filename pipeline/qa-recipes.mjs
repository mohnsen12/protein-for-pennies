// QA sweep over content/recipes/*.md — structural errors, value ranges, near-duplicates.
// Usage: node pipeline/qa-recipes.mjs [--fix]
// --fix deletes near-duplicate recipes (keeps cheapest, prefers one with images).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "..", "content", "recipes");
const IMG = path.join(__dirname, "..", "public", "images", "recipes");
const fix = process.argv.includes("--fix");

const problems = [];
const recipes = [];

for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".md"))) {
  const raw = fs.readFileSync(path.join(DIR, f), "utf-8");
  const { data } = matter(raw);
  const p = [];
  const slug = data.slug;

  // Field presence & types
  for (const k of ["title", "slug", "tagline", "category", "cuisine", "servings", "prepTime", "cookTime", "totalTime", "nutrition", "costPerServing", "ingredients", "steps", "tips", "keywords", "imagePrompts"]) {
    if (data[k] === undefined || data[k] === null || data[k] === "") p.push(`missing ${k}`);
  }
  if (!Array.isArray(data.ingredients) || data.ingredients.length < 4) p.push(`only ${data.ingredients?.length} ingredients`);
  if (!Array.isArray(data.steps) || data.steps.length < 4) p.push(`only ${data.steps?.length} steps`);
  if (!Array.isArray(data.tips) || data.tips.length < 2) p.push(`only ${data.tips?.length} tips`);
  if (!Array.isArray(data.keywords) || data.keywords.length < 2) p.push("keywords thin");

  // Value ranges
  const n = data.nutrition || {};
  if (n.calories < 300 || n.calories > 900) p.push(`calories ${n.calories} out of range`);
  if (n.protein < 15 || n.protein > 60) p.push(`protein ${n.protein} out of range`);
  if (typeof data.costPerServing !== "number" || data.costPerServing < 0.6 || data.costPerServing > 4) p.push(`cost ${data.costPerServing} out of range`);

  // Time format + consistency
  for (const t of ["prepTime", "cookTime", "totalTime"]) {
    if (data[t] && !/^PT\d+M$/.test(data[t])) p.push(`${t}="${data[t]}" not PT..M`);
  }
  if (data.prepTime && data.cookTime && data.totalTime) {
    const sum = parseInt(data.prepTime.slice(2)) + parseInt(data.cookTime.slice(2));
    const tot = parseInt(data.totalTime.slice(2));
    if (Math.abs(sum - tot) > 5) p.push(`totalTime ${tot}m != prep+cook ${sum}m`);
  }

  // Title hygiene
  if (data.title && (data.title.length > 70 || /["!]{2,}/.test(data.title))) p.push(`title suspect: "${data.title}"`);
  if (slug && f !== `${slug}.md`) p.push(`filename ${f} != slug`);

  // Slug sanity
  if (slug && /[^a-z0-9-]/.test(slug)) p.push(`slug has bad chars: ${slug}`);

  const hasImg = fs.existsSync(path.join(IMG, `${slug}-hero.jpg`)) || fs.existsSync(path.join(IMG, `${slug}-hero.png`));
  recipes.push({ file: f, title: data.title, slug, category: data.category, cost: data.costPerServing, protein: n.protein, hasImg, bodyLen: raw.length, problems: p });

  for (const x of p) problems.push(`${slug}: ${x}`);
  if (raw.length < 1200) problems.push(`${slug}: file suspiciously short (${raw.length} bytes)`);
}

// Near-duplicate detection (title token overlap)
function tokens(t) {
  return new Set(
    t.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2)
  );
}
const dups = [];
for (let i = 0; i < recipes.length; i++) {
  for (let j = i + 1; j < recipes.length; j++) {
    const a = tokens(recipes[i].title);
    const b = tokens(recipes[j].title);
    const overlap = [...a].filter((w) => b.has(w)).length;
    const score = overlap / Math.min(a.size, b.size);
    if (score >= 0.6) dups.push({ a: recipes[i], b: recipes[j], score });
  }
}

console.log(`Recipes: ${recipes.length}`);
console.log(`\n=== PROBLEMS (${problems.length}) ===`);
for (const x of problems) console.log("  " + x);
console.log(`\n=== NEAR-DUPLICATES (${dups.length}) ===`);
for (const d of dups) {
  console.log(`  [${d.score.toFixed(2)}] "${d.a.title}"  <->  "${d.b.title}"`);
}

if (fix && dups.length > 0) {
  console.log("\n--fix: removing duplicates (keeping cheapest / imaged one)...");
  const removed = new Set();
  for (const d of dups) {
    const kill = d.a.cost <= d.b.cost && !removed.has(d.a.slug) ? d.b : d.a;
    if (removed.has(kill.slug)) continue;
    // prefer keeping the one with an image
    let victim = kill;
    if (d.a.hasImg && !d.b.hasImg) victim = d.b;
    if (d.b.hasImg && !d.a.hasImg) victim = d.a;
    removed.add(victim.slug);
    fs.unlinkSync(path.join(DIR, victim.file));
    console.log(`  deleted ${victim.slug}`);
  }
  console.log(`Removed ${removed.size} duplicates. Re-run without --fix to confirm.`);
} else if (dups.length > 0) {
  console.log("\nRun with --fix to remove near-duplicates automatically.");
}
