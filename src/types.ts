export type FoodResultItem = {
  food: string;
  quantity_grams: number;
};

export type MealSummaryTotals = {
  calories: number;
  carbs: number;
  fat: number;
  fiber: number;
  protein: number;
  energy: number;
};

export type MealResult = {
  message: string;
  foods: FoodResultItem[];
  summary: MealSummaryTotals;
};