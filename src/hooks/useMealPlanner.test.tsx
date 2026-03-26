import userEvent from "@testing-library/user-event";
import { act, render, renderHook, screen, within } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import App from "../App";
import { useMealPlanner } from "./useMealPlanner";

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

  await user.clear(within(panel).getByLabelText("Food name"));
  await user.type(within(panel).getByLabelText("Food name"), options.name);

  for (const meal of options.meals ?? []) {
    await user.click(within(panel).getByLabelText(meal));
  }

  for (const tag of options.tags ?? []) {
    await user.click(within(panel).getByLabelText(tag));
  }

  await user.click(within(panel).getByRole("button", { name: "Add food" }));
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

    await user.click(within(panel).getByRole("button", { name: "Edit Rice" }));
    await user.click(within(panel).getByRole("button", { name: "Disable Rice" }));
    await user.clear(within(panel).getByLabelText("Food name"));
    await user.type(within(panel).getByLabelText("Food name"), "Brown Rice");
    await user.click(within(panel).getByRole("button", { name: "Save food" }));

    expect(within(panel).getByText("Brown Rice")).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Enable Brown Rice" })).toBeInTheDocument();
  });

  it("exits edit mode when the edited food is deleted", async () => {
    const user = userEvent.setup();
    const panel = await openFoodLibrary(user);

    await addFoodWithForm(user, {
      name: "Rice",
      meals: ["lunch"],
      tags: ["staple"],
    });

    await user.click(within(panel).getByRole("button", { name: "Edit Rice" }));
    await user.click(within(panel).getByRole("button", { name: "Delete Rice" }));

    expect(within(panel).queryByRole("button", { name: "Save food" })).not.toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Add food" })).toBeInTheDocument();
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
