import { useEffect, useState } from "react";
import { MealCard } from "../components/MealCard";
import type { MealType } from "../domain/types";
import { useMealPlanner } from "../hooks/useMealPlanner";

type TodayPageProps = {
  planner: ReturnType<typeof useMealPlanner>;
};

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner"];

function createMealState(value: boolean): Record<MealType, boolean> {
  return { breakfast: value, lunch: value, dinner: value };
}

export function TodayPage({ planner }: TodayPageProps) {
  const [flippedMeals, setFlippedMeals] = useState<Record<MealType, boolean>>(() => createMealState(false));
  const [confirmedMeals, setConfirmedMeals] = useState<Record<MealType, boolean>>(() => createMealState(false));

  useEffect(() => {
    planner.ensureTodayPlan();
  }, [planner]);

  useEffect(() => {
    setFlippedMeals(createMealState(false));
    setConfirmedMeals(createMealState(false));
  }, [planner.todayPlan?.date]);

  const foodsById = Object.fromEntries(planner.foods.map((food) => [food.id, food]));
  const isCompleted = mealTypes.every((mealType) => confirmedMeals[mealType]);

  function flipMeal(mealType: MealType) {
    setFlippedMeals((current) => ({ ...current, [mealType]: true }));
  }

  function confirmMeal(mealType: MealType) {
    setConfirmedMeals((current) => ({ ...current, [mealType]: true }));
  }

  function refreshMeal(mealType: MealType) {
    planner.refreshTodayMeal(mealType);
    setFlippedMeals((current) => ({ ...current, [mealType]: true }));
    setConfirmedMeals((current) => ({ ...current, [mealType]: false }));
  }

  if (planner.todayPlanStatus === "empty") {
    return (
      <section className="kitchen-state">
        <h2>还没有食物卡</h2>
        <p>小厨房还没有食物卡，先去家长区添加孩子爱吃的东西。</p>
        <button type="button" className="demo-food-button" onClick={planner.loadDemoFoods}>
          使用试玩示例食物卡
        </button>
      </section>
    );
  }

  if (planner.todayPlanStatus === "loading") {
    return (
      <section className="kitchen-state">
        <h2>准备菜单卡</h2>
        <p>小厨师正在洗牌...</p>
      </section>
    );
  }

  if (planner.todayPlanStatus === "failed" || !planner.todayPlan) {
    return (
      <section className="kitchen-state">
        <h2>菜单卡还拼不出来</h2>
        <p>当前标签还不够，暂时无法拼出完整的三餐。</p>
      </section>
    );
  }

  return (
    <section className="kitchen-game" aria-label="今日菜单翻牌游戏">
      <div className="kitchen-game__intro">
        <div>
          <h2>今日菜单冒险</h2>
          <p>请小朋友翻开三张菜单卡，不喜欢就再抽一张。</p>
        </div>
        <div className="kitchen-game__helper" aria-hidden="true">
          <span>锅铲助手</span>
        </div>
      </div>

      <div className="meal-grid">
        <MealCard
          meal={planner.todayPlan.breakfast}
          foodsById={foodsById}
          isFlipped={flippedMeals.breakfast}
          isConfirmed={confirmedMeals.breakfast}
          onFlip={flipMeal}
          onConfirm={confirmMeal}
          onRefresh={refreshMeal}
        />
        <MealCard
          meal={planner.todayPlan.lunch}
          foodsById={foodsById}
          isFlipped={flippedMeals.lunch}
          isConfirmed={confirmedMeals.lunch}
          onFlip={flipMeal}
          onConfirm={confirmMeal}
          onRefresh={refreshMeal}
        />
        <MealCard
          meal={planner.todayPlan.dinner}
          foodsById={foodsById}
          isFlipped={flippedMeals.dinner}
          isConfirmed={confirmedMeals.dinner}
          onFlip={flipMeal}
          onConfirm={confirmMeal}
          onRefresh={refreshMeal}
        />
      </div>

      {isCompleted ? (
        <aside className="completion-banner" aria-live="polite">
          <p className="completion-banner__title">今日小厨师任务完成</p>
          <p>三张菜单卡都选好啦，今天照着这份菜单采购和准备就行。</p>
        </aside>
      ) : null}
    </section>
  );
}
