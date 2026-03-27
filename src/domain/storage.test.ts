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
      {
        id: "egg",
        name: "Egg",
        mealTypes: ["breakfast"],
        tags: ["protein"],
        enabled: true,
        image: null,
      },
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

  it("hydrates legacy food items without images", () => {
    localStorage.setItem(
      "foodItems",
      JSON.stringify([
        {
          id: "egg",
          name: "鸡蛋",
          mealTypes: ["breakfast"],
          tags: ["protein"],
          enabled: true,
        },
      ]),
    );

    const state = loadState();

    expect(state.foods).toEqual([
      {
        id: "egg",
        name: "鸡蛋",
        mealTypes: ["breakfast"],
        tags: ["protein"],
        enabled: true,
        image: null,
      },
    ]);
  });

  it("replaces saved plans and exclusions for the same date", () => {
    const firstPlan: DailyPlan = {
      date: "2026-03-26",
      breakfast: {
        mealType: "breakfast",
        foods: [{ foodId: "egg", foodNameSnapshot: "Egg", tags: ["protein"] }],
      },
      lunch: { mealType: "lunch", foods: [] },
      dinner: { mealType: "dinner", foods: [] },
      updatedAt: "2026-03-26T08:00:00.000Z",
    };
    const secondPlan: DailyPlan = {
      ...firstPlan,
      breakfast: {
        mealType: "breakfast",
        foods: [{ foodId: "toast", foodNameSnapshot: "Toast", tags: ["staple"] }],
      },
      updatedAt: "2026-03-26T09:00:00.000Z",
    };
    const firstExclusions: DailyExclusions = {
      date: "2026-03-26",
      breakfast: ["egg"],
      lunch: [],
      dinner: [],
    };
    const secondExclusions: DailyExclusions = {
      date: "2026-03-26",
      breakfast: ["toast"],
      lunch: ["milk"],
      dinner: [],
    };

    savePlan(firstPlan);
    savePlan(secondPlan);
    saveExclusions(firstExclusions);
    saveExclusions(secondExclusions);

    expect(loadState().plans).toEqual([secondPlan]);
    expect(loadState().exclusions).toEqual([secondExclusions]);
  });

  it("falls back to defaults when stored JSON is invalid", () => {
    localStorage.setItem("foodItems", "{not-json");
    localStorage.setItem("dailyPlans", "{still-not-json");
    localStorage.setItem("dailyExclusions", "{also-not-json");

    expect(loadState()).toEqual({
      foods: [],
      plans: [],
      exclusions: [],
    });
  });
});
