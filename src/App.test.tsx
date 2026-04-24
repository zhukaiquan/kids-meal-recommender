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

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the kitchen empty state when no foods exist", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "绘本厨房开饭啦" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开家长食物库" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用试玩示例食物卡" })).toBeInTheDocument();
    expect(screen.getByText("小厨房还没有食物卡，先去家长区添加孩子爱吃的东西。")).toBeInTheDocument();
  });

  it("loads demo foods from the empty state so the card game can be tried immediately", async () => {
    const user = userEvent.setup();
    mockRandomSequence([0, 0, 0, 0, 0, 0, 0, 0, 0]);

    render(<App />);

    await user.click(screen.getByRole("button", { name: "使用试玩示例食物卡" }));

    expect(await screen.findByRole("button", { name: "翻开早餐卡" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "翻开午餐卡" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "翻开晚餐卡" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("foodItems") ?? "[]")).toHaveLength(16);
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
    expect(screen.getByText("小厨师正在洗牌...")).toBeInTheDocument();
    expect(screen.queryByText("当前标签还不够，暂时无法拼出完整的三餐。")).not.toBeInTheDocument();
  });

  it("shows the failure message after generation cannot produce all three meals", async () => {
    localStorage.setItem("foodItems", JSON.stringify(insufficientFoods));

    render(<App />);

    expect(await screen.findByText("当前标签还不够，暂时无法拼出完整的三餐。")).toBeInTheDocument();
  });

  it("keeps meal cards face down until a child flips them", async () => {
    const user = userEvent.setup();
    localStorage.setItem("foodItems", JSON.stringify(foods));
    mockRandomSequence([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    render(<App />);

    expect(await screen.findByRole("button", { name: "翻开早餐卡" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "翻开午餐卡" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "翻开晚餐卡" })).toBeInTheDocument();
    expect(screen.queryByText("吐司")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "翻开早餐卡" }));

    const breakfastCard = screen.getByRole("article", { name: "早餐卡" });
    expect(within(breakfastCard).getByText("吐司")).toBeInTheDocument();
    expect(within(breakfastCard).getByRole("button", { name: "早餐就吃这个" })).toBeInTheDocument();
    expect(within(breakfastCard).getByRole("button", { name: "再抽一张早餐卡" })).toBeInTheDocument();
  });

  it("refreshes a flipped meal card without revealing the other cards", async () => {
    const user = userEvent.setup();
    localStorage.setItem("foodItems", JSON.stringify(foods));
    mockRandomSequence([0, 0, 0, 0, 0, 0, 0.9, 0, 0]);

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "翻开午餐卡" }));

    const lunchCard = screen.getByRole("article", { name: "午餐卡" });
    const firstLunch = within(lunchCard).getByText(/米饭|面条/).textContent;

    await user.click(within(lunchCard).getByRole("button", { name: "再抽一张午餐卡" }));

    expect(within(lunchCard).queryByText(firstLunch ?? "")).not.toBeInTheDocument();
    expect(screen.queryByText("吐司")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "翻开晚餐卡" })).toBeInTheDocument();
  });

  it("celebrates when all three cards are confirmed", async () => {
    const user = userEvent.setup();
    localStorage.setItem("foodItems", JSON.stringify(foods));
    mockRandomSequence([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "翻开早餐卡" }));
    await user.click(screen.getByRole("button", { name: "早餐就吃这个" }));
    await user.click(screen.getByRole("button", { name: "翻开午餐卡" }));
    await user.click(screen.getByRole("button", { name: "午餐就吃这个" }));
    await user.click(screen.getByRole("button", { name: "翻开晚餐卡" }));
    await user.click(screen.getByRole("button", { name: "晚餐就吃这个" }));

    expect(screen.getByText("今日小厨师任务完成")).toBeInTheDocument();
    expect(screen.getByText("三张菜单卡都选好啦，今天照着这份菜单采购和准备就行。")).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "查看菜单历史" }));

    const historyCard = screen.getByText("2026-03-25").closest("article");

    expect(historyCard).not.toBeNull();
    expect(within(historyCard as HTMLElement).getByText("早餐")).toBeInTheDocument();
    expect(within(historyCard as HTMLElement).getByText("鸡蛋")).toBeInTheDocument();
    expect(within(historyCard as HTMLElement).getByRole("img", { name: "鸡蛋" })).toBeInTheDocument();
  });
});
