# 儿童餐食推荐器

一个面向家长的中文 Web 小工具，用来从食物库中生成孩子当天的早餐、午餐和晚餐建议。

## 当前能力

- 中文界面与更偏亲子感的卡片式 UI
- 按餐次和标签维护食物库
- 为食物联网搜索并选择封面图
- 每天自动生成早餐、午餐、晚餐推荐
- 单餐单独刷新，不影响另外两餐
- 浏览历史记录，减少重复做同一套菜单

## 本地运行

- `npm install`
- `npm run dev`
- `npm test -- --run`
- `npm run build`

## 图片来源

- 当前使用公开的 `Wikimedia Commons` 搜图接口
- 选中的图片元信息保存在浏览器本地，不保存原始图片文件

## 线上地址

- [https://zhukaiquan.github.io/kids-meal-recommender/](https://zhukaiquan.github.io/kids-meal-recommender/)

## 部署方式

- 源码分支：`main`
- 静态站点分支：`gh-pages`
