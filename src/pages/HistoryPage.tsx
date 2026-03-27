import { useMealPlanner } from "../hooks/useMealPlanner";

type HistoryPageProps = {
  planner: ReturnType<typeof useMealPlanner>;
};

export function HistoryPage({ planner }: HistoryPageProps) {
  const sortedPlans = [...planner.plans].sort((left, right) => right.date.localeCompare(left.date));

  return (
    <section>
      <h2>History</h2>
      {sortedPlans.length === 0 ? (
        <p>No accepted meal plans yet.</p>
      ) : (
        <div className="history-list">
          {sortedPlans.map((plan) => (
            <article key={plan.date} className="history-card">
              <h3>{plan.date}</h3>
              <p>Breakfast: {plan.breakfast.foods.map((food) => food.foodNameSnapshot).join(", ")}</p>
              <p>Lunch: {plan.lunch.foods.map((food) => food.foodNameSnapshot).join(", ")}</p>
              <p>Dinner: {plan.dinner.foods.map((food) => food.foodNameSnapshot).join(", ")}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
