import { beforeEach, describe, expect, it } from "vitest";
import { loadState, saveFoods, savePlan, saveExclusions } from "./storage";
import type { DailyExclusions, DailyPlan, FoodItem } from "./types";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty defaults before any data is saved", () => {
    expect(loadState()).toEqual({
      foods: [],
      plans: [],
      exclusions: [],
    });
  });

  it("round-trips foods, plans, and exclusions", () => {
    const foods: FoodItem[] = [
      { id: "egg", name: "Egg", mealTypes: ["breakfast"], tags: ["protein"], enabled: true },
    ];
    const plan: DailyPlan = {
      date: "2026-03-26",
      breakfast: {
        mealType: "breakfast",
        foods: [{ foodId: "egg", foodNameSnapshot: "Egg", tags: ["protein"] }],
      },
      lunch: { mealType: "lunch", foods: [] },
      dinner: { mealType: "dinner", foods: [] },
      updatedAt: "2026-03-26T08:00:00.000Z",
    };
    const exclusions: DailyExclusions = {
      date: "2026-03-26",
      breakfast: ["egg"],
      lunch: [],
      dinner: [],
    };

    saveFoods(foods);
    savePlan(plan);
    saveExclusions(exclusions);

    expect(loadState()).toEqual({
      foods,
      plans: [plan],
      exclusions: [exclusions],
    });
  });
});
