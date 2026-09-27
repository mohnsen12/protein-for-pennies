# ANTIGRAVITY DAILY TASK — Protein for Pennies (Curated & Remixed)

> **Til Claus (én gang):** Åbn Google Antigravity i `Weekend_project`-mappen og giv
> agenten denne besked: *"Read `recipe-site/pipeline/ANTIGRAVITY_DAILY_TASK.md`,
> then set up a twice-daily scheduled run (09:30 and 17:30) whose prompt is exactly: Read
> `recipe-site/pipeline/ANTIGRAVITY_DAILY_TASK.md` and execute it fully."*
> Herefter kører Alt automatisk i Antigravity.

You are the daily content engine for the recipe site **Protein for Pennies**
(a Next.js static site in `recipe-site/`).
**MODEL REQUIREMENT:** Always execute this workflow using **Gemini 3.1 Pro (High)** (`Model: "pro"` if delegating to a subagent — NEVER use `flash` or `flash_lite`, and NEVER use the Gemini API keys in `.env.local`). Always use your native `generate_image` tool with a reference image (`ImagePaths`).
Every run produces **1 new recipe — text and images together** — based on curation from top food blogs. Work inside `recipe-site/` only. English content, Danish report at the end.

---

## STEP 0 — Curate from Top 10 Food Blogs

1. Pick an ungenerated seed from `pipeline/seeds.json` (lowest index NOT in `pipeline/state.json`), OR search for a high-protein, budget-friendly dinner recipe from one of the **Top 10 Food Blogs**:
   1. **Green Kitchen Stories** (`greenkitchenstories.com`)
   2. **Half Baked Harvest** (`halfbakedharvest.com`)
   3. **Minimalist Baker** (`minimalistbaker.com`)
   4. **Pinch of Yum** (`pinchofyum.com`)
   5. **Love and Lemons** (`loveandlemons.com`)
   6. **Budget Bytes** (`budgetbytes.com`)
   7. **Skinnytaste** (`skinnytaste.com`)
   8. **Cookie and Kate** (`cookieandkate.com`)
   9. **The First Mess** (`thefirstmess.com`)
   10. **Smitten Kitchen** (`smittenkitchen.com`)
2. Read the recipe page (`read_url_content`) to extract the ingredients, instructions, and download the main food image to a temporary path outside the repo (e.g. `$env:TEMP\ref_food.jpg`).
3. Ensure the recipe fits our narrative: high-protein, healthy, budget-friendly weeknight dinner, and does not duplicate an existing recipe in `content/recipes/`.

## STEP 1 — Write the Recipe (Adjusted)

Write the recipe as a markdown file in `content/recipes/<slug>.md`. Use
`content/recipes/crispy-chicken-thighs-with-garlic-butter-rice.md` as the
**exact structural template**: a JSON frontmatter block between `---` lines, then exactly two intro paragraphs.

Content rules (hard):
- **CRITICAL**: Do NOT copy the text 1:1. Rewrite the intro paragraphs in our warm, confident voice.
- **ADJUSTMENTS**: Adjust the ingredients and steps slightly so it's unique (e.g., swapping a spice, adding beans for protein, changing a vegetable), but KEEP the fundamental cooking science and ratios intact so the recipe works perfectly.
- `imagePrompts.hero` & `detail`: YOU MUST USE OUR FEMALE CHEF POV TEMPLATE:
  "First-person point of view (POV) looking straight down at a dark scratched oak wooden table. The bottom foreground prominently shows the chest and shoulders of a full-figured dark-skinned female food blogger wearing [VARY SWEATER/CARDIGAN], NO HEAD. Both of her sleeved upper arms are raised and angled UPWARDS toward the camera lens at the bottom left and right corners of the frame, making it physically clear that she is holding the camera up in front of her with both hands (her hands and the camera are cropped just out of frame). NEVER show her arms hanging down along her sides, and NEVER show hands or arms on the table. Resting on crumpled baking paper is [INSERT DISH]. EXTREMELY PHOTOREALISTIC, shot on 35mm film, grainy, raw, unpolished, high-end editorial culinary photography, natural harsh window shadows. AVOID glossy, plastic, or overly perfect AI aesthetics."
  *CRITICAL:* For natural variation between recipes, vary the color/knit of her sweater or cardigan and her slight lean distance to the table, while ALWAYS keeping the true first-person POV where her sleeves reach UP toward the camera lens she is holding.

**Immediately update `pipeline/state.json`**: add `"seedIndex": "slug"`.

## STEP 2 — Generate Images using the REMIX Rule

For the new recipe, generate the Hero and Detail images with your image model using the temporary downloaded image as a reference (`ImagePaths`).
- **CRITICAL REMIX RULE**: Use the reference image ONLY to understand the culinary nature of the food. DO NOT copy the original tablecloth, plates, or background. Place the food into OUR Female Chef POV environment described in the prompt.
- `<slug>-hero.jpg` — HERO prompt, landscape 4:3 (1024×768+)
- `<slug>-detail.jpg` — DETAIL prompt, landscape 4:3

Save directly into `recipe-site/public/images/recipes/` with those EXACT filenames (JPG).

## STEP 3 — Refresh all downstream outputs (run in `recipe-site/`)

1. `node pipeline/qa-recipes.mjs`
2. `node pipeline/generate-recipes.mjs --tasks-only`
3. `npm run generate:pins`
4. `node pipeline/generate-teasers.mjs`
5. `npm run build` — must succeed.

## HARD TECHNICAL RULES (learned from past run bugs — never violate)

1. **nutrition values must be plain NUMBERS** (`"protein": 18`), never strings
   like `"22g"` — strings break the macro badges and the Recipe structured data.
2. **Make every nutrition claim REAL.** protein per serving = (protein from the
   actual ingredient quantities) ÷ servings. Example: 4 eggs + 1 can chickpeas
   over 4 servings ≈ 11g, NOT 22g. Scale protein ingredients (more eggs, an
   extra can of beans) until the honest number is ≥ 18g for bean/egg recipes
   and ≥ 25g for meat/fish recipes. Our brand is honest macros.
3. **Always update `pipeline/state.json` immediately after writing each recipe
   file** — a run that forgets causes duplicate recipes later. Use the next
   free index if curating from blogs instead of seeds.json.
4. **Never save downloaded reference images into the repo.** Keep them in a
   temp folder outside `recipe-site/` (or memory only) and delete after use.
   The repo must never contain another site's photo, even temporarily.
5. **Remix must be real:** change at least 2–3 things that matter (a protein
   addition, a technique change, a spice/vegetable swap) and write every
   sentence fresh. If a step would read as a paraphrase of the source's step,
   restructure it (different order, different wording, our voice).
6. **Keep `sourceUrl` set** to the inspiration URL — it is our internal
   compliance log (not shown on the site).
7. If `qa-recipes.mjs` reports near-duplicates, run `node pipeline/qa-recipes.mjs --fix`
   and then `node pipeline/sync-state.mjs` before continuing.

## STEP 4 — Schedule Facebook Post (5 minutes after recipe completion)

Immediately after `npm run build` succeeds, call the `schedule` tool with:
- `DurationSeconds`: `300` (5 minutes)
- `TimerCondition`: `"never"`
- `Prompt`: `"Run node pipeline/post-facebook.mjs inside recipe-site/ to publish the newly created recipe and its hero image to the Protein for Pennies Facebook Page, and report the post ID in Danish."`

## STEP 5 — Report (in Danish, short)
Report the new recipe, the tweaks made, the image generation status, and confirm that the Facebook post is scheduled for 5 minutes from now.
