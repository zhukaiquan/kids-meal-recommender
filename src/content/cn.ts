import type { FoodTag, MealType } from "../domain/types";

export const mealLabels: Record<MealType, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

export const tagLabels: Record<FoodTag, string> = {
  staple: "主食",
  protein: "蛋白质",
  vegetable: "蔬菜",
  fruit: "水果",
  dairy: "奶制品",
  drink: "饮品",
};
