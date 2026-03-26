import type { FoodItem } from "../domain/types";

type FoodTableProps = {
  foods: FoodItem[];
  onEdit: (food: FoodItem) => void;
  onToggleEnabled: (food: FoodItem) => void;
  onDelete: (foodId: string) => void;
};

export function FoodTable({ foods, onEdit, onToggleEnabled, onDelete }: FoodTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Meals</th>
          <th>Tags</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {foods.map((food) => (
          <tr key={food.id}>
            <td>{food.name}</td>
            <td>{food.mealTypes.join(", ")}</td>
            <td>{food.tags.join(", ")}</td>
            <td>
              <button type="button" onClick={() => onEdit(food)}>
                Edit
              </button>
              <button type="button" onClick={() => onToggleEnabled(food)}>
                {food.enabled ? "Disable" : "Enable"}
              </button>
              <button type="button" onClick={() => onDelete(food.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
