import { mealLabels } from "../content/cn";
import type { FoodItem, MealRecommendation, MealType } from "../domain/types";
import { FoodImage } from "./FoodImage";

type MealCardProps = {
  meal: MealRecommendation;
  foodsById: Record<string, FoodItem>;
  onRefresh: (mealType: MealType) => void;
};

const mealDescriptions: Record<MealType, string> = {
  breakfast: "从轻松早餐开始一天",
  lunch: "来一份有精神的小午餐",
  dinner: "晚上也能吃得省心又开心",
};

export function MealCard({ meal, foodsById, onRefresh }: MealCardProps) {
  const title = mealLabels[meal.mealType];

  return (
    <article className="meal-card" aria-label={title}>
      <header className="meal-card__header">
        <div>
          <h3>{title}</h3>
          <p>{mealDescriptions[meal.mealType]}</p>
        </div>
        <button type="button" aria-label={`换一个${title}`} onClick={() => onRefresh(meal.mealType)}>
          换一个
        </button>
      </header>
      <div className="meal-food-grid">
        {meal.foods.map((food) => (
          <article key={`${meal.mealType}-${food.foodId}`} className="meal-food-chip">
            <div className="meal-food-chip__image">
              <FoodImage image={foodsById[food.foodId]?.image ?? null} alt={food.foodNameSnapshot} />
            </div>
            <span className="meal-food-chip__name">{food.foodNameSnapshot}</span>
          </article>
        ))}
      </div>
    </article>
  );
}
