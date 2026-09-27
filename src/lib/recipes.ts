import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { SITE } from "./site";
import { RecipeIngredient, RecipeNutrition } from "./types";
import { ingredientLine } from "./format";

export { ingredientLine };
export type { RecipeIngredient };

export interface RecipeData {
  title: string;
  slug: string;
  tagline: string;
  category: string;
  cuisine: string;
  servings: number;
  prepTime: string; // ISO 8601 e.g. PT10M
  cookTime: string;
  totalTime: string;
  premium: boolean;
  nutrition: RecipeNutrition;
  costPerServing: number;
  costCurrency: string;
  tags: string[];
  keywords: string[];
  sourceUrl: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  tips: string[];
}

export interface Recipe extends RecipeData {
  intro: string[]; // body paragraphs
  hasHeroImage: boolean;
  hasDetailImage: boolean;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "recipes");
const IMAGES_DIR = path.join(process.cwd(), "public", "images", "recipes");

function loadImageFlag(slug: string, kind: "hero" | "detail"): boolean {
  const jpg = path.join(IMAGES_DIR, `${slug}-${kind}.jpg`);
  const png = path.join(IMAGES_DIR, `${slug}-${kind}.png`);
  return fs.existsSync(jpg) || fs.existsSync(png);
}

function parseRecipe(file: string): Recipe | null {
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);
  const d = data as RecipeData;
  if (!d.title || !d.slug || !Array.isArray(d.steps)) return null;
  return {
    ...d,
    intro: content
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean),
    hasHeroImage: loadImageFlag(d.slug, "hero"),
    hasDetailImage: loadImageFlag(d.slug, "detail"),
  };
}

let cache: Recipe[] | null = null;

export function getAllRecipes(): Recipe[] {
  if (cache) return cache;
  if (!fs.existsSync(CONTENT_DIR)) {
    cache = [];
    return cache;
  }
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const recipes = files
    .map((f) => parseRecipe(path.join(CONTENT_DIR, f)))
    .filter((r): r is Recipe => r !== null);
  // Deterministic order: cheapest protein-first is arbitrary — keep filename sort
  // (generation order) so the home page feels like a stable "season" of recipes.
  recipes.sort((a, b) => a.slug.localeCompare(b.slug));
  cache = recipes;
  return recipes;
}

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return getAllRecipes().find((r) => r.slug === slug);
}

export function getRecipesByCategory(category: string): Recipe[] {
  return getAllRecipes().filter((r) => r.category === category);
}

export function getFeaturedRecipes(count = 8): Recipe[] {
  // Feature recipes with hero images first (they render best), then cheapest.
  const all = getAllRecipes();
  const withImage = all.filter((r) => r.hasHeroImage);
  const without = all.filter((r) => !r.hasHeroImage);
  const cheapest = (a: Recipe, b: Recipe) => a.costPerServing - b.costPerServing;
  return [...[...withImage].sort(cheapest), ...[...without].sort(cheapest)].slice(0, count);
}

export function getRelatedRecipes(recipe: Recipe, count = 3): Recipe[] {
  return getAllRecipes()
    .filter((r) => r.slug !== recipe.slug)
    .sort((a, b) => {
      const score = (r: Recipe) =>
        (r.category === recipe.category ? 2 : 0) +
        (Math.abs(r.costPerServing - recipe.costPerServing) < 0.5 ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, count);
}

export interface SiteStats {
  count: number;
  avgProtein: number;
  avgCost: number;
  categories: string[];
}

export function getSiteStats(): SiteStats {
  const all = getAllRecipes();
  if (all.length === 0) {
    return { count: 0, avgProtein: 0, avgCost: 0, categories: [] };
  }
  const avg = (fn: (r: Recipe) => number) =>
    Math.round(all.reduce((sum, r) => sum + fn(r), 0) / all.length);
  return {
    count: all.length,
    avgProtein: avg((r) => r.nutrition.protein),
    avgCost: Math.round(avg((r) => r.costPerServing * 100) / 100 * 100) / 100,
    categories: [...new Set(all.map((r) => r.category))],
  };
}

// Free-tier visible steps (paywall phase 2: premium recipes show these only)
export function visibleSteps(recipe: Recipe): string[] {
  if (!recipe.premium || SITE.premiumEnabled === false) return recipe.steps;
  return recipe.steps.slice(0, 2);
}

export function isLocked(recipe: Recipe): boolean {
  return recipe.premium && SITE.premiumEnabled === true;
}
