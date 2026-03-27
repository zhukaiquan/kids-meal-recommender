import { mealLabels, tagLabels } from "../content/cn";
import type { FoodItem } from "../domain/types";
import { FoodImage } from "./FoodImage";

type FoodCardGridProps = {
  foods: FoodItem[];
  onEdit: (food: FoodItem) => void;
  onToggleEnabled: (food: FoodItem) => void;
  onDelete: (foodId: string) => void;
};

export function FoodCardGrid({ foods, onEdit, onToggleEnabled, onDelete }: FoodCardGridProps) {
  if (foods.length === 0) {
    return <p>还没有食物，先添加一个吧。</p>;
  }

  return (
    <div aria-label="食物卡片列表">
      {foods.map((food) => (
        <article key={food.id}>
          <FoodImage image={food.image} alt={food.name} />
          <h3>{food.name}</h3>
          <p>{food.enabled ? "已启用" : "已停用"}</p>
          <p>{food.mealTypes.map((mealType) => mealLabels[mealType]).join(" / ")}</p>
          <div>
            {food.tags.map((tag) => (
              <span key={tag}>{tagLabels[tag]}</span>
            ))}
          </div>
          <div>
            <button type="button" aria-label={`编辑 ${food.name}`} onClick={() => onEdit(food)}>
              编辑
            </button>
            <button
              type="button"
              aria-label={`${food.enabled ? "停用" : "启用"} ${food.name}`}
              onClick={() => onToggleEnabled(food)}
            >
              {food.enabled ? "停用" : "启用"}
            </button>
            <button type="button" aria-label={`删除 ${food.name}`} onClick={() => onDelete(food.id)}>
              删除
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
