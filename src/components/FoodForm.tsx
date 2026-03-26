import { useState } from "react";
import type { FoodItem, FoodTag, MealType } from "../domain/types";
import type { FoodDraft } from "../hooks/useMealPlanner";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner"];
const tags: FoodTag[] = ["staple", "protein", "vegetable", "fruit", "dairy", "drink"];

type FoodFormProps = {
  initialValue?: FoodItem | null;
  submitLabel: string;
  onSubmit: (value: FoodDraft) => void;
  onCancel?: () => void;
};

type FoodFormErrors = {
  name?: string;
  mealTypes?: string;
  tags?: string;
};

function toggleValue<T extends string>(value: T, items: T[], setter: (items: T[]) => void) {
  setter(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
}

export function FoodForm({ initialValue, submitLabel, onSubmit, onCancel }: FoodFormProps) {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(initialValue?.mealTypes ?? []);
  const [selectedTags, setSelectedTags] = useState<FoodTag[]>(initialValue?.tags ?? []);
  const [errors, setErrors] = useState<FoodFormErrors>({});

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmedName = name.trim();
        const nextErrors: FoodFormErrors = {};

        if (!trimmedName) {
          nextErrors.name = "Food name is required.";
        }

        if (selectedMeals.length === 0) {
          nextErrors.mealTypes = "Select at least one meal type.";
        }

        if (selectedTags.length === 0) {
          nextErrors.tags = "Select at least one tag.";
        }

        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          return;
        }

        setErrors({});
        onSubmit({ name: trimmedName, mealTypes: selectedMeals, tags: selectedTags });
        setName("");
        setSelectedMeals([]);
        setSelectedTags([]);
      }}
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Food name"
        aria-label="Food name"
      />
      {errors.name ? <p role="alert">{errors.name}</p> : null}

      <fieldset>
        <legend>Meals</legend>
        {mealTypes.map((meal) => (
          <label key={meal}>
            <input
              type="checkbox"
              checked={selectedMeals.includes(meal)}
              onChange={() => toggleValue(meal, selectedMeals, setSelectedMeals)}
            />
            {meal}
          </label>
        ))}
      </fieldset>
      {errors.mealTypes ? <p role="alert">{errors.mealTypes}</p> : null}

      <fieldset>
        <legend>Tags</legend>
        {tags.map((tag) => (
          <label key={tag}>
            <input
              type="checkbox"
              checked={selectedTags.includes(tag)}
              onChange={() => toggleValue(tag, selectedTags, setSelectedTags)}
            />
            {tag}
          </label>
        ))}
      </fieldset>
      {errors.tags ? <p role="alert">{errors.tags}</p> : null}

      <button type="submit">{submitLabel}</button>
      {onCancel ? (
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      ) : null}
    </form>
  );
}
