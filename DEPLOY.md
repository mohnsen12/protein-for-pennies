# DEPLOY — go-live checklist

Order matters. Steps marked **[Claus]** need your accounts/logins; everything else is done.

## 1. Domain **[Claus]**
Buy the domain (~$10/year at Namecheap/Porkbun/Cloudflare). Candidates in order:
1. `proteinforpennies.com` (first choice — matches brand)
2. `proteinforpennies.net`
3. `budgetproteindinners.com`
Point it at Vercel after step 2 (Vercel → Project → Domains → follow the DNS instructions).

## 2. Deploy to Vercel **[Claus]**
```bash
# in recipe-site/
npm i -g vercel   # if not installed
vercel            # link project
vercel --prod
```
- Add the domain from step 1 in the Vercel dashboard.
- Set Environment Variables in Vercel (Project → Settings → Environment Variables):
  `NEXT_PUBLIC_SITE_URL` = your final https URL (important — drives sitemap/JSON-LD/OG URLs).
  Optionally `NEXT_PUBLIC_SITE_NAME`. No other vars are needed for the traffic phase.
- Redeploy after setting them.

## 3. Verify the site
- All recipe pages load, meal plan loads, sitemap.xml + robots.txt respond.
- Test one recipe URL in https://validator.schema.org (Recipe rich result should validate).
- Run https://pagespeed.web.dev — static Next.js should be 95+ everywhere.

## 4. Google Search Console **[Claus]**
- Add property (domain), verify via DNS TXT record.
- Submit `https://<domain>/sitemap.xml`.
- Request indexing for: home, /recipes, /meal-plan + your 10 best recipes.
- Expect: indexing trickle after ~3-7 days, meaningful impressions after 4-8 weeks.

## 5. Google Analytics 4 **[Claus]**
- Create GA4 property → get Measurement ID (G-XXXXXXX).
- Add to Vercel env as `NEXT_PUBLIC_GA_ID` and tell Claus — the tag needs the
  layout snippet enabled (one-line add in `src/app/layout.tsx`, marked TODO below).
- Alternative: Vercel's built-in Web Analytics (2 clicks, no code) — fine for phase 1.

## 6. Pinterest — the traffic engine **[Claus]**
1. Create a **Pinterest Business account** (free) as "Protein for Pennies".
2. Claim the domain (Settings → Claim) via meta tag or DNS.
3. Boards to create (fill with pins from `public/pins/`, 5 pins/day max per board):
   - High-Protein Budget Dinners
   - Cheap Chicken Dinners
   - Ground Beef Recipes
   - Vegetarian Protein Dinners
   - Meal Plans on a Budget
4. Pin from `pipeline/pinterest-queue.csv` (title, image, link, description — copy-paste
   ready). 3–5 pins/day beats 50 in one day. Prefer photo pins once Antigravity
   images are in.
5. After ~2-4 weeks, consider the Pinterest API for scheduling (needs developer app)
   or a cheap scheduler (Buffer/Tailwind) — manual pinning is fine to start.

## 7. Facebook via n8n **[Claus]**
1. Create a Facebook Page for the brand.
2. Google Sheet: import `automation/teaser-queue.csv` (has Date/Content/Link/Status).
3. n8n: import `automation/n8n-facebook-recipe-workflow.json`:
   - paste the new Google Sheet ID into the 3 Google Sheets nodes
   - paste the new Facebook Page ID into the HTTP node
   - select your existing Google Sheets + Facebook Graph credentials (same as kaffeløsninger)
4. Activate. It posts 1 teaser/day at 17:00 and flips Status to "Posted".

## 8. Antigravity images (parallel track)
Run `pipeline/IMAGE_TASKS.md` in Google Antigravity (see `automation/IMAGE_WORKFLOW.md`).
After adding images: `npm run image:report` → `npm run generate:pins` → redeploy.

## 9. Monetization (later — roughly when 5-10k monthly sessions)
- **AdSense** can apply early but pays poorly until ~10k sessions; **Journey by Mediavine**
  opens at 10,000 sessions/month (RPM $10-30 in food niche) — the realistic first ad goal.
- **Amazon Associates**: apply when the site has real content (done) and some traffic.
  Add kitchen-equipment links inside recipes.
- **Premium membership**: flip `premiumEnabled` in `src/lib/site.ts`, mark ~15 recipes
  `premium: true`, build Stripe routes (test keys: `oneStopCoffeeEU\backend\.env`),
  then launch at $4.99/mo with the weekly meal plan as the paid hook.

## Weekly operating rhythm (after launch)
- 5 new recipes/week: add seeds to `pipeline/seeds.json` → `npm run generate:recipes`
  (idempotent; can be cron'd overnight like the other projects)
- 25 pins/week (5/day)
- Facebook teasers: automatic via n8n
- Monthly: check GSC queries → write recipes targeting the queries you already rank for
