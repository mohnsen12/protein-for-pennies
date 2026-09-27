# ANTIGRAVITY TASK — Protein for Pennies (images + optional remaining recipes)

> **Til Claus:** Åbn Google Antigravity i mappen `Weekend_project`, start en ny agent
> og giv den denne fil som opgave ("Read pipeline/ANTIGRAVITY_TASK.md and execute it").
> Kør DEL A nu, og DEL B kun hvis der stadig mangler opskrifter. Kør bagefter
> `npm run build` i `recipe-site/`.

You are working in the repo rooted at `Weekend_project`. All work happens inside
`recipe-site/`. Execute the tasks below **in order**. Do not modify any `.ts/.tsx`
source files. Do not change any existing recipe `.md` file's structured data.

---

## DEL A — Generate all recipe images (always run this)

Source of truth: `recipe-site/pipeline/IMAGE_TASKS.md`. It lists every recipe with:

- exact target filenames: `<slug>-hero.jpg` and `<slug>-detail.jpg`
- a ready-made HERO prompt (wide appetizing shot) and DETAIL prompt (close-up)

For **every** entry in IMAGE_TASKS.md:

1. Generate the hero image with your image model using the HERO prompt plus this
   style suffix: "photorealistic professional food photography, warm natural window
   light, shallow depth of field, landscape 4:3 aspect ratio, no text, no logos,
   no people, no hands".
2. Save it to `recipe-site/public/images/recipes/<slug>-hero.jpg` (landscape 4:3,
   e.g. 1024×768, JPG).
3. Repeat for the DETAIL prompt → `<slug>-detail.jpg`.
4. Batch 5–10 images per message; keep going until every file in IMAGE_TASKS.md exists.
5. Verify coverage by running from `recipe-site/`: `node pipeline/image-report.mjs`
   — it prints exactly which recipes are still missing images. Repeat until it
   reports 0 missing.

If a generated image looks broken or unappetizing, regenerate it — the feed must
look like one consistent brand (dark rustic table, warm light).

---

## DEL B — Finish missing recipes (ONLY if any are missing)

Current state: `pipeline/state.json` tracks which seeds already have a recipe
(18 of 52 done as of 2026-09-26 evening). Check it first:

1. Run from `recipe-site/`: `node -e "const s=require('./pipeline/state.json');console.log(Object.keys(s).length,'of 52 seeds done')"`
2. If fewer than 52, generate recipes for the missing seeds in `pipeline/seeds.json`
   (the seeds whose array index is NOT a key in state.json):

1. Read ONE existing recipe file first (e.g. `content/recipes/one-pan-crispy-garlic-butter-chicken-and-rice.md`)
   — your output must match its structure **exactly**: a JSON frontmatter block
   between `---` lines with the same fields (title, slug, tagline, category, cuisine,
   servings, prepTime/cookTime/totalTime as `PT…M`, `premium: false`, nutrition,
   costPerServing, costCurrency "USD", tags, keywords, sourceUrl "", ingredients
   [{qty, unit, item, note}], steps[], tips[], imagePrompts {hero, detail}),
   followed by exactly two intro paragraphs as the markdown body.
2. For each missing seed in `pipeline/seeds.json`, write an **original** recipe
   (never copy or closely paraphrase any existing published recipe) following these
   hard rules:
   - cheap US ingredients only; no wine, no specialty items
   - servings 4 (6 for soups); total time 20–45 min (soups/oven up to 60)
   - protein per serving: 25–45 g (meat/egg/fish), 18–30 g (beans/lentils/tofu)
   - calories 400–700; costPerServing realistic US 2026 estimate, under $3.50
   - 5–8 imperative steps; 2–3 concrete budget tips
   - title ≤ 65 chars; slug = kebab-case of the title
   - intro paragraphs in a warm, confident voice, no "I", no filler
   - imagePrompts: photorealistic food photography prompts (hero = wide shot,
     detail = close-up), no text/logos/people/hands
3. **Important — update the seed tracker:** after writing each recipe file, also
   record it in `pipeline/state.json`. The key is the seed's array index in
   `seeds.json` (0-based), the value is the recipe slug. Example:
   `{ "0": "crispy-chicken-thighs-with-garlic-butter-rice", ... }`
   This prevents duplicate recipes if the main pipeline re-runs later.
4. After writing each file, also append its entry to `pipeline/IMAGE_TASKS.md`
   (same format as existing entries) so DEL A can pick it up.
5. Re-run DEL A at the end so the new recipes get images too.

---

## Definition of done

- [ ] `node pipeline/image-report.mjs` reports 0 missing images
- [ ] `pipeline/state.json` tracks all 52 seeds
- [ ] `npm run build` in `recipe-site/` succeeds with no errors
- [ ] report back: number of images generated, number of recipes written

**Do NOT** run `npm run generate:pins`, deploy, or touch Stripe/anything else —
the main agent (ZCode) handles those.
