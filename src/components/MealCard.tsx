import type { MealRecommendation, MealType } from "../domain/types";

type MealCardProps = {
  meal: MealRecommendation;
  onRefresh: (mealType: MealType) => void;
};

const mealLabels: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export function MealCard({ meal, onRefresh }: MealCardProps) {
  const title = mealLabels[meal.mealType];

  return (
    <article className="meal-card" aria-label={title}>
      <header className="meal-card__header">
        <div>
          <h3>{title}</h3>
          <p>{meal.foods.length} picks</p>
        </div>
        <button type="button" onClick={() => onRefresh(meal.mealType)}>
          Refresh {meal.mealType}
        </button>
      </header>
      <ul className="meal-card__list">
        {meal.foods.map((food) => (
          <li key={`${meal.mealType}-${food.foodId}`}>{food.foodNameSnapshot}</li>
        ))}
      </ul>
    </article>
  );
}
