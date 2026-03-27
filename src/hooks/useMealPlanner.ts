import { useMemo, useState } from "react";
import { getLocalDateKey } from "../domain/date";
import { buildEmptyExclusions, generateDailyPlan, refreshMeal } from "../domain/recommender";
import { loadState, saveExclusions, saveFoods, savePlan } from "../domain/storage";
import type { DailyExclusions, FoodItem, FoodTag, MealType } from "../domain/types";

export type FoodDraft = {
  name: string;
  mealTypes: MealType[];
  tags: FoodTag[];
};

function createFoodId(name: string) {
  return `${name.toLowerCase().replace(/\s+/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
}

function createTodayGenerationKey(date: string, foods: FoodItem[]) {
  return JSON.stringify({
    date,
    foods: foods.map((food) => ({
      id: food.id,
      name: food.name,
      enabled: food.enabled,
      mealTypes: [...food.mealTypes].sort(),
      tags: [...food.tags].sort(),
    })),
  });
}

export function useMealPlanner() {
  const initial = useMemo(() => loadState(), []);
  const today = getLocalDateKey();
  const initialGenerationKey = createTodayGenerationKey(today, initial.foods);
  const [foods, setFoods] = useState<FoodItem[]>(initial.foods);
  const [plans, setPlans] = useState(initial.plans);
  const [exclusions, setExclusions] = useState<DailyExclusions[]>(initial.exclusions);
  const [lastAttemptedGenerationKey, setLastAttemptedGenerationKey] = useState<string | null>(() =>
    initial.foods.length === 0 || initial.plans.some((plan) => plan.date === today)
      ? initialGenerationKey
      : null,
  );

  const generationKey = useMemo(() => createTodayGenerationKey(today, foods), [today, foods]);
  const todayPlan = plans.find((plan) => plan.date === today) ?? null;
  const todayExclusions = exclusions.find((item) => item.date === today) ?? buildEmptyExclusions(today);
  const todayPlanStatus =
    foods.length === 0
      ? "empty"
      : todayPlan
        ? "ready"
        : lastAttemptedGenerationKey === generationKey
          ? "failed"
          : "loading";

  function addFood(draft: FoodDraft) {
    const nextFoods = [
      ...foods,
      {
        id: createFoodId(draft.name),
        name: draft.name,
        mealTypes: draft.mealTypes,
        tags: draft.tags,
        enabled: true,
        image: null,
      },
    ];

    setFoods(nextFoods);
    saveFoods(nextFoods);
  }

  function updateFood(nextFood: FoodItem) {
    const nextFoods = foods.map((food) => (food.id === nextFood.id ? nextFood : food));

    setFoods(nextFoods);
    saveFoods(nextFoods);
  }

  function deleteFood(foodId: string) {
    const nextFoods = foods.filter((food) => food.id !== foodId);

    setFoods(nextFoods);
    saveFoods(nextFoods);
  }

  function ensureTodayPlan() {
    if (foods.length === 0) {
      setLastAttemptedGenerationKey(generationKey);
      return;
    }

    setLastAttemptedGenerationKey(generationKey);

    if (todayPlan) {
      return;
    }

    const result = generateDailyPlan({
      date: today,
      foods,
      history: plans,
      exclusions: todayExclusions,
    });

    if (!result.ok) {
      return;
    }

    const nextPlans = [...plans.filter((plan) => plan.date !== today), result.plan];
    const nextExclusions = [...exclusions.filter((item) => item.date !== today), result.exclusions];

    setPlans(nextPlans);
    setExclusions(nextExclusions);
    savePlan(result.plan);
    saveExclusions(result.exclusions);
  }

  function refreshTodayMeal(mealType: MealType) {
    if (!todayPlan) {
      return;
    }

    const result = refreshMeal({
      mealType,
      currentPlan: todayPlan,
      foods,
      history: plans.filter((plan) => plan.date !== today),
      exclusions: todayExclusions,
    });

    if (!result.ok) {
      return;
    }

    const nextPlans = [...plans.filter((plan) => plan.date !== today), result.plan];
    const nextExclusions = [...exclusions.filter((item) => item.date !== today), result.exclusions];

    setPlans(nextPlans);
    setExclusions(nextExclusions);
    savePlan(result.plan);
    saveExclusions(result.exclusions);
  }

  return {
    foods,
    plans,
    todayPlan,
    todayPlanStatus,
    addFood,
    updateFood,
    deleteFood,
    ensureTodayPlan,
    refreshTodayMeal,
  };
}
