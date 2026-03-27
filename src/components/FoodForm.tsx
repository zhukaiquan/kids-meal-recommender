import { useEffect, useState } from "react";
import { mealLabels, tagLabels } from "../content/cn";
import type { FoodImage, FoodItem, FoodTag, MealType } from "../domain/types";
import type { FoodDraft } from "../hooks/useMealPlanner";
import { FoodImagePicker } from "./FoodImagePicker";

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
  const [enabled, setEnabled] = useState(initialValue?.enabled ?? true);
  const [selectedImage, setSelectedImage] = useState<FoodImage | null>(initialValue?.image ?? null);
  const [errors, setErrors] = useState<FoodFormErrors>({});

  useEffect(() => {
    setName(initialValue?.name ?? "");
    setSelectedMeals(initialValue?.mealTypes ?? []);
    setSelectedTags(initialValue?.tags ?? []);
    setEnabled(initialValue?.enabled ?? true);
    setSelectedImage(initialValue?.image ?? null);
  }, [initialValue]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmedName = name.trim();
        const nextErrors: FoodFormErrors = {};

        if (!trimmedName) {
          nextErrors.name = "请输入食物名称。";
        }

        if (selectedMeals.length === 0) {
          nextErrors.mealTypes = "请至少选择一个适用餐次。";
        }

        if (selectedTags.length === 0) {
          nextErrors.tags = "请至少选择一个标签。";
        }

        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          return;
        }

        setErrors({});
        onSubmit({
          name: trimmedName,
          mealTypes: selectedMeals,
          tags: selectedTags,
          enabled,
          image: selectedImage,
        });

        if (!initialValue) {
          setName("");
          setSelectedMeals([]);
          setSelectedTags([]);
          setEnabled(true);
          setSelectedImage(null);
        }
      }}
    >
      <label>
        食物名称
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：鸡蛋羹" aria-label="食物名称" />
      </label>
      {errors.name ? <p role="alert">{errors.name}</p> : null}

      <fieldset>
        <legend>适用餐次</legend>
        {mealTypes.map((meal) => (
          <label key={meal}>
            <input
              type="checkbox"
              checked={selectedMeals.includes(meal)}
              onChange={() => toggleValue(meal, selectedMeals, setSelectedMeals)}
            />
            {mealLabels[meal]}
          </label>
        ))}
      </fieldset>
      {errors.mealTypes ? <p role="alert">{errors.mealTypes}</p> : null}

      <fieldset>
        <legend>食物标签</legend>
        {tags.map((tag) => (
          <label key={tag}>
            <input
              type="checkbox"
              checked={selectedTags.includes(tag)}
              onChange={() => toggleValue(tag, selectedTags, setSelectedTags)}
            />
            {tagLabels[tag]}
          </label>
        ))}
      </fieldset>
      {errors.tags ? <p role="alert">{errors.tags}</p> : null}

      <label>
        <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
        启用这个食物
      </label>

      <FoodImagePicker keyword={name} value={selectedImage} onChange={setSelectedImage} />

      <button type="submit">{submitLabel}</button>
      {onCancel ? (
        <button type="button" onClick={onCancel}>
          取消
        </button>
      ) : null}
    </form>
  );
}
