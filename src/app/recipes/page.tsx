import type { Metadata } from "next";
import { getAllRecipes } from "@/lib/recipes";
import { CATEGORIES } from "@/lib/site";
import RecipeCard from "@/components/RecipeCard";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "All recipes — cheap high-protein dinners",
  description:
    "Every high-protein budget dinner recipe, organized by protein source. Cost per serving and macros on every recipe.",
};

export default function RecipesIndexPage() {
  const all = getAllRecipes();
  const categories = CATEGORIES.filter((c) => all.some((r) => r.category === c));

  return (
    <>
      <section className="hero container" style={{ paddingBottom: 0 }}>
        <p className="kicker">Every dinner · Every price printed</p>
        <h1 style={{ fontSize: "clamp(30px,4.6vw,46px)" }}>All dinners</h1>
        <p className="sub" style={{ fontSize: 18 }}>
          {all.length} high-protein dinners, each with price per serving, protein per serving,
          and a realistic weeknight cooking time.
        </p>
        <div className="filter-bar">
          <a href="#top" className="filter-chip active">All ({all.length})</a>
          {categories.map((c) => (
            <a key={c} href={`#${encodeURIComponent(c)}`} className="filter-chip">
              {c} ({all.filter((r) => r.category === c).length})
            </a>
          ))}
        </div>
      </section>

      <section className="band band-greige" style={{ marginTop: 36 }}>
        <div className="container" id="top" style={{ scrollMarginTop: 80 }}>
          {categories.map((c) => (
            <div key={c} id={c} style={{ scrollMarginTop: 80, marginBottom: 46 }}>
              <div className="section-head">
                <h2>{c}</h2>
              </div>
              <div className="card-grid">
                {all
                  .filter((r) => r.category === c)
                  .map((r) => (
                    <RecipeCard key={r.slug} recipe={r} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
