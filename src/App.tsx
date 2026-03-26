import { useState } from "react";
import { useMealPlanner } from "./hooks/useMealPlanner";
import { FoodLibraryPage } from "./pages/FoodLibraryPage";

const tabs = [
  { id: "today", label: "Today" },
  { id: "food-library", label: "Food Library" },
  { id: "history", label: "History" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const planner = useMealPlanner();

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Kids Meal Recommender</h1>
        <p>Generate breakfast, lunch, and dinner without rethinking the whole day.</p>
      </header>

      <nav className="tab-list" aria-label="Primary" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`${tab.id}-tab`}
            role="tab"
            className={tab.id === activeTab ? "tab is-active" : "tab"}
            aria-selected={tab.id === activeTab}
            aria-controls={`${tab.id}-panel`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {tabs.map((tab) => (
        <section
          key={tab.id}
          className="panel"
          id={`${tab.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${tab.id}-tab`}
          hidden={tab.id !== activeTab}
        >
          {tab.id === "food-library" ? <FoodLibraryPage planner={planner} /> : <h2>{tab.label}</h2>}
        </section>
      ))}
    </main>
  );
}
