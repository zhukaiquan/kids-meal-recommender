# Task 1 Red/Green Log

This repo was scaffolded with TDD. The smoke test was run before the app shell existed, then rerun after the shell was implemented.

## Red phase

Command:

```bash
npm test -- --run src/App.test.tsx
```

Observed result:

- `src/App.test.tsx` failed
- Testing Library could not find the heading `Kids Meal Recommender`
- The rendered app was still the default Vite starter UI

## Green phase

Command:

```bash
npm test -- --run src/App.test.tsx
```

Observed result:

- `src/App.test.tsx` passed
- The app shell rendered the title and the three tabs required by the smoke test
