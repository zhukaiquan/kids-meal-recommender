import { useEffect } from "react";
import { MealCard } from "../components/MealCard";
import { useMealPlanner } from "../hooks/useMealPlanner";

type TodayPageProps = {
  planner: ReturnType<typeof useMealPlanner>;
};

export function TodayPage({ planner }: TodayPageProps) {
  useEffect(() => {
    planner.ensureTodayPlan();
  }, [planner]);

  const foodsById = Object.fromEntries(planner.foods.map((food) => [food.id, food]));

  if (planner.todayPlanStatus === "empty") {
    return (
      <section className="section-stack">
        <h2>今日推荐</h2>
        <p>先添加一些食物，再生成今天的三餐推荐。</p>
      </section>
    );
  }

  if (planner.todayPlanStatus === "loading") {
    return (
      <section className="section-stack">
        <h2>今日推荐</h2>
        <p>正在准备今天的小菜单...</p>
      </section>
    );
  }

  if (planner.todayPlanStatus === "failed" || !planner.todayPlan) {
    return (
      <section className="section-stack">
        <h2>今日推荐</h2>
        <p>当前标签还不够，暂时无法拼出完整的三餐。</p>
      </section>
    );
  }

  return (
    <section className="section-stack">
      <div className="section-heading">
        <div>
          <h2>今日推荐</h2>
          <p>早餐、午餐、晚餐一次给你灵感，不喜欢就单独换一个。</p>
        </div>
      </div>
      <div className="meal-grid">
        <MealCard meal={planner.todayPlan.breakfast} foodsById={foodsById} onRefresh={planner.refreshTodayMeal} />
        <MealCard meal={planner.todayPlan.lunch} foodsById={foodsById} onRefresh={planner.refreshTodayMeal} />
        <MealCard meal={planner.todayPlan.dinner} foodsById={foodsById} onRefresh={planner.refreshTodayMeal} />
      </div>
    </section>
  );
}
