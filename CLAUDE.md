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
| `/admin/budgets` | Budget management with file attachments |
| `/admin/stock` | Materials inventory |
| `/projects` | Operario view of their assigned projects |
| `/reports` | Report generation (PDF export) |
| `/analytics` | Analytics and metrics dashboard |

### File Storage

- **Supabase Storage** (`lib/supabase-storage.ts`) — primary file storage
- **Cloudinary** (`lib/cloudinary.ts`) — image/media CDN
- **Budget attachments** (`lib/attachment-storage.ts`) — separate abstraction for budget docs

### PDF Generation

Uses `@react-pdf/renderer` (server-side) and `pdf-lib` for merging. See `lib/pdf-merger.ts`.

### Domain Model

- **Project** states: planning → active → paused → completed → delivered; condition: `alquiler` | `venta`
- **Task** with time-tracking logs and operario assignments
- **Budget** with cost items and file attachments
- **Material** inventory with categories and unit types
- **AuditLog** — all operations are logged for compliance

### Monitoring

Health check endpoint at `/api/health`. Local monitoring scripts live in `monitoring/`. Middleware (`middleware.ts`) tracks request response times.
