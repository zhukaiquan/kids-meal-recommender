import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { useMealPlanner } from "./useMealPlanner";

describe("useMealPlanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds a food and persists it", () => {
    const { result } = renderHook(() => useMealPlanner());

    act(() => {
      result.current.addFood({
        name: "Rice",
        mealTypes: ["lunch", "dinner"],
        tags: ["staple"],
      });
    });

    expect(result.current.foods).toHaveLength(1);
    expect(result.current.foods[0].name).toBe("Rice");
  });

  it("updates an existing food", () => {
    const { result } = renderHook(() => useMealPlanner());

    act(() => {
      result.current.addFood({
        name: "Rice",
        mealTypes: ["lunch", "dinner"],
        tags: ["staple"],
      });
    });

    const created = result.current.foods[0];

    act(() => {
      result.current.updateFood({ ...created, name: "Brown Rice", enabled: false });
    });

    expect(result.current.foods[0].name).toBe("Brown Rice");
    expect(result.current.foods[0].enabled).toBe(false);
  });
});
