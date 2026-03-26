import { useState } from "react";
import { FoodForm } from "../components/FoodForm";
import { FoodTable } from "../components/FoodTable";
import { useMealPlanner } from "../hooks/useMealPlanner";

type FoodLibraryPageProps = {
  planner: ReturnType<typeof useMealPlanner>;
};

export function FoodLibraryPage({ planner }: FoodLibraryPageProps) {
  const [editingFood, setEditingFood] = useState<(typeof planner.foods)[number] | null>(null);

  return (
    <section>
      <h2>Food Library</h2>
      <FoodForm
        key={editingFood?.id ?? "new"}
        initialValue={editingFood}
        submitLabel={editingFood ? "Save food" : "Add food"}
        onCancel={editingFood ? () => setEditingFood(null) : undefined}
        onSubmit={(draft) => {
          if (editingFood) {
            planner.updateFood({
              ...editingFood,
              name: draft.name,
              mealTypes: draft.mealTypes,
              tags: draft.tags,
            });
            setEditingFood(null);
            return;
          }

          planner.addFood(draft);
        }}
      />
      <FoodTable
        foods={planner.foods}
        onEdit={setEditingFood}
        onToggleEnabled={(food) => planner.updateFood({ ...food, enabled: !food.enabled })}
        onDelete={planner.deleteFood}
      />
    </section>
  );
}
