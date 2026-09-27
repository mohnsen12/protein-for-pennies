import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllRecipes,
  getRecipeBySlug,
  getRelatedRecipes,
} from "@/lib/recipes";
import { recipeJsonLd } from "@/lib/jsonld";
import RecipeCard from "@/components/RecipeCard";
import IngredientList from "@/components/IngredientList";
import { asset } from "@/lib/paths";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllRecipes().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return {};
  return {
    title: `${recipe.title} — ${recipe.nutrition.protein}g protein, $${recipe.costPerServing.toFixed(2)}/serving`,
    description: recipe.tagline,
    keywords: recipe.keywords,
    alternates: { canonical: `/recipes/${recipe.slug}` },
    openGraph: {
      title: recipe.title,
      description: recipe.tagline,
      images: [
        recipe.hasHeroImage
          ? `/images/recipes/${recipe.slug}-hero.jpg`
          : "/images/default-recipe.jpg",
      ],
    },
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();
  const related = getRelatedRecipes(recipe);
  const totalTime = recipe.totalTime.replace("PT", "").toLowerCase();

  // Prev/next within the full recipe list (alphabetical, same as index order)
  const all = getAllRecipes();
  const idx = all.findIndex((r) => r.slug === recipe.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd(recipe)) }}
      />

      <section className="recipe-hero container">
        <p className="breadcrumb">
          <Link href="/">Home</Link> · <Link href="/recipes">Recipes</Link> ·{" "}
          <Link href={`/recipes#${encodeURIComponent(recipe.category)}`}>{recipe.category}</Link>
        </p>
        <span className="card-tag">{recipe.cuisine}</span>
        <h1>{recipe.title}</h1>
        <p className="tagline">{recipe.tagline}</p>
        <div className="jump-row" id="jump">
          <a href="#recipe-card" className="btn btn-primary">
            Jump to recipe
          </a>
        </div>
        <div className="meta-bar">
          <div className="meta-item">
            <span>Protein</span>
            <strong className="protein-strong">{recipe.nutrition.protein} g</strong>
          </div>
          <div className="meta-item">
            <span>Cost / serving</span>
            <strong className="cost-strong">${recipe.costPerServing.toFixed(2)}</strong>
          </div>
          <div className="meta-item">
            <span>Total time</span>
            <strong>{totalTime}</strong>
          </div>
          <div className="meta-item">
            <span>Servings</span>
            <strong>{recipe.servings}</strong>
          </div>
          <div className="meta-item">
            <span>Calories</span>
            <strong>{recipe.nutrition.calories}</strong>
          </div>
        </div>
      </section>

      <section className="container recipe-layout" id="recipe-card" style={{ scrollMarginTop: 80 }}>
        <aside className="side">
          <div className="recipe-media">
            {recipe.hasHeroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset(`/images/recipes/${recipe.slug}-hero.jpg`)} alt={recipe.title} width={680} height={680} />
            ) : (
              <div className="img-placeholder">
                <span>{recipe.title}</span>
              </div>
            )}
          </div>
          <div className="macro-card">
            <h2>Macros per serving</h2>
            <div className="macro-rows">
              <div className="macro-item">
                <span>Calories</span>
                <strong>{recipe.nutrition.calories}</strong>
              </div>
              <div className="macro-item">
                <span>Protein</span>
                <strong className="protein-strong">{recipe.nutrition.protein} g</strong>
              </div>
              <div className="macro-item">
                <span>Carbs</span>
                <strong>{recipe.nutrition.carbs} g</strong>
              </div>
              <div className="macro-item">
                <span>Fat</span>
                <strong>{recipe.nutrition.fat} g</strong>
              </div>
              <div className="macro-item">
                <span>Prep</span>
                <strong>{recipe.prepTime.replace("PT", "").toLowerCase()}</strong>
              </div>
              <div className="macro-item">
                <span>Cook</span>
                <strong>{recipe.cookTime.replace("PT", "").toLowerCase()}</strong>
              </div>
            </div>
          </div>
        </aside>

        <article>
          <div className="recipe-section intro-copy">
            {recipe.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="recipe-section">
            <h2>Ingredients</h2>
            <IngredientList ingredients={recipe.ingredients} />
          </div>

          <div className="recipe-section">
            <h2>Instructions</h2>
            <ol className="step-list">
              {recipe.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          {recipe.tips.length > 0 && (
            <div className="tips-callout">
              <h2>Budget &amp; prep tips</h2>
              <ul className="tips-list">
                {recipe.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {(prev || next) && (
            <nav className="prevnext" aria-label="Recipe navigation">
              {prev ? (
                <a href={`/recipes/${prev.slug}`} className="prev">
                  ← {prev.title}
                </a>
              ) : (
                <span />
              )}
              {next && (
                <a href={`/recipes/${next.slug}`} className="next">
                  {next.title} →
                </a>
              )}
            </nav>
          )}
        </article>
      </section>

      <section className="band band-greige">
        <div className="container">
          <div className="section-head">
            <h2>More cheap high-protein dinners</h2>
            <Link href="/recipes" className="see-all">
              See all
            </Link>
          </div>
          <div className="card-grid">
            {related.map((r) => (
              <RecipeCard key={r.slug} recipe={r} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
