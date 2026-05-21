# Frontend (Vite + React) + SaaS Structure Scaffold

## Current runtime (DO NOT BREAK)

- Entry: `frontend/src/main.tsx`
- Routes: `frontend/src/App.tsx`
- API client: `frontend/src/api/api.js`
- Existing screens are in `frontend/src/pages/*`

## SaaS target structure (incremental)

We are adding a production-ready structure under:

- `frontend/src/app/` (routes/providers/layouts/store)
- `frontend/src/modules/` (feature-first)
- `frontend/src/shared/` (ui/hooks/utils/lib/types)

This is added **without changing UI/behavior** yet.

## Import aliases (non-breaking)

Path aliases are configured in `frontend/tsconfig.json` for cleaner imports:

- `@app/*`
- `@modules/*`
- `@shared/*`
- `@components/*`
- `@pages/*`
- `@api/*`
- `@assets/*`
- `@styles/*`

## Architecture docs (keep updated)

- Diagram: `frontend/ARCHITECTURE_DIAGRAM.md`
- Full file tree: `frontend/FILE_TREE.md`

## Code limits (guideline)

- Page: ideal 150-250, max 300
- Component: ideal 80-150, max 200
- Hook: ideal 50-120, max 150
- Service/API: ideal 100-200, max 250
