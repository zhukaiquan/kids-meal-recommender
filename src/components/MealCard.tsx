import { mealLabels } from "../content/cn";
import type { FoodItem, MealRecommendation, MealType } from "../domain/types";
import { FoodImage } from "./FoodImage";

type MealCardProps = {
  meal: MealRecommendation;
  foodsById: Record<string, FoodItem>;
  onRefresh: (mealType: MealType) => void;
  isFlipped: boolean;
  isConfirmed: boolean;
  onFlip: (mealType: MealType) => void;
  onConfirm: (mealType: MealType) => void;
};

const mealDescriptions: Record<MealType, string> = {
  breakfast: "太阳刚起床，早餐卡也醒啦",
  lunch: "给下午的冒险补满能量",
  dinner: "让夜晚故事香喷喷地开始",
};

const mealCardNotes: Record<MealType, string> = {
  breakfast: "小厨师说：先吃点暖暖的，再出发。",
  lunch: "小熊助手说：这一餐要吃得有精神。",
  dinner: "小锅铲说：晚上也要吃得开心。",
};

export function MealCard({
  meal,
  foodsById,
  onRefresh,
  isFlipped,
  isConfirmed,
  onFlip,
  onConfirm,
}: MealCardProps) {
  const title = mealLabels[meal.mealType];

  return (
    <article className={isFlipped ? "meal-card is-flipped" : "meal-card"} aria-label={`${title}卡`}>
      {!isFlipped ? (
        <div className="meal-card__back">
          <span className="meal-card__spark" aria-hidden="true" />
          <p className="meal-card__label">{title}卡</p>
          <p>{mealDescriptions[meal.mealType]}</p>
          <button type="button" aria-label={`翻开${title}卡`} onClick={() => onFlip(meal.mealType)}>
            翻开{title}卡
          </button>
        </div>
      ) : (
        <div className="meal-card__front">
          <header className="meal-card__header">
            <div>
              <p className="meal-card__label">{title}卡</p>
              <h3>{title}推荐</h3>
            </div>
            {isConfirmed ? <span className="meal-card__badge">已选好</span> : null}
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

          <p className="meal-card__note">{mealCardNotes[meal.mealType]}</p>

          <div className="meal-card__actions">
            <button type="button" className="button-primary" onClick={() => onConfirm(meal.mealType)}>
              {title}就吃这个
            </button>
            <button
              type="button"
              className="button-secondary"
              aria-label={`再抽一张${title}卡`}
              onClick={() => onRefresh(meal.mealType)}
            >
              再抽一张
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
