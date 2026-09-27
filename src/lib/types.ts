export interface RecipeIngredient {
  qty: string;
  unit: string;
  item: string;
  note?: string;
}

export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
