import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { TodayPage } from "./pages/TodayPage";

const foods = [
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

const insufficientFoods = [
  { id: "toast", name: "Toast", mealTypes: ["breakfast"], tags: ["staple"], enabled: true },
  { id: "egg", name: "Egg", mealTypes: ["breakfast"], tags: ["protein"], enabled: true },
  { id: "banana", name: "Banana", mealTypes: ["breakfast"], tags: ["fruit"], enabled: true },
];

function mockRandomSequence(values: number[]) {
  let index = 0;

  return vi.spyOn(Math, "random").mockImplementation(() => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  });
}

function getMealCard(name: string) {
  return screen.getByRole("article", { name });
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the empty state when no foods exist", () => {
    render(<App />);

    expect(
      screen.getByText("Add some foods before generating today's meals."),
    ).toBeInTheDocument();
  });

  it("shows a loading state instead of the failure message before initial generation completes", () => {
    const ensureTodayPlan = vi.fn();

    render(
      <TodayPage
        planner={
          {
            foods,
            plans: [],
            todayPlan: null,
            todayPlanStatus: "loading",
            addFood: vi.fn(),
            updateFood: vi.fn(),
            deleteFood: vi.fn(),
            ensureTodayPlan,
            refreshTodayMeal: vi.fn(),
          } as never
        }
      />,
    );

    expect(ensureTodayPlan).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Generating today's meals...")).toBeInTheDocument();
    expect(
      screen.queryByText("Not enough tagged foods to generate all three meals yet."),
    ).not.toBeInTheDocument();
  });

  it("shows the failure message after generation cannot produce all three meals", async () => {
    localStorage.setItem("foodItems", JSON.stringify(insufficientFoods));

    render(<App />);

    expect(
      await screen.findByText("Not enough tagged foods to generate all three meals yet."),
    ).toBeInTheDocument();
  });

  it("refreshes only the selected meal", async () => {
    const user = userEvent.setup();
    localStorage.setItem("foodItems", JSON.stringify(foods));
    mockRandomSequence([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    render(<App />);

    const breakfastCard = await screen.findByRole("article", { name: "Breakfast" });
    const lunchCard = screen.getByRole("article", { name: "Lunch" });
    const dinnerCard = screen.getByRole("article", { name: "Dinner" });

    const breakfastText = within(breakfastCard).getByRole("list").textContent;
    const lunchText = within(lunchCard).getByRole("list").textContent;
    const dinnerText = within(dinnerCard).getByRole("list").textContent;

    await user.click(screen.getByRole("button", { name: "Refresh lunch" }));

    expect(within(getMealCard("Breakfast")).getByRole("list")).toHaveTextContent(breakfastText ?? "");
    expect(within(getMealCard("Dinner")).getByRole("list")).toHaveTextContent(dinnerText ?? "");
    expect(within(getMealCard("Lunch")).getByRole("list").textContent).not.toBe(lunchText);
  });

  it("shows prior accepted plans in history", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "dailyPlans",
      JSON.stringify([
        {
          date: "2026-03-25",
          breakfast: {
            mealType: "breakfast",
            foods: [{ foodId: "toast", foodNameSnapshot: "Toast", tags: ["staple"] }],
          },
          lunch: {
            mealType: "lunch",
            foods: [{ foodId: "rice", foodNameSnapshot: "Rice", tags: ["staple"] }],
          },
          dinner: {
            mealType: "dinner",
            foods: [{ foodId: "beef", foodNameSnapshot: "Beef", tags: ["protein"] }],
          },
          updatedAt: "2026-03-25T08:00:00.000Z",
        },
      ]),
    );

    render(<App />);
    await user.click(screen.getByRole("tab", { name: "History" }));

    expect(screen.getByText("2026-03-25")).toBeInTheDocument();
    expect(screen.getByText("Breakfast: Toast")).toBeInTheDocument();
    expect(screen.getByText("Lunch: Rice")).toBeInTheDocument();
    expect(screen.getByText("Dinner: Beef")).toBeInTheDocument();
  });
});
