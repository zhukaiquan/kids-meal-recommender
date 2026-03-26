import { describe, expect, it } from "vitest";
import { buildEmptyExclusions, generateDailyPlan, refreshMeal } from "./recommender";
import type { DailyPlan, FoodItem } from "./types";

const foods: FoodItem[] = [
  { id: "toast", name: "Toast", mealTypes: ["breakfast"], tags: ["staple"], enabled: true },
  { id: "egg", name: "Egg", mealTypes: ["breakfast", "lunch", "dinner"], tags: ["protein"], enabled: true },
  { id: "milk", name: "Milk", mealTypes: ["breakfast"], tags: ["dairy", "drink"], enabled: true },
  { id: "banana", name: "Banana", mealTypes: ["breakfast"], tags: ["fruit"], enabled: true },
  { id: "rice", name: "Rice", mealTypes: ["lunch", "dinner"], tags: ["staple"], enabled: true },
  { id: "beef", name: "Beef", mealTypes: ["lunch", "dinner"], tags: ["protein"], enabled: true },
  { id: "broccoli", name: "Broccoli", mealTypes: ["lunch", "dinner"], tags: ["vegetable"], enabled: true },
  { id: "noodles", name: "Noodles", mealTypes: ["lunch", "dinner"], tags: ["staple"], enabled: true },
  { id: "tofu", name: "Tofu", mealTypes: ["lunch", "dinner"], tags: ["protein"], enabled: true },
  { id: "carrot", name: "Carrot", mealTypes: ["lunch", "dinner"], tags: ["vegetable"], enabled: true },
];

const historyPlan: DailyPlan = {
  date: "2026-03-25",
  breakfast: { mealType: "breakfast", foods: [{ foodId: "toast", foodNameSnapshot: "Toast", tags: ["staple"] }] },
  lunch: { mealType: "lunch", foods: [{ foodId: "rice", foodNameSnapshot: "Rice", tags: ["staple"] }] },
  dinner: { mealType: "dinner", foods: [{ foodId: "beef", foodNameSnapshot: "Beef", tags: ["protein"] }] },
  updatedAt: "2026-03-25T12:00:00.000Z",
};

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
}

describe("recommender", () => {
  it("generates all three meals when enough tagged foods exist", () => {
    const result = generateDailyPlan({
      date: "2026-03-26",
      foods,
      history: [],
      exclusions: buildEmptyExclusions("2026-03-26"),
      random: sequenceRandom([0, 0, 0, 0, 0, 0, 0, 0, 0]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.plan.breakfast.foods).toHaveLength(3);
    expect(result.plan.lunch.foods).toHaveLength(3);
    expect(result.plan.dinner.foods).toHaveLength(3);
  });

  it("prefers foods outside the recent seven-day history when alternatives exist", () => {
    const result = generateDailyPlan({
      date: "2026-03-26",
      foods,
      history: [historyPlan],
      exclusions: buildEmptyExclusions("2026-03-26"),
      random: sequenceRandom([0.9, 0.9, 0.9, 0.3, 0.9, 0.9, 0.9, 0.1, 0.1]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.plan.breakfast.foods.map((food) => food.foodId)).toEqual(["toast", "milk", "banana"]);
    expect(result.plan.lunch.foods.map((food) => food.foodId)).not.toContain("rice");
    expect(result.plan.dinner.foods.map((food) => food.foodId)).not.toContain("beef");
  });

  it("excludes refreshed foods from the same meal for the rest of the day", () => {
    const initialResult = generateDailyPlan({
      date: "2026-03-26",
      foods,
      history: [],
      exclusions: buildEmptyExclusions("2026-03-26"),
      random: sequenceRandom([0, 0, 0, 0, 0, 0, 0, 0, 0]),
    });

    expect(initialResult.ok).toBe(true);
    if (!initialResult.ok) {
      return;
    }

    const refreshedResult = refreshMeal({
      mealType: "lunch",
      currentPlan: initialResult.plan,
      foods,
      history: [],
      exclusions: initialResult.exclusions,
      random: sequenceRandom([0, 0, 0]),
    });

    expect(refreshedResult.ok).toBe(true);
    if (!refreshedResult.ok) {
      return;
    }

    expect(refreshedResult.exclusions.lunch).toEqual(
      initialResult.plan.lunch.foods.map((food) => food.foodId),
    );
    expect(refreshedResult.plan.lunch.foods.map((food) => food.foodId)).toEqual(["noodles", "beef", "carrot"]);
  });

  it("keeps breakfast and dinner unchanged when lunch is refreshed", () => {
    const initialResult = generateDailyPlan({
      date: "2026-03-26",
      foods,
      history: [],
      exclusions: buildEmptyExclusions("2026-03-26"),
      random: sequenceRandom([0, 0, 0, 0, 0, 0, 0, 0, 0]),
    });

    expect(initialResult.ok).toBe(true);
    if (!initialResult.ok) {
      return;
    }

    const originalBreakfast = initialResult.plan.breakfast;
    const originalDinner = initialResult.plan.dinner;

    const refreshedResult = refreshMeal({
      mealType: "lunch",
      currentPlan: initialResult.plan,
      foods,
      history: [],
      exclusions: initialResult.exclusions,
      random: sequenceRandom([0, 0, 0]),
    });

    expect(refreshedResult.ok).toBe(true);
    if (!refreshedResult.ok) {
      return;
    }

    expect(refreshedResult.plan.breakfast).toEqual(originalBreakfast);
    expect(refreshedResult.plan.dinner).toEqual(originalDinner);
  });

  it("does not penalize foods from later meals when refreshing lunch", () => {
    const currentPlan: DailyPlan = {
      date: "2026-03-26",
      breakfast: {
        mealType: "breakfast",
        foods: [
          { foodId: "toast", foodNameSnapshot: "Toast", tags: ["staple"] },
          { foodId: "milk", foodNameSnapshot: "Milk", tags: ["dairy", "drink"] },
          { foodId: "banana", foodNameSnapshot: "Banana", tags: ["fruit"] },
        ],
      },
      lunch: {
        mealType: "lunch",
        foods: [
          { foodId: "noodles", foodNameSnapshot: "Noodles", tags: ["staple"] },
          { foodId: "tofu", foodNameSnapshot: "Tofu", tags: ["protein"] },
          { foodId: "carrot", foodNameSnapshot: "Carrot", tags: ["vegetable"] },
        ],
      },
      dinner: {
        mealType: "dinner",
        foods: [
          { foodId: "rice", foodNameSnapshot: "Rice", tags: ["staple"] },
          { foodId: "beef", foodNameSnapshot: "Beef", tags: ["protein"] },
          { foodId: "broccoli", foodNameSnapshot: "Broccoli", tags: ["vegetable"] },
        ],
      },
      updatedAt: "2026-03-26T12:00:00.000Z",
    };

    const refreshedResult = refreshMeal({
      mealType: "lunch",
      currentPlan,
      foods,
      history: [],
      exclusions: buildEmptyExclusions("2026-03-26"),
      random: sequenceRandom([0, 0.6, 0]),
    });

    expect(refreshedResult.ok).toBe(true);
    if (!refreshedResult.ok) {
      return;
    }

    expect(refreshedResult.plan.lunch.foods.map((food) => food.foodId)).toEqual(["rice", "beef", "broccoli"]);
  });
});
