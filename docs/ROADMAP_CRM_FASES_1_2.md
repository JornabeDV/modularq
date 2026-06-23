# Roadmap Técnico: ModularQ como CRM Integrado
## Fases 1 y 2 — Pipeline Comercial + Seguimiento

> **Estado:** Documento técnico para estimación y desarrollo  
> **Basado en schema Prisma actual:** `prisma/schema.prisma` (779 líneas, 35+ modelos)  
> **Ventaja competitiva existente:** Cotizador + ejecución de proyectos ya integrados

---

## 1. DIAGNÓSTICO RÁPIDO DE LO EXISTENTE

Tu sistema ya tiene piezas que aceleran el CRM:

| Pieza existente | Qué falta para CRM |
|-----------------|-------------------|
| `UserRole.vendedor` (en enum) | Sin funcionalidad propia, sin metas, sin comisiones |
| `Client` + `ClientContact` | Sin segmentación, sin fuente de origen, sin LTV |
| `Quote` (cotizador unificado) | Sin etapa de venta, sin vendedor asignado, sin seguimiento |
| `Budget` (presupuestos detallados) | Sin vinculación a pipeline, sin probabilidad de cierre |
| `Project` | Sin post-venta, sin encuesta de satisfacción |
| Dashboard de operarios/productividad | Sin dashboard comercial (ventas, conversión, pipeline) |

**Conclusión:** No hay que rehacer nada. Hay que **agregar una capa comercial** arriba de lo que existe.

---

## 2. CAMBIOS EN BASE DE DATOS (Prisma Schema)

### 2.1 Nuevos Enums

```prisma
enum LeadSource {
  web
  referral        // Referido
  social_media
  phone
  email
  fair            // Feria
  google_ads
  other
}

enum LeadStatus {
  new             // Nuevo, sin contactar
  contacted       // Se intentó contactar
  qualified       // Calificado, tiene necesidad y presupuesto
  unqualified     // Descalificado
  converted       // Se convirtió en cliente
}

enum OpportunityStage {
  prospecting     // Prospección / primer contacto
  meeting         // Reunión agendada
  proposal_sent   // Cotización enviada
  negotiation     // Negociación
  closed_won      // Cerrada ganada
  closed_lost     // Cerrada perdida
}

enum ActivityType {
  call            // Llamada
  email           // Email
  meeting         // Reunión
  visit           // Visita a obra
  whatsapp        // WhatsApp
  note            // Nota libre
  task            // Tarea / recordatorio
}

enum ActivityStatus {
  pending
  completed
  cancelled
}

enum LossReason {
  price           // Precio alto
  timing          // Tiempos de entrega
  no_budget       // No tenía presupuesto
  competition     // Se fue con competencia
  no_response     // No respondió
  other
}
```

### 2.2 Modelos Nuevos

#### `Lead` (Prospecto)
Un lead es alguien que todavía no es cliente formal. Puede venir de una llamada, la web, un referido.

```prisma
model Lead {
  id          String    @id @default(cuid())
  
  // Datos básicos
  company_name  String?
  contact_name  String
  email         String?
  phone         String?
  address       String?
  
  // Clasificación
  source        LeadSource @default(other)
  status        LeadStatus @default(new)
  
  // Asignación
  assigned_to   String?   // User (vendedor)
  
  // Campos CRM
  notes         String?
  estimated_value Float?  // Valor estimado de la oportunidad
  
  // Conversión
  converted_to_client_id String? @unique
  converted_to_client    Client? @relation(fields: [converted_to_client_id], references: [id])
  converted_at           DateTime?
  
  // Relaciones
  activities    Activity[]
  opportunities Opportunity[]
  
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  assigned_user User?     @relation(fields: [assigned_to], references: [id])

  @@map("leads")
}
```

#### `Opportunity` (Oportunidad de Venta)
Es el "pipeline" propiamente dicho. Una oportunidad puede nacer de un Lead o directamente de un Cliente existente.

```prisma
model Opportunity {
  id          String    @id @default(cuid())
  
  // Título descriptivo (ej: "Oficina modular para Constructora XYZ")
  title       String
  description String?
  
  // Vinculación (uno de los dos debe existir)
  lead_id     String?
  client_id   String?
  
  // Pipeline
  stage       OpportunityStage @default(prospecting)
  probability Int              @default(0)  // 0-100%, se puede auto-calcular por etapa
  
  // Valores
  estimated_value Float?     // Valor estimado de la venta
  actual_value    Float?     // Valor final (cuando se cierra)
  
  // Cierre
  expected_close_date DateTime?
  closed_at           DateTime?
  closed_by           String?
  loss_reason         LossReason?
  loss_notes          String?
  
  // Vinculación con cotización (cuando se envía propuesta)
  quote_id    String? @unique
  quote       Quote?  @relation(fields: [quote_id], references: [id])
  
  // Vinculación con presupuesto detallado
  budget_id   String? @unique
  budget      Budget? @relation(fields: [budget_id], references: [id])
  
  // Asignación
  assigned_to String?  // User (vendedor)
  
  // Relaciones
  activities  Activity[]
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  lead        Lead?    @relation(fields: [lead_id], references: [id])
  client      Client?  @relation(fields: [client_id], references: [id])
  assigned_user User?  @relation(fields: [assigned_to], references: [id])
  closed_by_user User? @relation(fields: [closed_by], references: [id])

  @@map("opportunities")
}
```

#### `Activity` (Actividad de Seguimiento)
Toda interacción con el cliente/prospecto queda registrada acá.

```prisma
model Activity {
  id          String    @id @default(cuid())
  
  // Tipo y estado
  type        ActivityType
  status      ActivityStatus @default(pending)
  
  // Descripción
  subject     String    // Asunto: "Llamada de seguimiento cotización"
  description String?   // Detalle de lo conversado
  
  // Fechas
  scheduled_at  DateTime?   // Cuándo está agendada / cuándo ocurrió
  completed_at  DateTime?
  
  // Recordatorio
  reminder_at   DateTime?   // Notificación antes de la actividad
  
  // Vinculación polimórfica (una actividad va contra uno de estos)
  lead_id       String?
  client_id     String?
  opportunity_id String?
  
  // Autor
  created_by    String
  
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  lead          Lead?       @relation(fields: [lead_id], references: [id], onDelete: Cascade)
  client        Client?     @relation(fields: [client_id], references: [id], onDelete: Cascade)
  opportunity   Opportunity? @relation(fields: [opportunity_id], references: [id], onDelete: Cascade)
  created_by_user User      @relation(fields: [created_by], references: [id])

  @@map("activities")
}
```

#### `OpportunityStageConfig` (Configuración de Etapas)
Permite que el dueño configure las etapas y probabilidades sin tocar código.

```prisma
model OpportunityStageConfig {
  id          String   @id @default(cuid())
  name        String   // "Cotización enviada"
  stage_key   String   @unique // "proposal_sent"
  probability Int      // 40
  order       Int      // Para ordenar en el pipeline
  color       String   @default("#3b82f6") // Tailwind color
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@map("opportunity_stage_configs")
}
```

### 2.3 Modificaciones a Modelos Existentes

#### `Client` — Enriquecer
```prisma
model Client {
  id           String   @id @default(cuid())
  cuit         String   @unique
  company_name String
  representative String?
  email        String?
  phone        String?
  
  // NUEVOS CAMPOS CRM
  address      String?
  city         String?
  province     String?
  segment      String?  // "constructora", "arquitecto", "particular", "gobierno", "industria"
  tags         String[] // Array de tags: ["vip", "recurrente", "pagos_lentos"]
  source       LeadSource @default(other) // De dónde vino originalmente
  notes        String?
  
  // Métricas calculadas (se actualizan por trigger o job)
  total_spent  Float    @default(0) // LTV: suma de todos los proyectos
  project_count Int    @default(0)
  last_project_date DateTime?
  
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  projects     Project[]
  contacts     ClientContact[]
  activities   Activity[]
  opportunities Opportunity[]
  lead         Lead?     // Si vino de un lead convertido

  @@map("clients")
}
```

#### `Quote` — Vincular a oportunidad y vendedor
```prisma
model Quote {
  id             String   @id @default(uuid()) @map("id")
  number         String   @unique
  quote_type     String   @default("sale")
  status         String   @default("draft")
  client_id      String?
  client_name    String
  client_company String?
  client_phone   String?
  client_email   String?
  
  // NUEVO: Vendedor asignado
  assigned_to    String?
  
  // NUEVO: Estado del seguimiento comercial
  follow_up_status String? @default("pending") // pending, contacted, negotiating, closed
  
  subtotal       Float    @default(0)
  total          Float    @default(0)
  total_ars      Float?
  currency       String   @default("USD")
  // ... resto igual

  items          QuoteItem[]
  project        Project?
  opportunity    Opportunity? // Relación inversa 1:1
  
  // NUEVO: Relación
  assigned_user  User?    @relation(fields: [assigned_to], references: [id])

  @@map("quotes")
}
```

#### `Budget` — Vincular a oportunidad
```prisma
model Budget {
  id          String       @id @default(cuid())
  budget_code String       @unique
  // ... resto igual
  
  // NUEVO: Relación con oportunidad
  opportunity   Opportunity?

  @@map("budgets")
}
```

#### `User` — Agregar relaciones CRM
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String?
  role        UserRole
  total_hours Float    @default(0)
  efficiency  Float    @default(0)
  deleted_at  DateTime?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  // EXISTENTES...
  supervised_projects Project[] @relation("ProjectSupervisor")
  assigned_tasks      Task[]    @relation("TaskAssignee")
  assigned_projects    ProjectOperario[]
  assigned_project_tasks ProjectTask[] @relation("ProjectTaskAssignee")
  assigned_by_project_materials ProjectMaterial[] @relation("ProjectMaterialAssignedBy")
  started_project_tasks ProjectTask[] @relation("ProjectTaskStartedBy")
  completed_project_tasks ProjectTask[] @relation("ProjectTaskCompletedBy")
  completed_planning_items ProjectPlanningChecklist[]

  // NUEVOS: Relaciones CRM
  assigned_leads       Lead[]
  assigned_opportunities Opportunity[]
  closed_opportunities Opportunity[] @relation("OpportunityClosedBy")
  created_activities   Activity[]
  assigned_quotes      Quote[]

  @@map("users")
}
```

### 2.4 Resumen de Cambios en Schema

| Concepto | Acción | Modelos afectados |
|----------|--------|-------------------|
| Leads | Crear | `Lead` nuevo |
| Pipeline | Crear | `Opportunity`, `OpportunityStageConfig` |
| Actividades | Crear | `Activity` |
| Cliente enriquecido | Modificar | `Client` (+8 campos) |
| Vendedor en cotización | Modificar | `Quote` (+`assigned_to`) |
| User con CRM | Modificar | `User` (+4 relaciones) |
| Budget/Quote vinculados | Modificar | `Budget`, `Quote` |

---

## 3. APIs NECESARIAS (Next.js App Router)

### 3.1 Fase 1 — Pipeline + Vendedor

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/crm/leads` | GET, POST | CRUD de leads |
| `/api/crm/leads/[id]` | GET, PATCH, DELETE | Lead específico |
| `/api/crm/leads/[id]/convert` | POST | Convertir lead → Cliente + Opportunity |
| `/api/crm/opportunities` | GET, POST | Listar y crear oportunidades |
| `/api/crm/opportunities/[id]` | GET, PATCH | Ver/mover etapa de oportunidad |
| `/api/crm/opportunities/[id]/close` | POST | Cerrar oportunidad (ganada/perdida) |
| `/api/crm/stages` | GET, POST, PATCH | Configurar etapas del pipeline |
| `/api/quotes` | GET | Modificar para filtrar por `assigned_to` |
| `/api/quotes/[id]/assign` | PATCH | Asignar vendedor a cotización |
| `/api/quotes/[id]/convert-to-opportunity` | POST | Cotización → Oportunidad |

### 3.2 Fase 2 — Actividades + Dashboard

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/crm/activities` | GET, POST | CRUD de actividades |
| `/api/crm/activities/[id]` | GET, PATCH, DELETE | Actividad específica |
| `/api/crm/activities/upcoming` | GET | Próximas actividades (dashboard) |
| `/api/crm/activities/today` | GET | Actividades de hoy |
| `/api/crm/dashboard/sales` | GET | KPIs comerciales |
| `/api/crm/dashboard/pipeline` | GET | Datos para gráfico de embudo |
| `/api/crm/dashboard/conversion` | GET | Tasa de conversión por vendedor/periodo |
| `/api/crm/reports/forecast` | GET | Pronóstico de ventas |

---

## 4. NUEVAS PANTALLAS / COMPONENTES

### 4.1 Fase 1

#### A. Módulo "Comercial" (nueva sección en sidebar)
```
📊 Comercial
  ├─ 🎯 Pipeline (oportunidades)
  ├─ 📋 Leads
  ├─ 💬 Actividades
  └─ 📈 Mi Panel (vendedores)
```

#### B. Pantalla: Pipeline (Kanban)
- **UI:** Columnas por etapa (`OpportunityStage`), tarjetas arrastrables
- **Datos:** `Opportunity` con `client.name`, `estimated_value`, `expected_close_date`, `assigned_to.name`
- **Acciones:**
  - Mover tarjeta de etapa (cambia `stage` y `probability`)
  - Click → Drawer lateral con detalle + historial de actividades
  - Botón "Nueva oportunidad" (modal)
  - Botón "Cerrar" → modal con ganada/perdida + motivo
- **Componentes nuevos:**
  - `components/crm/pipeline-board.tsx`
  - `components/crm/pipeline-card.tsx`
  - `components/crm/opportunity-form.tsx`
  - `components/crm/opportunity-detail-drawer.tsx`

#### C. Pantalla: Leads
- **UI:** Tabla con filtros (estado, fuente, vendedor)
- **Datos:** `Lead`
- **Acciones:**
  - Crear lead (modal)
  - Editar
  - Convertir a cliente (llama a `/api/crm/leads/[id]/convert`)
  - Asignar vendedor
  - Ver actividades del lead
- **Componentes nuevos:**
  - `app/(dashboard)/crm/leads/page.tsx`
  - `components/crm/lead-form.tsx`
  - `components/crm/lead-table.tsx`
  - `components/crm/convert-lead-modal.tsx`

#### D. Modificación: Cotizador (Quote)
- Agregar campo "Vendedor" en el formulario de cotización (`Quote.assigned_to`)
- Agregar botón "Crear oportunidad" en cotizaciones enviadas
- En listado de cotizaciones: filtro por vendedor (solo admins ven todas)
- **Archivos a tocar:**
  - `components/quoter/quote-form.tsx` o similar
  - `app/quoter/quotes/page.tsx` (listado)

### 4.2 Fase 2

#### E. Pantalla: Actividades
- **UI:** Timeline + Calendario (vista semanal)
- **Datos:** `Activity`
- **Acciones:**
  - Agendar llamada/reunión
  - Registrar llamada ya hecha
  - Completar tarea
  - Snooze / reagendar
- **Componentes nuevos:**
  - `app/(dashboard)/crm/activities/page.tsx`
  - `components/crm/activity-timeline.tsx`
  - `components/crm/activity-form.tsx`
  - `components/crm/activity-reminder.tsx`

#### F. Pantalla: Dashboard Comercial
- **UI:** Cards de KPIs + gráficos
- **Métricas a mostrar:**
  1. **Pipeline value:** Suma de `estimated_value × probability` de oportunidades abiertas
  2. **Ventas del mes:** Suma de `actual_value` donde `closed_at` está en este mes y `stage = closed_won`
  3. **Tasa de conversión:** `closed_won / (closed_won + closed_lost)` del período
  4. **Promedio de ciclo:** `AVG(closed_at - created_at)` de oportunidades cerradas
  5. **Top vendedores:** Ranking por `actual_value`
  6. **Oportunidades vencidas:** `expected_close_date < hoy` y aún abiertas
- **Gráficos:**
  - Embudo (cantidad y valor por etapa)
  - Ventas por mes (línea temporal)
  - Progreso vs. meta (si se agregan metas después)
- **Componentes nuevos:**
  - `app/(dashboard)/crm/dashboard/page.tsx`
  - `components/crm/sales-kpi-cards.tsx`
  - `components/crm/pipeline-funnel-chart.tsx`
  - `components/crm/sales-chart.tsx`

#### G. Modificación: Ficha de Cliente
- Agregar pestaña "Historial comercial" con:
  - Timeline de actividades
  - Oportunidades asociadas
  - Cotizaciones enviadas
  - Valor total histórico (`total_spent`)
- **Archivos a tocar:**
  - Dondequiera que esté la ficha de cliente (`app/clients/[id]/page.tsx` o similar)

---

## 5. FLUJO DE TRABAJO (User Journey)

### Flujo 1: Lead nuevo → Venta cerrada
```
1. Vendedor crea Lead (teléfono que sonó, referido, etc.)
   → POST /api/crm/leads

2. Vendedor agenda llamada de seguimiento
   → POST /api/crm/activities { type: call, scheduled_at: "mañana 10am" }

3. Después de la llamada, califica el lead
   → PATCH /api/crm/leads/[id] { status: qualified }

4. El lead tiene potencial → crear Oportunidad
   → POST /api/crm/opportunities { lead_id, title: "...", estimated_value: 50000 }
   → Oportunidad aparece en pipeline en "Prospección"

5. Se envía cotización
   → Se crea Quote normal
   → Se vincula a la oportunidad: PATCH /api/crm/opportunities/[id] { quote_id }
   → Oportunidad se mueve a "Cotización enviada"

6. El cliente negocia
   → Vendedor registra actividad: POST /api/crm/activities { type: meeting }
   → Oportunidad se mueve a "Negociación"

7. Cliente aprueba
   → POST /api/crm/opportunities/[id]/close { result: won }
   → Se crea Project automáticamente desde Quote (ya existe esta lógica)
   → Quote pasa a `approved` (ya existe)
   → Cliente.total_spent se actualiza

8. Post-venta (futuro)
   → Encuesta de satisfacción
   → Recordatorio de recompra / mantenimiento
```

### Flujo 2: Cliente existente quiere algo nuevo
```
1. Vendedor busca Cliente en el sistema
2. Crea Oportunidad directamente con client_id (sin pasar por Lead)
3. Resto igual que el flujo 1 desde el paso 4
```

---

## 6. MIGRACIÓN DE DATOS EXISTENTES

No hay que migrar datos masivos complejos, pero sí inicializar:

```sql
-- 1. Crear etapas por defecto del pipeline
INSERT INTO opportunity_stage_configs (name, stage_key, probability, "order", color)
VALUES
  ('Prospección', 'prospecting', 10, 1, '#6b7280'),
  ('Reunión', 'meeting', 25, 2, '#3b82f6'),
  ('Cotización enviada', 'proposal_sent', 50, 3, '#f59e0b'),
  ('Negociación', 'negotiation', 75, 4, '#8b5cf6'),
  ('Cerrada ganada', 'closed_won', 100, 5, '#10b981'),
  ('Cerrada perdida', 'closed_lost', 0, 6, '#ef4444');

-- 2. Asignar vendedor a cotizaciones existentes (si hay UserRole.vendedor)
-- Se puede dejar en NULL y que el admin lo asigne después

-- 3. Calcular LTV inicial de clientes existentes
UPDATE clients
SET 
  total_spent = (SELECT COALESCE(SUM(final_price), 0) FROM budgets WHERE budgets.client_id = clients.id),
  project_count = (SELECT COUNT(*) FROM projects WHERE projects.client_id = clients.id);
```

---

## 7. PERMISOS Y ROLES

| Funcionalidad | Admin | Supervisor | Vendedor | Operario |
|---------------|-------|------------|----------|----------|
| Ver pipeline completo | ✅ | ✅ | Solo sus oportunidades | ❌ |
| Crear/editar oportunidades | ✅ | ✅ | Solo las suyas | ❌ |
| Ver leads | ✅ | ✅ | Solo los suyos | ❌ |
| Asignar vendedor | ✅ | ❌ | ❌ | ❌ |
| Configurar etapas | ✅ | ❌ | ❌ | ❌ |
| Dashboard comercial | ✅ | ✅ (solo su área) | Solo sus números | ❌ |
| Ver actividades | ✅ | ✅ | Solo las suyas | ❌ |

**Nota:** Revisar middleware actual (`lib/api-auth.ts` o similar) para agregar guardas de ruta.

---

## 8. ESTIMACIÓN DE ESFUERZO

### Fase 1: Pipeline + Vendedor

| Tarea | Días estimados |
|-------|----------------|
| Schema Prisma + migración DB | 0.5 |
| Seed de etapas por defecto | 0.25 |
| APIs: Leads CRUD + convert | 1 |
| APIs: Opportunities CRUD + close | 1 |
| APIs: Stages config | 0.5 |
| APIs: Asignar vendedor a Quote | 0.5 |
| UI: Pipeline Kanban | 1.5 |
| UI: Lead list + form + convert modal | 1.5 |
| UI: Modificar Quote form (vendedor) | 0.5 |
| Testing + ajustes | 1 |
| **TOTAL FASE 1** | **~8 días** |

### Fase 2: Actividades + Dashboard

| Tarea | Días estimados |
|-------|----------------|
| API: Activities CRUD + filtros | 1 |
| API: Dashboard endpoints (KPIs) | 1.5 |
| UI: Actividades (timeline + calendario) | 1.5 |
| UI: Dashboard comercial (KPIs + gráficos) | 2 |
| UI: Modificar ficha de cliente (tab comercial) | 0.5 |
| Notificaciones / recordatorios (simple: badge + email) | 1 |
| Testing + ajustes | 1 |
| **TOTAL FASE 2** | **~8.5 días** |

### Ambas fases juntas: ~16 días de desarrollo

---

## 9. DECISIONES TÉCNICAS PENDIENTES

Antes de empezar, definir:

1. **¿Se usa un library de Kanban drag-and-drop?**
   - Recomendado: `@hello-pangea/dnd` (fork activo de react-beautiful-dnd)
   - Alternativa: Columnas estáticas con select de etapa (más rápido, menos fancy)

2. **¿Gráficos con qué library?**
   - Recomendado: `recharts` (ya usás React, es ligero)
   - Alternativa: `chart.js` con `react-chartjs-2`

3. **¿Recordatorios de actividades cómo se notifican?**
   - Opción A: Simple — badge en UI + email con cron job (Supabase edge function o cron de Vercel)
   - Opción B: Real-time — WebSockets o Server-Sent Events (más trabajo)
   - **Recomendación:** Opción A para empezar.

4. **¿Metas de vendedor?**
   - Incluir en Fase 2 o dejar para Fase 3?
   - Recomendación: Dejar para Fase 3. Primero medir, luego poner metas.

---

## 10. PRÓXIMOS PASOS INMEDIATOS

Si el dueño da el OK:

1. **Aprobación del schema** — revisar juntos si las etapas del pipeline son las correctas para su negocio
2. **Crear migración Prisma** — `npx prisma migrate dev --name add_crm_core`
3. **Seed de etapas** — correr script SQL
4. **Desarrollar Fase 1** — empezar por el pipeline Kanban (es lo que más impacto visual tiene para el dueño)
5. **Demo intermedia** — mostrar pipeline funcionando antes de seguir con Fase 2

---

*Documento generado para estimación. Ajustar según decisiones de negocio.*
