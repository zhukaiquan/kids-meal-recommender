import type {
  DailyExclusions,
  DailyPlan,
  FoodItem,
  FoodTag,
  GenerationResult,
  MealRecommendation,
  MealType,
} from "./types";

type RandomFn = () => number;

type EngineInput = {
  date: string;
  foods: FoodItem[];
  history: DailyPlan[];
  exclusions: DailyExclusions;
  random?: RandomFn;
};

type RefreshInput = {
  mealType: MealType;
  currentPlan: DailyPlan;
  foods: FoodItem[];
  history: DailyPlan[];
  exclusions: DailyExclusions;
  random?: RandomFn;
};

const TEMPLATES: Record<MealType, FoodTag[][]> = {
  breakfast: [["staple"], ["protein", "dairy"], ["fruit", "drink"]],
  lunch: [["staple"], ["protein"], ["vegetable"]],
  dinner: [["staple"], ["protein"], ["vegetable"]],
};

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export function buildEmptyExclusions(date: string): DailyExclusions {
  return { date, breakfast: [], lunch: [], dinner: [] };
}

function weightedPick(items: Array<{ id: string; weight: number }>, random: RandomFn): string | null {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) {
    return null;
  }

  let cursor = random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.id;
    }
  }

  return items[items.length - 1]?.id ?? null;
}

function buildRecentFoodSet(history: DailyPlan[], date: string): Set<string> {
  const currentDate = new Date(`${date}T00:00:00`);
  const cutoff = new Date(currentDate);
  cutoff.setDate(cutoff.getDate() - 7);

  return new Set(
    history
      .filter((plan) => {
        const planDate = new Date(`${plan.date}T00:00:00`);
        return planDate >= cutoff && planDate < currentDate;
      })
      .flatMap((plan) => [plan.breakfast, plan.lunch, plan.dinner])
      .flatMap((meal) => meal.foods)
      .map((food) => food.foodId),
  );
}

function buildMissingTags(mealType: MealType): FoodTag[] {
  return [...new Set(TEMPLATES[mealType].flat())];
}

function pickMeal(
  mealType: MealType,
  foods: FoodItem[],
  recentFoodIds: Set<string>,
  exclusions: string[],
  usedToday: Set<string>,
  random: RandomFn,
): MealRecommendation | null {
  const selected: FoodItem[] = [];

  for (const acceptedTags of TEMPLATES[mealType]) {
    const candidates = foods.filter(
      (food) =>
        food.enabled &&
        food.mealTypes.includes(mealType) &&
        food.tags.some((tag) => acceptedTags.includes(tag)) &&
        !exclusions.includes(food.id) &&
        !selected.some((item) => item.id === food.id),
    );

    const weightedCandidates = candidates.map((food) => {
      let weight = 1;

      if (recentFoodIds.has(food.id)) {
        weight *= 0.25;
      }

      if (usedToday.has(food.id)) {
        weight *= 0.15;
      }

      return { id: food.id, weight };
    });

    const chosenId = weightedPick(weightedCandidates, random);
    const chosen = candidates.find((food) => food.id === chosenId);

    if (!chosen) {
      return null;
    }

    selected.push(chosen);
    usedToday.add(chosen.id);
  }

  return {
    mealType,
    foods: selected.map((food) => ({
      foodId: food.id,
      foodNameSnapshot: food.name,
      tags: food.tags,
    })),
  };
}

export function generateDailyPlan(input: EngineInput): GenerationResult {
  const random = input.random ?? Math.random;
  const recentFoodIds = buildRecentFoodSet(input.history, input.date);
  const usedToday = new Set<string>();

  const breakfast = pickMeal("breakfast", input.foods, recentFoodIds, input.exclusions.breakfast, usedToday, random);
  if (!breakfast) {
    return { ok: false, error: { mealType: "breakfast", missingTags: buildMissingTags("breakfast") } };
  }

  const lunch = pickMeal("lunch", input.foods, recentFoodIds, input.exclusions.lunch, usedToday, random);
  if (!lunch) {
    return { ok: false, error: { mealType: "lunch", missingTags: buildMissingTags("lunch") } };
  }

  const dinner = pickMeal("dinner", input.foods, recentFoodIds, input.exclusions.dinner, usedToday, random);
  if (!dinner) {
    return { ok: false, error: { mealType: "dinner", missingTags: buildMissingTags("dinner") } };
  }

  return {
    ok: true,
    exclusions: input.exclusions,
    plan: {
      date: input.date,
      breakfast,
      lunch,
      dinner,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function refreshMeal(input: RefreshInput): GenerationResult {
  const currentMeal = input.currentPlan[input.mealType];
  const nextExclusions: DailyExclusions = {
    ...input.exclusions,
    [input.mealType]: [
      ...new Set([...input.exclusions[input.mealType], ...currentMeal.foods.map((food) => food.foodId)]),
    ],
  };
  const random = input.random ?? Math.random;
  const recentFoodIds = buildRecentFoodSet(input.history, input.currentPlan.date);
  const usedToday = new Set(
    MEAL_TYPES.filter((mealType) => mealType !== input.mealType)
      .flatMap((mealType) => input.currentPlan[mealType].foods)
      .map((food) => food.foodId),
  );

  const regeneratedMeal = pickMeal(
    input.mealType,
    input.foods,
    recentFoodIds,
    nextExclusions[input.mealType],
    usedToday,
    random,
  );

  if (!regeneratedMeal) {
    return {
      ok: false,
      error: { mealType: input.mealType, missingTags: buildMissingTags(input.mealType) },
    };
  }

  return {
    ok: true,
    exclusions: nextExclusions,
    plan: {
      ...input.currentPlan,
      [input.mealType]: regeneratedMeal,
      updatedAt: new Date().toISOString(),
    },
  };
}
