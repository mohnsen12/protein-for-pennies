"use client";

import { RecipeIngredient } from "@/lib/types";
import { ingredientLine } from "@/lib/format";

export default function IngredientList({ ingredients }: { ingredients: RecipeIngredient[] }) {
  return (
    <ul className="ingredient-list">
      {ingredients.map((ing, i) => (
        <li key={i}>
          <label>
            <input type="checkbox" />
            <span>{ingredientLine(ing)}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
