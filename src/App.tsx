import { useState } from "react";
import { useMealPlanner } from "./hooks/useMealPlanner";
import { FoodLibraryPage } from "./pages/FoodLibraryPage";
import { HistoryPage } from "./pages/HistoryPage";
import { TodayPage } from "./pages/TodayPage";

const views = [
  { id: "today", label: "今日翻牌", ariaLabel: "回到今日翻牌" },
  { id: "food-library", label: "家长食物库", ariaLabel: "打开家长食物库" },
  { id: "history", label: "菜单历史", ariaLabel: "查看菜单历史" },
] as const;

type ViewId = (typeof views)[number]["id"];

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>("today");
  const planner = useMealPlanner();
  const activeViewLabel = views.find((view) => view.id === activeView)?.label ?? "今日翻牌";

  function renderView(viewId: ViewId) {
    if (viewId === "today") {
      return <TodayPage planner={planner} />;
    }

    if (viewId === "food-library") {
      return <FoodLibraryPage planner={planner} />;
    }

    return <HistoryPage planner={planner} />;
  }

  return (
    <main className="app-shell">
      <header className="kitchen-hero">
        <div className="kitchen-hero__copy">
          <p className="app-eyebrow">亲子菜单小游戏</p>
          <h1>绘本厨房开饭啦</h1>
          <p>翻开早餐、午餐和晚餐卡，和孩子一起决定今天吃什么。</p>
        </div>
        <div className="kitchen-hero__scene" aria-hidden="true">
          <span className="kitchen-hero__sun" />
          <span className="kitchen-hero__chef">小熊厨师</span>
          <span className="kitchen-hero__pan" />
        </div>
      </header>

      <nav className="parent-nav" aria-label="家长区">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            aria-label={view.ariaLabel}
            className={view.id === activeView ? "parent-nav__button is-active" : "parent-nav__button"}
            onClick={() => setActiveView(view.id)}
          >
            {view.label}
          </button>
        ))}
      </nav>

      <section
        className={activeView === "today" ? "game-panel" : "parent-panel"}
        aria-label={activeViewLabel}
      >
        {renderView(activeView)}
      </section>
    </main>
  );
}
