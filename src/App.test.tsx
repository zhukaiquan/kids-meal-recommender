import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("shows the default active tab and updates the panel when a tab is clicked", async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(
      screen.getByRole("tab", { name: "Today", selected: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "Today" })).toHaveTextContent(
      "Today",
    );

    await user.click(screen.getByRole("tab", { name: "Food Library" }));

    expect(
      screen.getByRole("tab", { name: "Today", selected: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Food Library", selected: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "Food Library" })).toHaveTextContent(
      "Food Library",
    );

    await user.click(screen.getByRole("tab", { name: "History" }));

    expect(
      screen.getByRole("tab", { name: "Food Library", selected: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "History", selected: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "History" })).toHaveTextContent(
      "History",
    );
    expect(document.getElementById("today-panel")).toHaveAttribute("hidden");
  });
});
