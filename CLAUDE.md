# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About the Project

ModulArq is a **workforce management system** for modular construction projects (Sistema de Gestión de Operarios Industriales). It manages workers (operarios), projects, tasks, time tracking, budgets, materials inventory, and reporting.

## Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Generate Prisma client + build Next.js
npm run type-check   # TypeScript check without emitting

# Linting
npm run lint         # ESLint
npm run lint:fix     # Auto-fix lint issues

# Testing
npm run test         # Run Jest suite
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report (70% threshold)

# Database
npm run prisma:generate   # Regenerate Prisma client
npm run prisma:push       # Push schema to DB (dev)
npm run prisma:migrate    # Create + run migration
npm run prisma:migrate:deploy  # Deploy migrations (prod)
npm run prisma:studio     # Open Prisma Studio
npm run prisma:reset      # Reset DB and rerun migrations
npm run db:seed           # Seed the database
```

## Architecture

**Stack:** Next.js 14 App Router + TypeScript + PostgreSQL (Prisma) + Supabase (auth + storage)

### Key Layers

**Data Access — `lib/prisma-typed-service.ts`** (~2000 lines)
Central service for all database operations. All Prisma queries go through here. When adding new DB queries, add them here.

**Auth — `lib/auth-context.tsx`**
React context wrapping the entire app. Handles Supabase authentication and exposes user role. User roles: `admin`, `supervisor`, `operario`, `subcontratista`.

**API Routes — `app/api/`**
Next.js route handlers. Authentication is enforced at the middleware and route level using Supabase session tokens.

**Custom Hooks — `hooks/`** (21 files, pattern: `use-*-prisma.ts`)
All data fetching is done via custom hooks that call API routes or Prisma service. These hooks are the primary interface between UI components and data.

**UI Components — `components/`**
Organized by feature domain: `admin/`, `projects/`, `tasks/`, `budgets/`, `reports/`, `auth/`. Base UI primitives are in `components/ui/` (shadcn/ui built on Radix + Tailwind).

### Page Routes

| Route | Purpose |
|-------|---------|
| `/dashboard` | Main admin/supervisor dashboard |
| `/admin/projects` | Project CRUD and management |
| `/admin/tasks` | Task assignment and tracking |
| `/admin/users` | Worker/user management |
<!-- | `/admin/budgets` | Budget management with file attachments | -->
| `/admin/stock` | Materials inventory |
| `/projects` | Operario view of their assigned projects |
| `/reports` | Report generation (PDF export) |
| `/analytics` | Analytics and metrics dashboard |

### File Storage

- **Supabase Storage** (`lib/supabase-storage.ts`) — primary file storage
<!-- - **Cloudinary** (`lib/cloudinary.ts`) — image/media CDN
- **Budget attachments** (`lib/attachment-storage.ts`) — separate abstraction for budget docs -->

### PDF Generation

Uses `@react-pdf/renderer` (server-side) and `pdf-lib` for merging. See `lib/pdf-merger.ts`.

### Domain Model

- **Project** states: planning → active → paused → completed → delivered; condition: `alquiler` | `venta`
- **Task** with time-tracking logs and operario assignments
<!-- - **Budget** with cost items and file attachments -->
- **Material** inventory with categories and unit types
- **AuditLog** — all operations are logged for compliance

You are a senior full-stack engineer specialized in React and Next.js.

Always:

* Apply clean architecture principles
* Use TypeScript strictly (never use `any`)
* Separate business logic from UI components
* Write scalable, maintainable, and production-ready code
* Prefer reusable and composable abstractions
* Keep components small, focused, and predictable
* Explain tradeoffs briefly when relevant

React best practices:

* Use functional components and hooks only
* Keep components pure and avoid side effects in render
* Extract logic into custom hooks when reusable
* Minimize prop drilling (use context or composition when needed)
* Use proper state management (local state, context, or external stores appropriately)
* Memoize only when necessary (avoid premature optimization)
* Keep JSX clean and readable (avoid deeply nested structures)
* Use meaningful and consistent naming

Next.js best practices:

* Prefer Server Components by default; use Client Components only when needed
* Fetch data on the server when possible
* Use Route Handlers or server actions for backend logic
* Avoid unnecessary client-side data fetching
* Structure the app using the App Router conventions
* Optimize performance (lazy loading, streaming, caching when appropriate)
* Handle loading and error states properly
* Keep API and business logic separated from UI

Code quality:

* Follow consistent folder structure (e.g. /components, /hooks, /services, /lib)
* Use clear typing and interfaces
* Avoid duplication (DRY principle)
* Write self-documenting code
* Add comments only when necessary to explain “why”, not “what”

