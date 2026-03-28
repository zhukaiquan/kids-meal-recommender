import { mealLabels } from "../content/cn";
import { FoodImage } from "../components/FoodImage";
import { useMealPlanner } from "../hooks/useMealPlanner";

type HistoryPageProps = {
  planner: ReturnType<typeof useMealPlanner>;
};

export function HistoryPage({ planner }: HistoryPageProps) {
  const sortedPlans = [...planner.plans].sort((left, right) => right.date.localeCompare(left.date));
  const foodsById = Object.fromEntries(planner.foods.map((food) => [food.id, food]));

  return (
    <section className="section-stack">
      <div className="section-heading">
        <div>
          <h2>历史记录</h2>
          <p>回看最近的三餐安排，避免总是重复做同一套。</p>
        </div>
      </div>
      {sortedPlans.length === 0 ? (
        <p>还没有保存过的菜单记录。</p>
      ) : (
        <div className="history-list">
          {sortedPlans.map((plan) => (
            <article key={plan.date} className="history-card">
              <h3>{plan.date}</h3>
              <div className="history-card__meals">
                {[plan.breakfast, plan.lunch, plan.dinner].map((meal) => (
                  <section key={`${plan.date}-${meal.mealType}`} className="history-meal">
                    <h4>{mealLabels[meal.mealType]}</h4>
                    {meal.foods.length === 0 ? (
                      <p className="history-meal__empty">暂未记录</p>
                    ) : (
                      <div className="history-food-list">
                        {meal.foods.map((food) => (
                          <article key={`${plan.date}-${meal.mealType}-${food.foodId}`} className="history-food">
                            <div className="history-food__image">
                              <FoodImage image={foodsById[food.foodId]?.image ?? null} alt={food.foodNameSnapshot} />
                            </div>
                            <span>{food.foodNameSnapshot}</span>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
