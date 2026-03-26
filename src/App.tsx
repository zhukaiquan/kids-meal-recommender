import { useState } from "react";

const tabs = [
  { id: "today", label: "Today" },
  { id: "food-library", label: "Food Library" },
  { id: "history", label: "History" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const panelId = "meal-panel";
  const activeTabConfig = tabs.find((tab) => tab.id === activeTab);

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
            aria-controls={panelId}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section
        className="panel"
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
      >
        <h2>{activeTabConfig?.label}</h2>
      </section>
    </main>
  );
}
