# Kids Meal Recommender 中文化与图片化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前英文的儿童餐食推荐工具升级为中文界面、儿童友好视觉风格，并支持为食物条目联网搜索插画/卡通风封面图。

**Architecture:** 保持现有 `React + TypeScript + Vite + localStorage` 架构不变。数据层先扩展 `FoodItem` 以支持图片元信息，并在存储读取时兼容老数据；图片搜索作为独立服务模块，通过公开 `Wikimedia Commons` API 直接由前端请求；UI 层再分两步改造，先重做食物库录入和图片选择，再升级今日推荐、历史记录和整体视觉。

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Wikimedia Commons API

---

## File Map

- Modify: `kids-meal-recommender/src/domain/types.ts`
- Modify: `kids-meal-recommender/src/domain/storage.ts`
- Modify: `kids-meal-recommender/src/domain/storage.test.ts`
- Create: `kids-meal-recommender/src/content/cn.ts`
- Create: `kids-meal-recommender/src/services/wikimedia.ts`
- Create: `kids-meal-recommender/src/services/wikimedia.test.ts`
- Create: `kids-meal-recommender/src/components/FoodImage.tsx`
- Create: `kids-meal-recommender/src/components/FoodImagePicker.tsx`
- Create: `kids-meal-recommender/src/components/FoodCardGrid.tsx`
- Modify: `kids-meal-recommender/src/components/FoodForm.tsx`
- Modify: `kids-meal-recommender/src/components/MealCard.tsx`
- Modify: `kids-meal-recommender/src/pages/FoodLibraryPage.tsx`
- Modify: `kids-meal-recommender/src/pages/TodayPage.tsx`
- Modify: `kids-meal-recommender/src/pages/HistoryPage.tsx`
- Modify: `kids-meal-recommender/src/hooks/useMealPlanner.ts`
- Modify: `kids-meal-recommender/src/hooks/useMealPlanner.test.tsx`
- Modify: `kids-meal-recommender/src/App.tsx`
- Modify: `kids-meal-recommender/src/App.test.tsx`
- Modify: `kids-meal-recommender/src/index.css`
- Modify: `kids-meal-recommender/README.md`

## Task 1: Extend The Domain Model For Images And Chinese Labels

**Files:**
- Modify: `kids-meal-recommender/src/domain/types.ts`
- Modify: `kids-meal-recommender/src/domain/storage.ts`
- Modify: `kids-meal-recommender/src/domain/storage.test.ts`
- Create: `kids-meal-recommender/src/content/cn.ts`

- [ ] **Step 1: Add a failing storage migration test for legacy food items**

Update `kids-meal-recommender/src/domain/storage.test.ts` with:

```ts
it("hydrates legacy food items without images", () => {
  localStorage.setItem(
    "foodItems",
    JSON.stringify([
      {
        id: "egg",
        name: "鸡蛋",
        mealTypes: ["breakfast"],
        tags: ["protein"],
        enabled: true,
      },
    ]),
  );

  const state = loadState();

  expect(state.foods).toEqual([
    {
      id: "egg",
      name: "鸡蛋",
      mealTypes: ["breakfast"],
      tags: ["protein"],
      enabled: true,
      image: null,
    },
  ]);
});
```

- [ ] **Step 2: Run the storage tests to verify the new expectation fails**

Run: `cd kids-meal-recommender && npm test -- --run src/domain/storage.test.ts`
Expected: FAIL because `loadState()` returns legacy food items without an `image` field.

- [ ] **Step 3: Extend the core types and add centralized Chinese labels**

Update `kids-meal-recommender/src/domain/types.ts`:

```ts
export type FoodImage = {
  thumbnailUrl: string;
  fullUrl: string;
  sourceName: "wikimedia-commons";
  sourcePageUrl: string;
  authorName: string | null;
  license: string | null;
  searchQuery: string;
};

export type FoodItem = {
  id: string;
  name: string;
  mealTypes: MealType[];
  tags: FoodTag[];
  enabled: boolean;
  image: FoodImage | null;
};
```

Create `kids-meal-recommender/src/content/cn.ts`:

```ts
import type { FoodTag, MealType } from "../domain/types";

export const mealLabels: Record<MealType, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

export const tagLabels: Record<FoodTag, string> = {
  staple: "主食",
  protein: "蛋白质",
  vegetable: "蔬菜",
  fruit: "水果",
  dairy: "奶制品",
  drink: "饮品",
};
```

- [ ] **Step 4: Normalize legacy foods while loading browser state**

Update `kids-meal-recommender/src/domain/storage.ts`:

```ts
function normalizeFood(food: FoodItem): FoodItem {
  return {
    ...food,
    image: food.image ?? null,
  };
}

export function loadState(): PersistedState {
  const foods = readJson(FOODS_KEY, [] as FoodItem[]).map(normalizeFood);

  return {
    foods,
    plans: readJson(PLANS_KEY, [] as DailyPlan[]),
    exclusions: readJson(EXCLUSIONS_KEY, [] as DailyExclusions[]),
  };
}
```

- [ ] **Step 5: Run storage tests again to verify the migration passes**

Run: `cd kids-meal-recommender && npm test -- --run src/domain/storage.test.ts`
Expected: PASS with all storage tests green.

- [ ] **Step 6: Commit the domain groundwork**

```bash
cd kids-meal-recommender
git add src/domain/types.ts src/domain/storage.ts src/domain/storage.test.ts src/content/cn.ts
git commit -m "feat: add image-aware food model"
```

## Task 2: Add Wikimedia Image Search As An Isolated Service

**Files:**
- Create: `kids-meal-recommender/src/services/wikimedia.ts`
- Create: `kids-meal-recommender/src/services/wikimedia.test.ts`

- [ ] **Step 1: Write a failing test for mapping Commons search results into selectable image candidates**

Create `kids-meal-recommender/src/services/wikimedia.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { searchFoodImages } from "./wikimedia";

describe("searchFoodImages", () => {
  it("maps Commons pages into image candidates", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            "1": {
              title: "File:Cartoon Egg.png",
              fullurl: "https://commons.wikimedia.org/wiki/File:Cartoon_Egg.png",
              imageinfo: [
                {
                  thumburl: "https://upload.wikimedia.org/thumb/egg.png",
                  url: "https://upload.wikimedia.org/egg.png",
                  extmetadata: {
                    Artist: { value: "Kid Artist" },
                    LicenseShortName: { value: "CC BY-SA 4.0" },
                  },
                },
              ],
            },
          },
        },
      }),
    });

    const results = await searchFoodImages("鸡蛋", fetcher as typeof fetch);

    expect(results).toEqual([
      {
        thumbnailUrl: "https://upload.wikimedia.org/thumb/egg.png",
        fullUrl: "https://upload.wikimedia.org/egg.png",
        sourceName: "wikimedia-commons",
        sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Cartoon_Egg.png",
        authorName: "Kid Artist",
        license: "CC BY-SA 4.0",
        searchQuery: "鸡蛋 插画 卡通 食物",
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the new service test to verify it fails**

Run: `cd kids-meal-recommender && npm test -- --run src/services/wikimedia.test.ts`
Expected: FAIL with module-not-found for `./wikimedia`.

- [ ] **Step 3: Implement the Commons image search service**

Create `kids-meal-recommender/src/services/wikimedia.ts`:

```ts
import type { FoodImage } from "../domain/types";

type Fetcher = typeof fetch;

function buildQuery(keyword: string) {
  return `${keyword.trim()} 插画 卡通 食物`;
}

export async function searchFoodImages(
  keyword: string,
  fetcher: Fetcher = fetch,
): Promise<FoodImage[]> {
  const searchQuery = buildQuery(keyword);
  const endpoint = new URL("https://commons.wikimedia.org/w/api.php");

  endpoint.searchParams.set("action", "query");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("origin", "*");
  endpoint.searchParams.set("generator", "search");
  endpoint.searchParams.set("gsrnamespace", "6");
  endpoint.searchParams.set("gsrsearch", searchQuery);
  endpoint.searchParams.set("gsrlimit", "6");
  endpoint.searchParams.set("prop", "imageinfo|info");
  endpoint.searchParams.set("inprop", "url");
  endpoint.searchParams.set("iiprop", "url|extmetadata");
  endpoint.searchParams.set("iiurlwidth", "320");

  const response = await fetcher(endpoint.toString());
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          fullurl?: string;
          imageinfo?: Array<{
            thumburl?: string;
            url?: string;
            extmetadata?: {
              Artist?: { value?: string };
              LicenseShortName?: { value?: string };
            };
          }>;
        }
      >;
    };
  };

  return Object.values(payload.query?.pages ?? {})
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl || !info.url || !page.fullurl) {
        return null;
      }

      return {
        thumbnailUrl: info.thumburl,
        fullUrl: info.url,
        sourceName: "wikimedia-commons" as const,
        sourcePageUrl: page.fullurl,
        authorName: info.extmetadata?.Artist?.value ?? null,
        license: info.extmetadata?.LicenseShortName?.value ?? null,
        searchQuery,
      };
    })
    .filter((item): item is FoodImage => item !== null);
}
```

- [ ] **Step 4: Re-run the service test to verify the mapper works**

Run: `cd kids-meal-recommender && npm test -- --run src/services/wikimedia.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the search service**

```bash
cd kids-meal-recommender
git add src/services/wikimedia.ts src/services/wikimedia.test.ts
git commit -m "feat: add food image search service"
```

## Task 3: Rebuild Food Library Editing Around Chinese Copy And Image Selection

**Files:**
- Create: `kids-meal-recommender/src/components/FoodImage.tsx`
- Create: `kids-meal-recommender/src/components/FoodImagePicker.tsx`
- Create: `kids-meal-recommender/src/components/FoodCardGrid.tsx`
- Modify: `kids-meal-recommender/src/components/FoodForm.tsx`
- Modify: `kids-meal-recommender/src/pages/FoodLibraryPage.tsx`
- Modify: `kids-meal-recommender/src/hooks/useMealPlanner.ts`
- Modify: `kids-meal-recommender/src/hooks/useMealPlanner.test.tsx`

- [ ] **Step 1: Add a failing hook test proving image metadata is preserved when adding foods**

Append to `kids-meal-recommender/src/hooks/useMealPlanner.test.tsx`:

```tsx
it("stores selected image metadata when adding a food", () => {
  const { result } = renderHook(() => useMealPlanner());

  act(() => {
    result.current.addFood({
      name: "鸡蛋",
      mealTypes: ["breakfast"],
      tags: ["protein"],
      enabled: true,
      image: {
        thumbnailUrl: "https://upload.wikimedia.org/thumb/egg.png",
        fullUrl: "https://upload.wikimedia.org/egg.png",
        sourceName: "wikimedia-commons",
        sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Cartoon_Egg.png",
        authorName: "Kid Artist",
        license: "CC BY-SA 4.0",
        searchQuery: "鸡蛋 插画 卡通 食物",
      },
    });
  });

  expect(result.current.foods[0]?.image?.thumbnailUrl).toContain("egg.png");
});
```

- [ ] **Step 2: Run the hook tests to verify they fail**

Run: `cd kids-meal-recommender && npm test -- --run src/hooks/useMealPlanner.test.tsx`
Expected: FAIL because `FoodDraft` does not yet include `image`.

- [ ] **Step 3: Extend the planner draft and create a reusable image component**

Update `kids-meal-recommender/src/hooks/useMealPlanner.ts`:

```ts
import type { DailyExclusions, FoodImage, FoodItem, FoodTag, MealType } from "../domain/types";

export type FoodDraft = {
  name: string;
  mealTypes: MealType[];
  tags: FoodTag[];
  enabled: boolean;
  image: FoodImage | null;
};

function createFood(next: FoodDraft): FoodItem {
  return {
    id: createFoodId(next.name),
    name: next.name,
    mealTypes: next.mealTypes,
    tags: next.tags,
    enabled: next.enabled,
    image: next.image,
  };
}
```

Create `kids-meal-recommender/src/components/FoodImage.tsx`:

```tsx
type FoodImageProps = {
  src: string | null | undefined;
  alt: string;
};

export function FoodImage({ src, alt }: FoodImageProps) {
  if (!src) {
    return <div className="food-image food-image--placeholder" aria-hidden="true">☆</div>;
  }

  return <img className="food-image" src={src} alt={alt} loading="lazy" />;
}
```

- [ ] **Step 4: Replace the plain form with a Chinese form plus image picker**

Create `kids-meal-recommender/src/components/FoodImagePicker.tsx`:

```tsx
import { useState } from "react";
import type { FoodImage } from "../domain/types";
import { searchFoodImages } from "../services/wikimedia";
import { FoodImage as FoodPreview } from "./FoodImage";

export function FoodImagePicker({
  keyword,
  value,
  onChange,
}: {
  keyword: string;
  value: FoodImage | null;
  onChange: (image: FoodImage | null) => void;
}) {
  const [results, setResults] = useState<FoodImage[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setResults(await searchFoodImages(keyword));
    setLoading(false);
  }

  return (
    <section>
      <div className="picker-header">
        <span>封面图片</span>
        <button type="button" onClick={handleSearch} disabled={!keyword.trim() || loading}>
          {loading ? "搜索中..." : "搜索图片"}
        </button>
      </div>
      <FoodPreview src={value?.thumbnailUrl} alt={keyword || "食物封面"} />
      <div className="image-search-grid">
        {results.map((image) => (
          <button key={image.fullUrl} type="button" onClick={() => onChange(image)}>
            <FoodPreview src={image.thumbnailUrl} alt={keyword} />
          </button>
        ))}
      </div>
      <button type="button" onClick={() => onChange(null)}>
        不设置图片
      </button>
    </section>
  );
}
```

Update `kids-meal-recommender/src/components/FoodForm.tsx` so it:

- uses Chinese field labels and validation messages
- imports `mealLabels` and `tagLabels`
- manages `enabled` state
- manages `selectedImage` state
- submits `{ name, mealTypes, tags, enabled, image }`

Key submit block:

```tsx
onSubmit({
  name: trimmedName,
  mealTypes: selectedMeals,
  tags: selectedTags,
  enabled,
  image: selectedImage,
});
```

- [ ] **Step 5: Replace the table with visual food cards in the food library page**

Create `kids-meal-recommender/src/components/FoodCardGrid.tsx`:

```tsx
import { mealLabels, tagLabels } from "../content/cn";
import type { FoodItem } from "../domain/types";
import { FoodImage } from "./FoodImage";

export function FoodCardGrid({ foods, onEdit, onToggleEnabled, onDelete }: {
  foods: FoodItem[];
  onEdit: (food: FoodItem) => void;
  onToggleEnabled: (food: FoodItem) => void;
  onDelete: (foodId: string) => void;
}) {
  return (
    <div className="food-card-grid">
      {foods.map((food) => (
        <article key={food.id} className="food-card">
          <FoodImage src={food.image?.thumbnailUrl} alt={food.name} />
          <h3>{food.name}</h3>
          <p>{food.mealTypes.map((meal) => mealLabels[meal]).join(" / ")}</p>
          <div className="tag-pill-row">
            {food.tags.map((tag) => (
              <span key={tag} className="tag-pill">{tagLabels[tag]}</span>
            ))}
          </div>
          <div className="food-card__actions">
            <button type="button" onClick={() => onEdit(food)}>编辑</button>
            <button type="button" onClick={() => onToggleEnabled(food)}>
              {food.enabled ? "停用" : "启用"}
            </button>
            <button type="button" onClick={() => onDelete(food.id)}>删除</button>
          </div>
        </article>
      ))}
    </div>
  );
}
```

Update `kids-meal-recommender/src/pages/FoodLibraryPage.tsx` so the page heading and button labels are Chinese and it renders `FoodCardGrid` instead of `FoodTable`.

When editing an existing food, persist the draft fields with:

```tsx
planner.updateFood({
  ...latestFood,
  name: draft.name,
  mealTypes: draft.mealTypes,
  tags: draft.tags,
  enabled: draft.enabled,
  image: draft.image,
});
```

- [ ] **Step 6: Re-run the hook tests to verify image-aware food drafts work**

Run: `cd kids-meal-recommender && npm test -- --run src/hooks/useMealPlanner.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit the food library redesign**

```bash
cd kids-meal-recommender
git add src/components/FoodImage.tsx src/components/FoodImagePicker.tsx src/components/FoodCardGrid.tsx src/components/FoodForm.tsx src/pages/FoodLibraryPage.tsx src/hooks/useMealPlanner.ts src/hooks/useMealPlanner.test.tsx
git commit -m "feat: redesign food library in chinese"
```

## Task 4: Upgrade Today, History, And The App Shell To A Child-Friendly Chinese UI

**Files:**
- Modify: `kids-meal-recommender/src/components/MealCard.tsx`
- Modify: `kids-meal-recommender/src/pages/TodayPage.tsx`
- Modify: `kids-meal-recommender/src/pages/HistoryPage.tsx`
- Modify: `kids-meal-recommender/src/App.tsx`
- Modify: `kids-meal-recommender/src/App.test.tsx`
- Modify: `kids-meal-recommender/src/index.css`

- [ ] **Step 1: Extend the app test to assert Chinese tabs and image-based cards**

Update `kids-meal-recommender/src/App.test.tsx`:

```tsx
it("shows chinese primary tabs", () => {
  render(<App />);

  expect(screen.getByRole("tab", { name: "今日推荐" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "食物库" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "历史记录" })).toBeInTheDocument();
});

it("shows food images in history cards when present", async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    "foodItems",
    JSON.stringify([
      {
        id: "egg",
        name: "鸡蛋",
        mealTypes: ["breakfast"],
        tags: ["protein"],
        enabled: true,
        image: {
          thumbnailUrl: "https://upload.wikimedia.org/thumb/egg.png",
          fullUrl: "https://upload.wikimedia.org/egg.png",
          sourceName: "wikimedia-commons",
          sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Cartoon_Egg.png",
          authorName: "Kid Artist",
          license: "CC BY-SA 4.0",
          searchQuery: "鸡蛋 插画 卡通 食物",
        },
      },
    ]),
  );

  localStorage.setItem(
    "dailyPlans",
    JSON.stringify([
      {
        date: "2026-03-27",
        breakfast: { mealType: "breakfast", foods: [{ foodId: "egg", foodNameSnapshot: "鸡蛋", tags: ["protein"] }] },
        lunch: { mealType: "lunch", foods: [] },
        dinner: { mealType: "dinner", foods: [] },
        updatedAt: "2026-03-27T08:00:00.000Z",
      },
    ]),
  );

  render(<App />);
  await user.click(screen.getByRole("tab", { name: "历史记录" }));

  expect(screen.getByRole("img", { name: "鸡蛋" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the app tests to verify the new assertions fail**

Run: `cd kids-meal-recommender && npm test -- --run src/App.test.tsx`
Expected: FAIL because the UI is still English and history cards do not yet render images.

- [ ] **Step 3: Translate the shell and upgrade the visual components**

Update `kids-meal-recommender/src/App.tsx`:

```tsx
const tabs = [
  { id: "today", label: "今日推荐" },
  { id: "food-library", label: "食物库" },
  { id: "history", label: "历史记录" },
] as const;
```

Update `kids-meal-recommender/src/components/MealCard.tsx`:

```tsx
import { mealLabels } from "../content/cn";
import { FoodImage } from "./FoodImage";

export function MealCard({ meal, onRefresh, foodsById }: MealCardProps) {
  return (
    <article className="meal-card" aria-label={mealLabels[meal.mealType]}>
      <header className="meal-card__header">
        <div>
          <h3>{mealLabels[meal.mealType]}</h3>
          <p>今天吃点喜欢的吧</p>
        </div>
        <button type="button" onClick={() => onRefresh(meal.mealType)}>
          换一个
        </button>
      </header>
      <div className="meal-food-grid">
        {meal.foods.map((food) => (
          <article key={`${meal.mealType}-${food.foodId}`} className="meal-food-chip">
            <FoodImage src={foodsById[food.foodId]?.image?.thumbnailUrl} alt={food.foodNameSnapshot} />
            <span>{food.foodNameSnapshot}</span>
          </article>
        ))}
      </div>
    </article>
  );
}
```

Update `kids-meal-recommender/src/pages/TodayPage.tsx` and `kids-meal-recommender/src/pages/HistoryPage.tsx` to:

- show Chinese headings and empty states
- pass `foodsById` into the meal/history cards
- render images via `FoodImage`

Update `kids-meal-recommender/src/index.css` to introduce:

```css
:root {
  font-family: "LXGW WenKai", "PingFang SC", "Hiragino Sans GB", sans-serif;
  color: #3f2f1e;
  background:
    radial-gradient(circle at top left, #fff4d6 0, transparent 28%),
    radial-gradient(circle at top right, #dff4d8 0, transparent 22%),
    linear-gradient(180deg, #fffaf2 0%, #fff3dd 100%);
}

.food-card,
.meal-card,
.history-card {
  border-radius: 24px;
  border: 1px solid rgba(233, 153, 68, 0.24);
  box-shadow: 0 16px 40px rgba(166, 112, 36, 0.08);
}

.tag-pill {
  border-radius: 999px;
  background: #fff1c7;
  padding: 4px 10px;
}
```

- [ ] **Step 4: Run the app tests again to verify the translated UI passes**

Run: `cd kids-meal-recommender && npm test -- --run src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the Chinese UI upgrade**

```bash
cd kids-meal-recommender
git add src/components/MealCard.tsx src/pages/TodayPage.tsx src/pages/HistoryPage.tsx src/App.tsx src/App.test.tsx src/index.css
git commit -m "feat: add chinese child-friendly ui"
```

## Task 5: Refresh Docs, Rebuild, And Publish The Updated Site

**Files:**
- Modify: `kids-meal-recommender/README.md`

- [ ] **Step 1: Rewrite the README in Chinese and document the image workflow**

Update `kids-meal-recommender/README.md`:

```md
# 儿童餐食推荐器

一个面向家长的中文 Web 小工具，用来从食物库中生成孩子当天的早餐、午餐和晚餐建议。

## 当前能力

- 中文界面
- 按餐型与标签管理食物库
- 为食物搜索并选择封面图
- 每天生成三餐推荐
- 单餐刷新
- 浏览历史记录

## 本地运行

- `npm install`
- `npm run dev`
- `npm test -- --run`
- `npm run build`

## 线上地址

- `https://zhukaiquan.github.io/kids-meal-recommender/`
```

- [ ] **Step 2: Run the full test suite**

Run: `cd kids-meal-recommender && npm test -- --run`
Expected: PASS with all test files green.

- [ ] **Step 3: Run the production build**

Run: `cd kids-meal-recommender && npm run build`
Expected: PASS with Vite output in `dist/`.

- [ ] **Step 4: Commit the finished feature**

```bash
cd kids-meal-recommender
git add README.md src
git commit -m "feat: add chinese image-based meal planner"
```

- [ ] **Step 5: Push `main` and refresh the `gh-pages` branch deployment**

Run:

```bash
cd kids-meal-recommender
git push origin main

PAGES_DIR="$(mktemp -d /tmp/kids-meal-pages.XXXXXX)"
cp -R dist/. "$PAGES_DIR"
touch "$PAGES_DIR/.nojekyll"
git -C "$PAGES_DIR" init -b gh-pages
git -C "$PAGES_DIR" add .
git -C "$PAGES_DIR" commit -m "Deploy site"
git -C "$PAGES_DIR" remote add origin https://github.com/zhukaiquan/kids-meal-recommender.git
git -C "$PAGES_DIR" push -f origin gh-pages
```

Expected:

- `main` push succeeds
- `gh-pages` force-push succeeds
- `https://zhukaiquan.github.io/kids-meal-recommender/` serves the updated Chinese UI
