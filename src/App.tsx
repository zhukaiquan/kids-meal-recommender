import { useState } from "react";
import "./index.css";

const tabs = ["Today", "Food Library", "History"] as const;

type Tab = (typeof tabs)[number];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Today");

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Kids Meal Recommender</h1>
        <p>Generate breakfast, lunch, and dinner without rethinking the whole day.</p>
      </header>

      <nav className="tab-list" aria-label="Primary">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? "tab is-active" : "tab"}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="panel">
        <h2>{activeTab}</h2>
      </section>
    </main>
  );
}
