import type { FoodItem } from "../domain/types";

export const demoFoods: FoodItem[] = [
  { id: "demo-millet-porridge", name: "小米粥", mealTypes: ["breakfast"], tags: ["staple"], enabled: true, image: null },
  { id: "demo-steamed-bun", name: "小馒头", mealTypes: ["breakfast"], tags: ["staple"], enabled: true, image: null },
  { id: "demo-egg-custard", name: "鸡蛋羹", mealTypes: ["breakfast", "lunch", "dinner"], tags: ["protein"], enabled: true, image: null },
  { id: "demo-milk", name: "牛奶", mealTypes: ["breakfast"], tags: ["dairy", "drink"], enabled: true, image: null },
  { id: "demo-banana", name: "香蕉", mealTypes: ["breakfast"], tags: ["fruit"], enabled: true, image: null },
  { id: "demo-apple", name: "苹果块", mealTypes: ["breakfast"], tags: ["fruit"], enabled: true, image: null },
  { id: "demo-rice", name: "软米饭", mealTypes: ["lunch", "dinner"], tags: ["staple"], enabled: true, image: null },
  { id: "demo-noodles", name: "番茄面", mealTypes: ["lunch", "dinner"], tags: ["staple"], enabled: true, image: null },
  { id: "demo-chicken-ball", name: "鸡肉丸", mealTypes: ["lunch", "dinner"], tags: ["protein"], enabled: true, image: null },
  { id: "demo-tofu", name: "嫩豆腐", mealTypes: ["lunch", "dinner"], tags: ["protein"], enabled: true, image: null },
  { id: "demo-beef", name: "番茄牛肉", mealTypes: ["lunch", "dinner"], tags: ["protein"], enabled: true, image: null },
  { id: "demo-broccoli", name: "西兰花", mealTypes: ["lunch", "dinner"], tags: ["vegetable"], enabled: true, image: null },
  { id: "demo-carrot", name: "胡萝卜", mealTypes: ["lunch", "dinner"], tags: ["vegetable"], enabled: true, image: null },
  { id: "demo-pumpkin", name: "南瓜块", mealTypes: ["lunch", "dinner"], tags: ["vegetable"], enabled: true, image: null },
  { id: "demo-yogurt", name: "酸奶", mealTypes: ["breakfast"], tags: ["dairy"], enabled: true, image: null },
  { id: "demo-soy-milk", name: "豆浆", mealTypes: ["breakfast"], tags: ["drink"], enabled: true, image: null },
];
