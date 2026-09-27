import type { Metadata } from "next";
import Link from "next/link";
import { getAllRecipes } from "@/lib/recipes";
import RecipeCard from "@/components/RecipeCard";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "This week's high-protein meal plan (free)",
  description:
    "A free 7-day high-protein dinner plan on a budget — every dinner under $3.50 a serving, with a full grocery list.",
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function pickWeek(all: ReturnType<typeof getAllRecipes>) {
  // Deterministic "week": spread across categories, cheapest-friendly, stable order.
  const pools = new Map<string, typeof all>();
  for (const r of all) {
    if (!pools.has(r.category)) pools.set(r.category, []);
    pools.get(r.category)!.push(r);
  }
  const ordered: string[] = [
    "Chicken",
    "Ground Beef",
    "Canned Fish",
    "Beans & Lentils",
    "Eggs",
    "Turkey & Pork",
    "Bowls & Pasta",
  ];
  const picked: typeof all = [];
  for (const cat of ordered) {
    const pool = pools.get(cat);
    if (pool && pool.length > 0) {
      const cheapest = [...pool].sort((a, b) => a.costPerServing - b.costPerServing)[0];
      picked.push(cheapest);
      pools.get(cat)!.splice(pools.get(cat)!.indexOf(cheapest), 1);
    }
    if (picked.length === 7) break;
  }
  // Fill remaining days from whatever is left, cheapest first
  if (picked.length < 7) {
    const used = new Set(picked.map((r) => r.slug));
    for (const r of [...all].sort((a, b) => a.costPerServing - b.costPerServing)) {
      if (picked.length === 7) break;
      if (!used.has(r.slug)) {
        picked.push(r);
        used.add(r.slug);
      }
    }
  }
  return picked;
}

export default function MealPlanPage() {
  const all = getAllRecipes();
  const week = pickWeek(all);
  const totalCost = week.reduce((s, r) => s + r.costPerServing, 0);
  const avgProtein = Math.round(week.reduce((s, r) => s + r.nutrition.protein, 0) / (week.length || 1));

  // Grocery list: aggregate ingredient items (qty text) grouped by recipe
  const grocery = week.flatMap((r) =>
    r.ingredients.map((i) => ({ recipe: r.title, slug: r.slug, line: `${i.qty} ${i.unit} ${i.item}`.replace(/\s+/g, " ").trim() }))
  );

  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="container">
        <h1 style={{ fontSize: "clamp(32px,5vw,46px)" }}>This week&apos;s protein plan</h1>
        <p style={{ color: "var(--muted)", marginTop: 10, maxWidth: 640 }}>
          Seven budget dinners, one plan. Average <strong style={{ color: "var(--protein)" }}>{avgProtein}g protein</strong>{" "}
          per serving and roughly{" "}
          <strong style={{ color: "var(--accent)" }}>${(totalCost / 7).toFixed(2)} per dinner</strong>.
          Free to use — print it, pin it, cook it.
        </p>

        {DAYS.map((day, i) => {
          const r = week[i];
          if (!r) return null;
          return (
            <div key={day} className="plan-day">
              <div className="plan-day-head">
                <h2>
                  {day} — {r.title}
                </h2>
                <div className="card-meta">
                  <span className="protein-badge">{r.nutrition.protein}g protein</span>
                  <span className="cost-badge">${r.costPerServing.toFixed(2)}/serving</span>
                </div>
              </div>
              <p style={{ color: "var(--muted)", marginBottom: 14 }}>{r.tagline}</p>
              <div style={{ maxWidth: 380 }}>
                <RecipeCard recipe={r} />
              </div>
            </div>
          );
        })}

        <div className="recipe-section" style={{ marginTop: 50 }}>
          <h2>Full grocery list</h2>
          <p style={{ color: "var(--muted)", marginBottom: 16 }}>
            Everything below feeds the full plan ({week.length} dinners). Check your pantry first —
            salt, oil, and basic spices are assumed.
          </p>
          <ul className="ingredient-list" style={{ gridTemplateColumns: "1fr" }}>
            {grocery.map((g, i) => (
              <li key={i} style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                <span>{g.line}</span>
                <span style={{ color: "var(--faint)", fontSize: 13 }}>
                  <Link href={`/recipes/${g.slug}`}>{g.recipe}</Link>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
