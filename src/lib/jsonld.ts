import { Recipe, ingredientLine } from "./recipes";
import { SITE } from "./site";

export function recipeJsonLd(recipe: Recipe) {
  const url = `${SITE.url}/recipes/${recipe.slug}`;
  const heroImage = [
    `${SITE.url}/images/recipes/${recipe.slug}-hero.jpg`,
    // Always include an existing fallback so rich results never point at a 404 image
    `${SITE.url}/images/default-recipe.jpg`,
  ];

  const locked = recipe.premium && SITE.premiumEnabled;

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.tagline,
    image: heroImage,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    datePublished: "2026-09-26",
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime,
    recipeCategory: recipe.category,
    recipeCuisine: recipe.cuisine,
    recipeYield: `${recipe.servings} servings`,
    keywords: recipe.keywords.join(", "),
    recipeIngredient: recipe.ingredients.map(ingredientLine),
    recipeInstructions: (locked ? recipe.steps.slice(0, 2) : recipe.steps).map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
    nutrition: {
      "@type": "NutritionInformation",
      calories: `${recipe.nutrition.calories} kcal`,
      proteinContent: `${recipe.nutrition.protein} g`,
      carbohydrateContent: `${recipe.nutrition.carbs} g`,
      fatContent: `${recipe.nutrition.fat} g`,
    },
    // Paywall compliance (only matters once premiumEnabled is true):
    ...(locked
      ? {
          isAccessibleForFree: false,
          hasPart: {
            "@type": "WebPageElement",
            isAccessibleForFree: false,
            cssSelector: ".paywalled",
          },
        }
      : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}
