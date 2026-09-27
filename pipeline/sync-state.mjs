// One-off bootstrap: maps already-generated recipes back to their seeds and
// writes pipeline/state.json, so future generate-recipes runs never re-generate
// an existing recipe (temperature > 0 would give a new title/slug = duplicate).
// Usage: node pipeline/sync-state.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "..", "content", "recipes");
const STATE_FILE = path.join(__dirname, "state.json");
const SEEDS = JSON.parse(fs.readFileSync(path.join(__dirname, "seeds.json"), "utf-8"));

const STOP = new Set(["with", "and", "the", "for", "over", "in", "of", "a", "an", "style", "inspired"]);
const tokens = (t) =>
  new Set(
    t.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))
  );

const recipes = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const { data } = matter(fs.readFileSync(path.join(DIR, f), "utf-8"));
    return { slug: data.slug, title: data.title, category: data.category };
  });

const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) : {};
const usedSlugs = new Set(Object.values(state));
let matched = 0;

SEEDS.forEach((seed, i) => {
  if (state[i]) return; // already tracked
  const seedTokens = tokens(seed.concept + " " + seed.angle);
  let best = null;
  let bestScore = 0;
  for (const r of recipes) {
    if (usedSlugs.has(r.slug) || r.category !== seed.category) continue;
    const rt = tokens(r.title);
    const overlap = [...seedTokens].filter((w) => rt.has(w)).length;
    const score = overlap / Math.min(seedTokens.size, rt.size || 1);
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  if (best && bestScore >= 0.5) {
    state[i] = best.slug;
    usedSlugs.add(best.slug);
    matched++;
    console.log(`seed ${i} (${seed.concept})  ->  ${best.slug}  [${bestScore.toFixed(2)}]`);
  } else {
    console.log(`seed ${i} (${seed.concept})  ->  NOT GENERATED YET`);
  }
});

fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
console.log(`\nstate.json written: ${matched} seeds matched, ${Object.keys(state).length}/${SEEDS.length} tracked.`);
