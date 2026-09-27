import Link from "next/link";
import { getAllRecipes, getSiteStats } from "@/lib/recipes";
import { CATEGORIES } from "@/lib/site";
import RecipeCard from "@/components/RecipeCard";
import { websiteJsonLd } from "@/lib/jsonld";
import { asset } from "@/lib/paths";

export const dynamic = "force-static";

export default function HomePage() {
  const stats = getSiteStats();
  const all = getAllRecipes();
  const [latest, ...rest] = all.slice().reverse();
  const cheapest = [...all].sort((a, b) => a.costPerServing - b.costPerServing).slice(0, 4);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />

      {/* Hero */}
      <section className="hero container">
        <p className="kicker">High-protein · Budget · Every dinner under $3</p>
        <h1>
          Strong food, <em>small bill.</em>
        </h1>
        <p className="sub">
          Cheap dinner recipes built around protein — with the macros and the price per
          serving printed right on every recipe.
        </p>
        <div className="stats">
          <span className="stat-chip"><strong>{stats.count}</strong> recipes</span>
          <span className="stat-chip">avg <strong>{stats.avgProtein}g</strong> protein</span>
          <span className="stat-chip">avg <strong>${stats.avgCost.toFixed(2)}</strong>/serving</span>
        </div>
      </section>

      {/* Mint browse band (L&L search-band pattern) */}
      <section className="band band-mint" style={{ marginTop: 40 }}>
        <div className="container">
          <div className="section-head">
            <h2>What are you cooking tonight?</h2>
          </div>
          <div className="tag-row">
            {CATEGORIES.map((c) => {
              const n = all.filter((r) => r.category === c).length;
              if (n === 0) return null;
              return (
                <Link key={c} href={`/recipes#${encodeURIComponent(c)}`}>
                  {c} <span>({n})</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest — horizontal featured card */}
      {latest && (
        <section className="band">
          <div className="container">
            <div className="section-head">
              <h2>Fresh this week</h2>
            </div>
            <Link href={`/recipes/${latest.slug}`} className="featured-card" style={{ boxShadow: "0 0 0 1px var(--hairline)" }}>
              <div className="featured-media">
                {latest.hasHeroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset(`/images/recipes/${latest.slug}-hero.jpg`)} alt={latest.title} width={600} height={600} />
                ) : (
                  <div className="img-placeholder"><span>{latest.title}</span></div>
                )}
              </div>
              <div className="featured-body">
                <span className="card-tag">Latest recipe</span>
                <h3>{latest.title}</h3>
                <p>{latest.tagline}</p>
                <div className="card-meta" style={{ marginTop: 4 }}>
                  <span className="protein-badge">{latest.nutrition.protein}g protein</span>
                  <span className="cost-badge">${latest.costPerServing.toFixed(2)}/srv</span>
                  <span>{latest.totalTime.replace("PT", "").toLowerCase()}</span>
                </div>
                <span className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 8 }}>
                  Get the recipe
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Cheapest — cards on greige band */}
      <section className="band band-greige">
        <div className="container">
          <div className="section-head">
            <h2>The cheapest protein on the site</h2>
            <Link href="/recipes" className="see-all">See all {stats.count} dinners</Link>
          </div>
          <div className="card-grid">
            {cheapest.map((r) => (
              <RecipeCard key={r.slug} recipe={r} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="band">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Eat high-protein on a grocery budget</h2>
              <p>
                Seven budget dinners, one plan — our free weekly meal plan with a full
                grocery list. Print it, pin it, cook it.
              </p>
            </div>
            <Link href="/meal-plan" className="btn btn-primary">
              This week&apos;s plan
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
