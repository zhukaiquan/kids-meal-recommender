import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { TodayPage } from "./pages/TodayPage";

const foods = [
  { id: "toast", name: "吐司", mealTypes: ["breakfast"], tags: ["staple"], enabled: true, image: null },
  { id: "egg", name: "鸡蛋", mealTypes: ["breakfast", "lunch", "dinner"], tags: ["protein"], enabled: true, image: null },
  { id: "milk", name: "牛奶", mealTypes: ["breakfast"], tags: ["dairy", "drink"], enabled: true, image: null },
  { id: "banana", name: "香蕉", mealTypes: ["breakfast"], tags: ["fruit"], enabled: true, image: null },
  { id: "rice", name: "米饭", mealTypes: ["lunch", "dinner"], tags: ["staple"], enabled: true, image: null },
  { id: "beef", name: "牛肉", mealTypes: ["lunch", "dinner"], tags: ["protein"], enabled: true, image: null },
  { id: "broccoli", name: "西兰花", mealTypes: ["lunch", "dinner"], tags: ["vegetable"], enabled: true, image: null },
  { id: "noodles", name: "面条", mealTypes: ["lunch", "dinner"], tags: ["staple"], enabled: true, image: null },
  { id: "tofu", name: "豆腐", mealTypes: ["lunch", "dinner"], tags: ["protein"], enabled: true, image: null },
  { id: "carrot", name: "胡萝卜", mealTypes: ["lunch", "dinner"], tags: ["vegetable"], enabled: true, image: null },
];

const insufficientFoods = [
  { id: "toast", name: "吐司", mealTypes: ["breakfast"], tags: ["staple"], enabled: true, image: null },
  { id: "egg", name: "鸡蛋", mealTypes: ["breakfast"], tags: ["protein"], enabled: true, image: null },
  { id: "banana", name: "香蕉", mealTypes: ["breakfast"], tags: ["fruit"], enabled: true, image: null },
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

    expect(screen.getByRole("tab", { name: "今日推荐" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "食物库" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "历史记录" })).toBeInTheDocument();
    expect(screen.getByText("先添加一些食物，再生成今天的三餐推荐。")).toBeInTheDocument();
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
    expect(screen.getByText("正在准备今天的小菜单...")).toBeInTheDocument();
    expect(screen.queryByText("当前标签还不够，暂时无法拼出完整的三餐。")).not.toBeInTheDocument();
  });

  it("shows the failure message after generation cannot produce all three meals", async () => {
    localStorage.setItem("foodItems", JSON.stringify(insufficientFoods));

    render(<App />);

    expect(await screen.findByText("当前标签还不够，暂时无法拼出完整的三餐。")).toBeInTheDocument();
  });

  it("refreshes only the selected meal", async () => {
    const user = userEvent.setup();
    localStorage.setItem("foodItems", JSON.stringify(foods));
    mockRandomSequence([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    render(<App />);

    const breakfastCard = await screen.findByRole("article", { name: "早餐" });
    const lunchCard = screen.getByRole("article", { name: "午餐" });
    const dinnerCard = screen.getByRole("article", { name: "晚餐" });

    const breakfastText = within(breakfastCard).getByText("吐司").textContent;
    const lunchText = within(lunchCard).getByText(/米饭|面条/).textContent;
    const dinnerText = within(dinnerCard).getByText(/米饭|面条/).textContent;

    await user.click(screen.getByRole("button", { name: "换一个午餐" }));

    expect(within(getMealCard("早餐")).getByText(breakfastText ?? "")).toBeInTheDocument();
    expect(within(getMealCard("晚餐")).getByText(dinnerText ?? "")).toBeInTheDocument();
    expect(within(getMealCard("午餐")).queryByText(lunchText ?? "")).not.toBeInTheDocument();
  });

  it("shows food images in history when available", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "foodItems",
      JSON.stringify([
        {
          id: "egg",
          name: "鸡蛋",
          mealTypes: ["breakfast"],
          tags: ["protein"],
          enabled: true,
          image: {
            thumbnailUrl: "https://upload.wikimedia.org/thumb/egg.png",
            fullUrl: "https://upload.wikimedia.org/egg.png",
            sourceName: "wikimedia-commons",
            sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Cartoon_Egg.png",
            authorName: "Kid Artist",
            license: "CC BY-SA 4.0",
            searchQuery: "鸡蛋 插画 卡通 食物",
          },
        },
      ]),
    );
    localStorage.setItem(
      "dailyPlans",
      JSON.stringify([
        {
          date: "2026-03-25",
          breakfast: {
            mealType: "breakfast",
            foods: [{ foodId: "egg", foodNameSnapshot: "鸡蛋", tags: ["protein"] }],
          },
          lunch: {
            mealType: "lunch",
            foods: [],
          },
          dinner: {
            mealType: "dinner",
            foods: [],
          },
          updatedAt: "2026-03-25T08:00:00.000Z",
        },
      ]),
    );

    render(<App />);
    await user.click(screen.getByRole("tab", { name: "历史记录" }));

    const historyCard = screen.getByText("2026-03-25").closest("article");

    expect(historyCard).not.toBeNull();
    expect(within(historyCard as HTMLElement).getByText("早餐")).toBeInTheDocument();
    expect(within(historyCard as HTMLElement).getByText("鸡蛋")).toBeInTheDocument();
    expect(within(historyCard as HTMLElement).getByRole("img", { name: "鸡蛋" })).toBeInTheDocument();
  });
});
