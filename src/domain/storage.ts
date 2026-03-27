import type { DailyExclusions, DailyPlan, FoodItem } from "./types";

const FOODS_KEY = "foodItems";
const PLANS_KEY = "dailyPlans";
const EXCLUSIONS_KEY = "dailyExclusions";

type PersistedState = {
  foods: FoodItem[];
  plans: DailyPlan[];
  exclusions: DailyExclusions[];
};

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeFood(food: FoodItem): FoodItem {
  return {
    ...food,
    image: food.image ?? null,
  };
}

export function loadState(): PersistedState {
  return {
    foods: readJson(FOODS_KEY, [] as FoodItem[]).map(normalizeFood),
    plans: readJson(PLANS_KEY, [] as DailyPlan[]),
    exclusions: readJson(EXCLUSIONS_KEY, [] as DailyExclusions[]),
  };
}

export function saveFoods(foods: FoodItem[]) {
  localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
}

export function savePlan(plan: DailyPlan) {
  const plans = loadState().plans.filter((item) => item.date !== plan.date);
  localStorage.setItem(PLANS_KEY, JSON.stringify([...plans, plan]));
}

export function saveExclusions(exclusions: DailyExclusions) {
  const items = loadState().exclusions.filter((item) => item.date !== exclusions.date);
  localStorage.setItem(EXCLUSIONS_KEY, JSON.stringify([...items, exclusions]));
}
