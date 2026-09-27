import { RecipeIngredient } from "./types";

export function ingredientLine(ing: RecipeIngredient): string {
  const qty = ing.qty && ing.qty !== "" ? ing.qty : "";
  const unit = ing.unit && ing.unit !== "" ? ing.unit : "";
  return (
    [qty, unit, ing.item].filter(Boolean).join(" ").replace(/\s+/g, " ") +
    (ing.note ? ` (${ing.note})` : "")
  );
}
