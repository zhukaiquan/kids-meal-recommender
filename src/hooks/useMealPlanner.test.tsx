import userEvent from "@testing-library/user-event";
import { act, render, renderHook, screen, within } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import App from "../App";
import { useMealPlanner } from "./useMealPlanner";

const mealLabels = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
} as const;

const tagLabels = {
  staple: "主食",
  protein: "蛋白质",
  vegetable: "蔬菜",
  fruit: "水果",
  dairy: "奶制品",
  drink: "饮品",
} as const;

async function openFoodLibrary(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole("tab", { name: "Food Library" }));

  return screen.getByRole("tabpanel", { name: "Food Library" });
}

async function addFoodWithForm(
  user: ReturnType<typeof userEvent.setup>,
  options: {
    name: string;
    meals?: string[];
    tags?: string[];
  },
) {
  const panel = screen.getByRole("tabpanel", { name: "Food Library" });

  await user.clear(within(panel).getByLabelText("食物名称"));
  await user.type(within(panel).getByLabelText("食物名称"), options.name);

  for (const meal of options.meals ?? []) {
    await user.click(within(panel).getByLabelText(mealLabels[meal as keyof typeof mealLabels] ?? meal));
  }

  for (const tag of options.tags ?? []) {
    await user.click(within(panel).getByLabelText(tagLabels[tag as keyof typeof tagLabels] ?? tag));
  }

  await user.click(within(panel).getByRole("button", { name: "添加食物" }));
}

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
        enabled: true,
        image: null,
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
        enabled: true,
        image: null,
      });
    });

    const created = result.current.foods[0];

    act(() => {
      result.current.updateFood({ ...created, name: "Brown Rice", enabled: false });
    });

    expect(result.current.foods[0].name).toBe("Brown Rice");
    expect(result.current.foods[0].enabled).toBe(false);
  });

  it("stores selected image metadata when adding a food", () => {
    const { result } = renderHook(() => useMealPlanner());

    act(() => {
      result.current.addFood({
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
      });
    });

    expect(result.current.foods[0]?.image?.thumbnailUrl).toContain("egg.png");
  });

  it("does not add a food when the name is only whitespace", async () => {
    const user = userEvent.setup();
    const panel = await openFoodLibrary(user);

    await addFoodWithForm(user, {
      name: "   ",
      meals: ["lunch"],
      tags: ["staple"],
    });

    expect(within(panel).queryByText("   ")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("foodItems") ?? "[]")).toHaveLength(0);
  });

  it("does not add a food without a meal type", async () => {
    const user = userEvent.setup();
    const panel = await openFoodLibrary(user);

    await addFoodWithForm(user, {
      name: "Rice",
      tags: ["staple"],
    });

    expect(within(panel).queryByText("Rice")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("foodItems") ?? "[]")).toHaveLength(0);
  });

  it("does not add a food without a tag", async () => {
    const user = userEvent.setup();
    const panel = await openFoodLibrary(user);

    await addFoodWithForm(user, {
      name: "Rice",
      meals: ["lunch"],
    });

    expect(within(panel).queryByText("Rice")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("foodItems") ?? "[]")).toHaveLength(0);
  });

  it("preserves the latest enabled state when saving an edited food", async () => {
    const user = userEvent.setup();
    const panel = await openFoodLibrary(user);

    await addFoodWithForm(user, {
      name: "Rice",
      meals: ["lunch"],
      tags: ["staple"],
    });

    await user.click(within(panel).getByRole("button", { name: "编辑 Rice" }));
    await user.click(within(panel).getByRole("button", { name: "停用 Rice" }));
    await user.clear(within(panel).getByLabelText("食物名称"));
    await user.type(within(panel).getByLabelText("食物名称"), "Brown Rice");
    await user.click(within(panel).getByRole("button", { name: "保存食物" }));

    expect(within(panel).getByText("Brown Rice")).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "启用 Brown Rice" })).toBeInTheDocument();
  });

  it("exits edit mode when the edited food is deleted", async () => {
    const user = userEvent.setup();
    const panel = await openFoodLibrary(user);

    await addFoodWithForm(user, {
      name: "Rice",
      meals: ["lunch"],
      tags: ["staple"],
    });

    await user.click(within(panel).getByRole("button", { name: "编辑 Rice" }));
    await user.click(within(panel).getByRole("button", { name: "删除 Rice" }));

    expect(within(panel).queryByRole("button", { name: "保存食物" })).not.toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "添加食物" })).toBeInTheDocument();
    expect(within(panel).queryByText("Rice")).not.toBeInTheDocument();
  });

  it("loads persisted foods after the app remounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.click(screen.getByRole("tab", { name: "Food Library" }));
    await addFoodWithForm(user, {
      name: "Rice",
      meals: ["lunch"],
      tags: ["staple"],
    });

    expect(screen.getByRole("tabpanel", { name: "Food Library" })).toHaveTextContent("Rice");

    unmount();

    const secondUser = userEvent.setup();
    render(<App />);
    await secondUser.click(screen.getByRole("tab", { name: "Food Library" }));

    expect(screen.getByRole("tabpanel", { name: "Food Library" })).toHaveTextContent("Rice");
  });
});
