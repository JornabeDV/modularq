---
name: Budget module architecture
description: Current state of the budget module — schema, key components, and creation flow
type: project
---

The budget module is fully implemented in Prisma schema and Next.js components. Key facts:

- Budget creation entry point: `components/budgets/CreateBudgetDialog.tsx` — currently collects only `client_name`, `location`, `description`. No template selection yet.
- Budget list page: `app/admin/budgets/page.tsx` — desktop-oriented table with sort/filter/pagination.
- Budget detail page: `app/admin/budgets/[id]/page.tsx`
- Main hook: `hooks/useBudget.ts` — handles quantity edits with pending-changes pattern (batch save on demand).
- Service layer: `lib/prisma-typed-service.ts` — all DB calls go through `PrismaTypedService`.

Schema already has `BudgetItemTemplate` model in Prisma (code, category, description, unit, order, template_labors/materials/equipments as Json). This is not yet seeded or used in the UI.

There are 8 predefined module types the user wants to use as budget templates:
1. Módulo Planta Libre
2. Módulo Planta libre con baño simple
3. Módulo Planta libre con baño y Ducha
4. Módulo Planta libre de 18 mts cuadrados
5. Módulo hermanado
6. Módulo garita seguridad
7. Sanitario mixto
8. Sanitario duchas inodoros

**Why:** Standardize budget creation so generating a report for a known module type is fast — pre-filled items, quantities, and price analysis instead of building from scratch every time.

**How to apply:** When designing the template feature, build on top of the existing `BudgetItemTemplate` schema already in Prisma. The `CreateBudgetDialog` is the natural injection point for template selection.
