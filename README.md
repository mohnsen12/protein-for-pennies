# Protein for Pennies — recipe site

English-language recipe site: **cheap high-protein dinners with price-per-serving and
macros on every recipe.** Traffic-first launch (everything free); paywall/monetization
is prepared but switched off.

- Stack: Next.js 15 (static export style, App Router) · light Love & Lemons-inspired design
  (design tokens scraped via Firecrawl from L&L's public CSS — original implementation)
- Content: `content/recipes/*.md` (frontmatter = data, body = intro paragraphs)
- Images: `public/images/recipes/<slug>-hero.jpg` + `<slug>-detail.jpg`
  (generated in **Google Antigravity** — see `pipeline/IMAGE_TASKS.md`)
- Pipeline: `pipeline/` (Gemini text + image tasks + pins + FB teasers)

## Commands

```bash
npm install
npm run dev              # local dev on :3000
npm run build            # production build (fully static)

npm run generate:recipes # generate recipes from pipeline/seeds.json (idempotent — re-run to resume)
npm run image:report     # which recipes still lack images
npm run generate:pins    # Pinterest pins (text pins always; photo pins when hero images exist)
node pipeline/generate-teasers.mjs   # Facebook teaser queue CSV for the n8n workflow
```

## Content rules (baked into the pipeline)

- Recipes are **written from scratch** by Gemini in the site's own voice — classic cooking
  building blocks, never copied or paraphrased from a specific source. `sourceUrl` stays empty.
- Every recipe carries: protein/serving, cost/serving (US estimate), realistic total time,
  ISO-8601 times, and `Schema.org Recipe` JSON-LD for Google rich results.
- Premium flag exists on every recipe (`premium: bool`) — all `false` during traffic phase.
  When monetization starts, flip flags and enable the gate (see below).

## Paywall (phase 2 — currently OFF)

`src/lib/site.ts` has `premiumEnabled: false`. The recipe page, JSON-LD (with
`isAccessibleForFree` + `hasPart` paywalled markup) and `visibleSteps()` already implement
the gate. To activate later: Stripe Checkout subscription ($4.99/mo, test keys exist in
`oneStopCoffeeEU\backend\.env`) + `/api` routes (to be added then) + set `premiumEnabled: true`.

## Environment

`.env.local` holds the Gemini key (reused from kaffelosninger.dk), site URL/name and the
(activated-later) Stripe/SESSION placeholders. See `.env.example`. Never commit `.env.local`.

## Docs

- `DEPLOY.md` — go-live checklist (Vercel, domain, GSC, GA4, Pinterest, n8n FB, ads later)
- `automation/` — n8n Facebook workflow JSON + teaser queue + setup guides
- `PROJECT_STATE.md` (workspace root) — current status & next milestones
