import { useState } from "react";
import { FoodForm } from "../components/FoodForm";
import { FoodTable } from "../components/FoodTable";
import { useMealPlanner } from "../hooks/useMealPlanner";

type FoodLibraryPageProps = {
  planner: ReturnType<typeof useMealPlanner>;
};

export function FoodLibraryPage({ planner }: FoodLibraryPageProps) {
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const editingFood = planner.foods.find((food) => food.id === editingFoodId) ?? null;

  return (
    <section>
      <h2>Food Library</h2>
      <FoodForm
        key={editingFood?.id ?? "new"}
        initialValue={editingFood}
        submitLabel={editingFood ? "Save food" : "Add food"}
        onCancel={editingFood ? () => setEditingFoodId(null) : undefined}
        onSubmit={(draft) => {
          if (editingFoodId) {
            const latestFood = planner.foods.find((food) => food.id === editingFoodId);

            if (!latestFood) {
              setEditingFoodId(null);
              return;
            }

            planner.updateFood({
              ...latestFood,
              name: draft.name,
              mealTypes: draft.mealTypes,
              tags: draft.tags,
            });
            setEditingFoodId(null);
            return;
          }

          planner.addFood(draft);
        }}
      />
      <FoodTable
        foods={planner.foods}
        onEdit={(food) => setEditingFoodId(food.id)}
        onToggleEnabled={(food) => planner.updateFood({ ...food, enabled: !food.enabled })}
        onDelete={(foodId) => {
          planner.deleteFood(foodId);

          if (foodId === editingFoodId) {
            setEditingFoodId(null);
          }
        }}
      />
    </section>
  );
}
