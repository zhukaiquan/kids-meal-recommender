export type MealType = "breakfast" | "lunch" | "dinner";

export type FoodTag =
  | "staple"
  | "protein"
  | "vegetable"
  | "fruit"
  | "dairy"
  | "drink";

export type FoodImage = {
  thumbnailUrl: string;
  fullUrl: string;
  sourceName: "wikimedia-commons";
  sourcePageUrl: string;
  authorName: string | null;
  license: string | null;
  searchQuery: string;
};

export type FoodItem = {
  id: string;
  name: string;
  mealTypes: MealType[];
  tags: FoodTag[];
  enabled: boolean;
  image: FoodImage | null;
};

export type MealFoodSnapshot = {
  foodId: string;
  foodNameSnapshot: string;
  tags: FoodTag[];
};

export type MealRecommendation = {
  mealType: MealType;
  foods: MealFoodSnapshot[];
};

export type DailyPlan = {
  date: string;
  breakfast: MealRecommendation;
  lunch: MealRecommendation;
  dinner: MealRecommendation;
  updatedAt: string;
};

export type DailyExclusions = {
  date: string;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
};

export type GenerationError = {
  mealType: MealType;
  missingTags: FoodTag[];
};

export type GenerationResult =
  | { ok: true; plan: DailyPlan; exclusions: DailyExclusions }
  | { ok: false; error: GenerationError };
