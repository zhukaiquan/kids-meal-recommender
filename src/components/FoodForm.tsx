import { useEffect, useState } from "react";
import { mealLabels, tagLabels } from "../content/cn";
import type { FoodImage, FoodItem, FoodTag, MealType } from "../domain/types";
import type { FoodDraft } from "../hooks/useMealPlanner";
import { FoodImagePicker } from "./FoodImagePicker";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner"];
const tags: FoodTag[] = ["staple", "protein", "vegetable", "fruit", "dairy", "drink"];

const tagHints: Record<FoodTag, string> = {
  staple: "米饭、面、粥、土豆",
  protein: "肉、蛋、鱼、豆制品",
  vegetable: "绿叶菜、菌菇、根茎菜",
  fruit: "水果、果泥、果盘",
  dairy: "牛奶、酸奶、奶酪",
  drink: "水、汤、豆浆",
};

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
          nextErrors.tags = "请至少选择一个营养角色。";
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
      className="food-form"
    >
      <section className="food-form__section">
        <label className="food-form__name">
          <span>食物名称</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：鸡蛋羹"
            aria-label="食物名称"
          />
        </label>
        {errors.name ? <p role="alert">{errors.name}</p> : null}
      </section>

      <fieldset className="food-form__section food-form__choice-group">
        <legend>
          <span>这道食物适合哪一餐？</span>
          <small>可以多选，例如鸡蛋既能做早餐也能做晚餐。</small>
        </legend>
        <div className="food-form__choices food-form__choices--meals">
          {mealTypes.map((meal) => (
            <label key={meal} className="choice-chip choice-chip--meal">
              <input
                type="checkbox"
                aria-label={mealLabels[meal]}
                checked={selectedMeals.includes(meal)}
                onChange={() => toggleValue(meal, selectedMeals, setSelectedMeals)}
              />
              <span>{mealLabels[meal]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {errors.mealTypes ? <p role="alert">{errors.mealTypes}</p> : null}

      <fieldset className="food-form__section food-form__choice-group">
        <legend>
          <span>它在餐盘里扮演什么角色？</span>
          <small>推荐算法会按这些角色组合出一餐。</small>
        </legend>
        <div className="food-form__choices food-form__choices--tags">
          {tags.map((tag) => (
            <label key={tag} className="choice-chip choice-chip--tag">
              <input
                type="checkbox"
                aria-label={tagLabels[tag]}
                checked={selectedTags.includes(tag)}
                onChange={() => toggleValue(tag, selectedTags, setSelectedTags)}
              />
              <span>{tagLabels[tag]}</span>
              <small>{tagHints[tag]}</small>
            </label>
          ))}
        </div>
      </fieldset>
      {errors.tags ? <p role="alert">{errors.tags}</p> : null}

      <section className="food-form__section food-form__status">
        <label className="switch-row">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          <span>
            启用这个食物
            <small>关闭后不会出现在每日翻牌推荐里。</small>
          </span>
        </label>
      </section>

      <FoodImagePicker keyword={name} value={selectedImage} onChange={setSelectedImage} />

      <footer className="food-form__actions">
        <button type="submit" className="form-submit-button">
          {submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="form-secondary-button" onClick={onCancel}>
            取消
          </button>
        ) : null}
      </footer>
    </form>
  );
}
