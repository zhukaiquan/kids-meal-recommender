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

  if (planner.foods.length === 0) {
    return (
      <section>
        <h2>Today</h2>
        <p>Add some foods before generating today's meals.</p>
      </section>
    );
  }

  if (!planner.todayPlan) {
    return (
      <section>
        <h2>Today</h2>
        <p>Not enough tagged foods to generate all three meals yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Today</h2>
      <div className="meal-grid">
        <MealCard meal={planner.todayPlan.breakfast} onRefresh={planner.refreshTodayMeal} />
        <MealCard meal={planner.todayPlan.lunch} onRefresh={planner.refreshTodayMeal} />
        <MealCard meal={planner.todayPlan.dinner} onRefresh={planner.refreshTodayMeal} />
      </div>
    </section>
  );
}
