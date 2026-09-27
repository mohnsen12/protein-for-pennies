// Reports image coverage: which recipes still lack hero/detail images.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "content", "recipes");

const recipes = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => matter(fs.readFileSync(path.join(dir, f), "utf-8")).data);

const imgDir = path.join(__dirname, "..", "public", "images", "recipes");
const missing = [];
for (const r of recipes) {
  const hero = fs.existsSync(path.join(imgDir, `${r.slug}-hero.jpg`)) || fs.existsSync(path.join(imgDir, `${r.slug}-hero.png`));
  const detail = fs.existsSync(path.join(imgDir, `${r.slug}-detail.jpg`)) || fs.existsSync(path.join(imgDir, `${r.slug}-detail.png`));
  if (!hero || !detail) missing.push(`${r.slug}  hero:${hero ? "ok" : "MISSING"}  detail:${detail ? "ok" : "MISSING"}`);
}

console.log(`Recipes: ${recipes.length}`);
console.log(`Complete (hero+detail): ${recipes.length - missing.length}`);
if (missing.length) {
  console.log(`\nMissing images (${missing.length}):`);
  for (const m of missing) console.log("  " + m);
  console.log("\nGenerate via Google Antigravity: recipe-site/pipeline/IMAGE_TASKS.md");
}
