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
  updatedAt?: string;
};

type RefreshInput = {
  mealType: MealType;
  currentPlan: DailyPlan;
  foods: FoodItem[];
  history: DailyPlan[];
  exclusions: DailyExclusions;
  random?: RandomFn;
  updatedAt?: string;
};

const TEMPLATES: Record<MealType, FoodTag[][]> = {
  breakfast: [["staple"], ["protein", "dairy"], ["fruit", "drink"]],
  lunch: [["staple"], ["protein"], ["vegetable"]],
  dinner: [["staple"], ["protein"], ["vegetable"]],
};

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

type MealPickResult =
  | { ok: true; meal: MealRecommendation }
  | { ok: false; missingTags: FoodTag[] };

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

function normalizeExclusions(exclusions: DailyExclusions, activeDate: string): DailyExclusions {
  if (exclusions.date === activeDate) {
    return exclusions;
  }

  return buildEmptyExclusions(activeDate);
}

function pickMeal(
  mealType: MealType,
  foods: FoodItem[],
  recentFoodIds: Set<string>,
  exclusions: string[],
  usedToday: Set<string>,
  random: RandomFn,
): MealPickResult {
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
      return { ok: false, missingTags: acceptedTags };
    }

    selected.push(chosen);
    usedToday.add(chosen.id);
  }

  return {
    ok: true,
    meal: {
      mealType,
      foods: selected.map((food) => ({
        foodId: food.id,
        foodNameSnapshot: food.name,
        tags: food.tags,
      })),
    },
  };
}

export function generateDailyPlan(input: EngineInput): GenerationResult {
  const random = input.random ?? Math.random;
  const recentFoodIds = buildRecentFoodSet(input.history, input.date);
  const exclusions = normalizeExclusions(input.exclusions, input.date);
  const usedToday = new Set<string>();

  const breakfast = pickMeal("breakfast", input.foods, recentFoodIds, exclusions.breakfast, usedToday, random);
  if (!breakfast.ok) {
    return { ok: false, error: { mealType: "breakfast", missingTags: breakfast.missingTags } };
  }

  const lunch = pickMeal("lunch", input.foods, recentFoodIds, exclusions.lunch, usedToday, random);
  if (!lunch.ok) {
    return { ok: false, error: { mealType: "lunch", missingTags: lunch.missingTags } };
  }

  const dinner = pickMeal("dinner", input.foods, recentFoodIds, exclusions.dinner, usedToday, random);
  if (!dinner.ok) {
    return { ok: false, error: { mealType: "dinner", missingTags: dinner.missingTags } };
  }

  return {
    ok: true,
    exclusions,
    plan: {
      date: input.date,
      breakfast: breakfast.meal,
      lunch: lunch.meal,
      dinner: dinner.meal,
      updatedAt: input.updatedAt ?? `${input.date}T00:00:00.000Z`,
    },
  };
}

export function refreshMeal(input: RefreshInput): GenerationResult {
  const currentMeal = input.currentPlan[input.mealType];
  const exclusions = normalizeExclusions(input.exclusions, input.currentPlan.date);
  const nextExclusions: DailyExclusions = {
    ...exclusions,
    [input.mealType]: [
      ...new Set([...exclusions[input.mealType], ...currentMeal.foods.map((food) => food.foodId)]),
    ],
  };
  const random = input.random ?? Math.random;
  const recentFoodIds = buildRecentFoodSet(input.history, input.currentPlan.date);
  const refreshMealIndex = MEAL_TYPES.indexOf(input.mealType);
  const usedToday = new Set(
    MEAL_TYPES.slice(0, refreshMealIndex)
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

  if (!regeneratedMeal.ok) {
    return {
      ok: false,
      error: { mealType: input.mealType, missingTags: regeneratedMeal.missingTags },
    };
  }

  return {
    ok: true,
    exclusions: nextExclusions,
    plan: {
      ...input.currentPlan,
      [input.mealType]: regeneratedMeal.meal,
      updatedAt: input.updatedAt ?? input.currentPlan.updatedAt,
    },
  };
}
