// Generates original recipe markdown files from seeds.json via Gemini.
// Idempotent: existing content/recipes/<slug>.md files are skipped unless --force.
// Also writes pipeline/IMAGE_TASKS.md with copy-paste prompts for image generation
// (in Google Antigravity or any image model) using exact target filenames.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { generateText } from "./lib/gemini.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "content", "recipes");
const SEEDS = JSON.parse(fs.readFileSync(path.join(__dirname, "seeds.json"), "utf-8"));

const force = process.argv.includes("--force");
const tasksOnly = process.argv.includes("--tasks-only");
const onlyIdx = process.argv.includes("--only") ? Number(process.argv[process.argv.indexOf("--only") + 1]) : null;
// --limit N: only generate the first N untracked seeds (used by the daily 2/day run)
const limitArg = process.argv.includes("--limit") ? Number(process.argv[process.argv.indexOf("--limit") + 1]) : null;

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

function isoMin(m) {
  return `PT${m}M`;
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    tagline: { type: "STRING" },
    cuisine: { type: "STRING" },
    servings: { type: "INTEGER" },
    prepMinutes: { type: "INTEGER" },
    cookMinutes: { type: "INTEGER" },
    ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          qty: { type: "STRING" },
          unit: { type: "STRING" },
          item: { type: "STRING" },
          note: { type: "STRING" },
        },
        required: ["qty", "unit", "item"],
      },
    },
    steps: { type: "ARRAY", items: { type: "STRING" } },
    tips: { type: "ARRAY", items: { type: "STRING" } },
    nutrition: {
      type: "OBJECT",
      properties: {
        calories: { type: "INTEGER" },
        protein: { type: "INTEGER" },
        carbs: { type: "INTEGER" },
        fat: { type: "INTEGER" },
      },
      required: ["calories", "protein", "carbs", "fat"],
    },
    costPerServing: { type: "NUMBER" },
    tags: { type: "ARRAY", items: { type: "STRING" } },
    keywords: { type: "ARRAY", items: { type: "STRING" } },
    intro1: { type: "STRING" },
    intro2: { type: "STRING" },
    heroImagePrompt: { type: "STRING" },
    detailImagePrompt: { type: "STRING" },
  },
  required: [
    "title", "tagline", "cuisine", "servings", "prepMinutes", "cookMinutes",
    "ingredients", "steps", "tips", "nutrition", "costPerServing", "tags",
    "keywords", "intro1", "intro2", "heroImagePrompt", "detailImagePrompt",
  ],
};

function buildPrompt(seed) {
  return `You are the head recipe developer for "Protein for Pennies", a recipe site about cheap high-protein dinners for a US audience. Write ONE completely original recipe.

Concept: ${seed.concept}
Angle: ${seed.angle}
Category: ${seed.category}

STRICT RULES:
- ORIGINAL content. Write from scratch in our own voice using classic cooking building blocks. Never copy or closely paraphrase any existing published recipe text.
- Weeknight-real: total time 20-45 minutes (soup/oven dishes up to 60).
- Budget-real: cheap US ingredients only (chicken thighs, drumsticks, ground beef, eggs, lentils, canned beans, canned fish, cottage cheese, rice, pasta, potatoes, frozen vegetables). No wine, no fresh herbs except parsley/cilantro/green onion, no specialty items. Soy sauce, hot sauce, peanut butter, canned tomatoes are fine.
- Servings: 4 (6 for soups).
- nutrition per serving: realistic estimates. protein 25-45g for meat/egg/fish recipes, 18-30g for bean/lentil/tofu recipes. calories 400-700.
- costPerServing: realistic US 2026 grocery estimate per person, MUST be under $3.50 and above $0.75.
- ingredient quantities in US units (lb, oz, cup, tbsp, tsp, can); for count items use unit "" (e.g. qty "3", unit "", item "large eggs").
- steps: 5-8 imperative steps, include times and temperatures where relevant.
- tips: 2-3 concrete budget tips (cheaper swap, storage, bulk-buy, leftover use).
- intro1: 2-3 sentences on why this dinner works on a budget. intro2: 2-3 sentences on flavor and practicality. Never use "I". No filler like "in today's busy world".
- tagline: one punchy sentence, max 18 words, ideally mentioning the protein or price hook.
- title: max 65 characters, appetizing, no clickbait, no emojis.
- keywords: 3 search phrases a real hungry person would type.
- cuisine: short label (e.g. "American", "Mexican-inspired", "Asian-inspired", "Italian-inspired").
- heroImagePrompt: photorealistic food photography prompt for the finished dish, 45-degree or overhead angle, dark rustic wooden table, warm natural window light, shallow depth of field, steam, appetizing garnish. detailImagePrompt: extreme close-up texture shot of a bite or the pan. Both prompts must not mention text, logos, people, or hands.

Return JSON only, matching the schema exactly.`;
}

function validate(r) {
  const errs = [];
  if (!r.title || r.title.length > 75) errs.push("title");
  if (!Array.isArray(r.ingredients) || r.ingredients.length < 5) errs.push("ingredients");
  if (!Array.isArray(r.steps) || r.steps.length < 4) errs.push("steps");
  if (!r.nutrition || typeof r.nutrition.protein !== "number") errs.push("nutrition");
  if (typeof r.costPerServing !== "number" || r.costPerServing < 0.5 || r.costPerServing > 5) errs.push("cost");
  return errs;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Seed tracking: temperature > 0 means a re-run can generate a different title
  // for the same seed, silently creating near-duplicates. Record seed -> slug so
  // each seed only ever produces one recipe file.
  const STATE_FILE = path.join(__dirname, "state.json");
  const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) : {};

  let made = 0;
  for (let i = 0; i < SEEDS.length && !tasksOnly; i++) {
    if (limitArg !== null && made >= limitArg) break;
    if (onlyIdx !== null && i !== onlyIdx) continue;
    const seed = SEEDS[i];

    if (state[i]) {
      console.log(`[${i + 1}/${SEEDS.length}] seed done -> ${state[i]} — skipped`);
      continue;
    }

    console.log(`[${i + 1}/${SEEDS.length}] ${seed.concept}`);

    try {
      const raw = await generateText({ prompt: buildPrompt(seed), schema: SCHEMA });
      const r = JSON.parse(raw);

      const errs = validate(r);
      if (errs.length) {
        console.error(`  ✗ invalid (${errs.join(",")}) — skipped`);
        continue;
      }

      const slug = slugify(r.title);
      const outFile = path.join(OUT_DIR, `${slug}.md`);
      if (fs.existsSync(outFile) && !force) {
        console.log(`  = exists (${slug}) — skipped`);
        continue;
      }

      // Guardrails
      r.costPerServing = Math.round(Math.min(4.5, Math.max(0.75, r.costPerServing)) * 100) / 100;
      r.title = r.title.replace(/["\\]/g, "");

      const data = {
        title: r.title,
        slug,
        tagline: r.tagline,
        category: seed.category,
        cuisine: r.cuisine,
        servings: r.servings || 4,
        prepTime: isoMin(r.prepMinutes || 10),
        cookTime: isoMin(r.cookMinutes || 25),
        totalTime: isoMin((r.prepMinutes || 10) + (r.cookMinutes || 25)),
        premium: false, // traffic-first launch: everything free
        nutrition: r.nutrition,
        costPerServing: r.costPerServing,
        costCurrency: "USD",
        tags: (r.tags || []).slice(0, 6),
        keywords: (r.keywords || []).slice(0, 4),
        sourceUrl: "", // original recipes — no source to credit
        ingredients: r.ingredients.map((ing) => ({
          qty: String(ing.qty ?? ""),
          unit: ing.unit ?? "",
          item: ing.item,
          ...(ing.note ? { note: ing.note } : {}),
        })),
        steps: r.steps,
        tips: (r.tips || []).slice(0, 3),
        imagePrompts: { hero: r.heroImagePrompt, detail: r.detailImagePrompt },
      };

      const body = `${r.intro1}\n\n${r.intro2}\n`;
      fs.writeFileSync(outFile, `---\n${JSON.stringify(data, null, 2)}\n---\n\n${body}`);

      state[i] = slug;
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

      made++;
      console.log(`  ✓ ${slug} ($${data.costPerServing}/srv, ${data.nutrition.protein}g protein)`);
    } catch (e) {
      console.error(`  ✗ FAILED: ${e.message}`);
    }
  }

  // Write IMAGE_TASKS.md for Antigravity image generation.
  // Built from ALL existing recipe files (imagePrompts live in the frontmatter),
  // so incremental runs always produce a complete task list.
  {
    const existing = fs
      .readdirSync(OUT_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => {
        const { data } = matter(fs.readFileSync(path.join(OUT_DIR, f), "utf-8"));
        return data;
      })
      .filter((d) => d.imagePrompts?.hero && d.imagePrompts?.detail);

    if (existing.length > 0) {
      const lines = [
        "# Image generation tasks — for Google Antigravity",
        "",
        "Generate one hero + one detail image per recipe. Save each with the EXACT filename",
        "shown, into `recipe-site/public/images/recipes/`. Use landscape 4:3 (e.g. 1024×768).",
        "The site picks images up automatically on next build.",
        "",
        "General style suffix for every prompt:",
        `"... photorealistic professional food photography, dark rustic wooden table, warm natural window light, shallow depth of field, no text, no logos, no people, no hands."`,
        "",
      ];
      for (const t of existing) {
        lines.push(
          `## ${t.title}`,
          `Files: \`${t.slug}-hero.jpg\` (wide shot) + \`${t.slug}-detail.jpg\` (close-up)`,
          "",
          `- HERO: ${t.imagePrompts.hero}`,
          `- DETAIL: ${t.imagePrompts.detail}`,
          ""
        );
      }
      fs.writeFileSync(path.join(__dirname, "IMAGE_TASKS.md"), lines.join("\n"));
      console.log(`\nWrote IMAGE_TASKS.md with ${existing.length} recipes.`);
    }
  }

  console.log(`\nDone: ${made} new recipes written to content/recipes/.`);
}

main();
