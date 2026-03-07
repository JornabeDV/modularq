# 📊 Análisis de Métricas para Analytics - ModulArq

**Fecha:** 27 de Febrero de 2026  
**Proyecto:** ModulArq - Sistema de Gestión de Operarios Industriales  
**Propósito:** Identificar métricas de analytics que brinden información valiosa para la toma de decisiones de los dueños de la empresa

---

## 🏭 Resumen del Proyecto

### Descripción
ModulArq es una aplicación web moderna para la gestión integral de operarios industriales, proyectos y tareas. Está diseñada para optimizar la productividad y el seguimiento en entornos de producción, específicamente orientada a la construcción de módulos industriales/prefabricados.

### Módulos Principales

| Módulo | Descripción | Datos Clave |
|--------|-------------|-------------|
| **Proyectos** | Gestión de proyectos de construcción con tareas, operarios y seguimiento | Estado, progreso, fechas, cliente asignado, especificaciones técnicas |
| **Presupuestos** | Sistema completo de cotizaciones con análisis de precios | Estado, montos, ítems, gastos, beneficios, tasas de cambio |
| **Stock** | Inventario de materiales con alertas de stock mínimo | Cantidades, precios, categorías, proveedores |
| **Clientes** | CRM básico con contactos | CUIT, datos de contacto, proyectos asociados |
| **Tareas** | Asignación y seguimiento de tareas a operarios | Estado, horas estimadas vs reales, asignaciones |
| **Operarios** | Gestión de personal (operarios, subcontratistas, supervisores) | Rol, eficiencia, horas totales |
| **Reportes** | Proyectos completados y análisis históricos | Histórico de métricas |

### Stack Tecnológico
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts
- **UI:** shadcn/ui, Radix UI, Framer Motion
- **Backend:** Prisma ORM, PostgreSQL
- **Analytics:** @vercel/analytics (básico)

---

## 📦 Datos Actualmente Disponibles

### Modelos de Datos Relevantes

```
User (Operarios)
├── role: admin | supervisor | operario | subcontratista
├── total_hours: Float
├── efficiency: Float
└── Relaciones: supervised_projects, assigned_tasks, time_entries

Project
├── status: planning | active | paused | completed | delivered
├── priority: low | medium | high | critical
├── condition: alquiler | venta
├── start_date, end_date
├── progress: Float
├── modulation, height, width, depth, module_count
└── Relaciones: client, project_operarios, project_tasks, time_entries

ProjectTask
├── status: pending | in_progress | completed | cancelled
├── estimated_hours, actual_hours
├── assigned_to, started_by, completed_by
├── start_date, end_date, assigned_at
└── Relaciones: project, task, assigned_user

TimeEntry
├── user_id, task_id, project_id
├── start_time, end_time, hours
├── description, date

Budget
├── status: draft | sent | approved | rejected
├── client_name, location
├── created_at, sent_at, approved_at, rejected_at
├── financial_expenses_pct, general_expenses_pct
├── benefit_pct, iva_pct, gross_income_pct
├── subtotal_direct_costs, subtotal_with_expenses
├── subtotal_with_benefit, calculated_price, final_price
├── exchange_rate, exchange_rate_date
└── Relaciones: items, attachments

BudgetItem
├── quantity, unit_cost_labor, unit_cost_materials
├── unit_cost_equipment, unit_cost_total, total_cost
└── Relaciones: price_analysis

Material
├── category: estructura | paneles | herrajes | aislacion | electricidad | sanitarios | otros
├── stock_quantity, min_stock, unit_price
└── Relaciones: project_materials

AuditLog
├── user_id, action, entity_type, entity_id
├── changes, ip_address, created_at

Report
├── type: productivity | time_tracking | project_status | operario_performance
├── generated_by, parameters, data, created_at
```

---

## 🎯 Métricas Recomendadas

Organizadas por **valor para el negocio** y **facilidad de implementación**.

---

### 💰 1. MÉTRICAS FINANCIERAS

*Mayor valor estratégico para los dueños - Prioridad Alta*

#### 1.1 Tasa de Conversión de Presupuestos
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Porcentaje de presupuestos aprobados respecto al total enviados |
| **Fórmula** | `(Presupuestos Aprobados / Presupuestos Enviados) × 100` |
| **Fuentes** | Tabla `Budget` (campo `status`) |
| **Frecuencia** | Mensual, Trimestral, Anual |
| **Valor** | Indica la competitividad de precios y calidad de propuestas |

#### 1.2 Tiempo Promedio de Conversión
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Días promedio desde que se envía un presupuesto hasta su aprobación o rechazo |
| **Fórmula** | `AVG(approved_at - sent_at)` para aprobados, `AVG(rejected_at - sent_at)` para rechazados |
| **Fuentes** | Tabla `Budget` (campos `sent_at`, `approved_at`, `rejected_at`) |
| **Frecuencia** | Mensual |
| **Valor** | Permite optimizar el ciclo de ventas y hacer seguimiento oportuno |

#### 1.3 Ticket Promedio
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Monto promedio de presupuestos aprobados |
| **Fórmula** | `AVG(final_price) WHERE status = 'approved'` |
| **Fuentes** | Tabla `Budget` (campo `final_price`) |
| **Frecuencia** | Mensual, Acumulado anual |
| **Valor** | Proyecciones de ingresos y análisis de segmentos de mercado |

#### 1.4 Pipeline de Ventas
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Valor total de presupuestos agrupados por estado |
| **Fórmula** | `SUM(final_price) GROUP BY status` |
| **Fuentes** | Tabla `Budget` (campos `final_price`, `status`) |
| **Frecuencia** | Semanal, Mensual |
| **Valor** | Visión del flujo de caja proyectado y funnel de ventas |

#### 1.5 Margen por Proyecto
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Comparación entre costos reales y precio presupuestado |
| **Fórmula** | `((Presupuesto Final - Costos Reales) / Presupuesto Final) × 100` |
| **Fuentes** | `Budget.final_price` vs `TimeEntry.hours × LaborConcept.hourly_rate` + `ProjectMaterial` |
| **Frecuencia** | Por proyecto, Mensual |
| **Valor** | Rentabilidad real de cada proyecto ejecutado |

#### 1.6 Distribución de Costos (Materiales vs Mano de Obra)
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Proporción entre costos de materiales y mano de obra en proyectos completados |
| **Fórmula** | `SUM(materiales) / SUM(total)` y `SUM(mano_obra) / SUM(total)` |
| **Fuentes** | `BudgetItem.unit_cost_materials`, `BudgetItem.unit_cost_labor` |
| **Frecuencia** | Por proyecto, Acumulado |
| **Valor** | Estructura de costos para futuras estimaciones |

---

### ⚡ 2. MÉTRICAS DE PRODUCTIVIDAD

*Valor operativo alto - Mejora de procesos internos*

#### 2.1 Eficiencia de Operarios
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Ratio entre horas reales trabajadas y horas estimadas |
| **Fórmula** | `(Horas Estimadas / Horas Reales) × 100` (>100% = más eficiente) |
| **Fuentes** | `ProjectTask.estimated_hours` vs `ProjectTask.actual_hours` |
| **Frecuencia** | Semanal, Mensual, Por proyecto |
| **Valor** | Identificar operarios más/menos eficientes, ajustar estimaciones |

#### 2.2 Tiempo de Ciclo de Tareas
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Tiempo promedio desde que una tarea se inicia hasta que se completa |
| **Fórmula** | `AVG(completed_at - started_at)` |
| **Fuentes** | `ProjectTask.started_at`, `ProjectTask.completed_at` |
| **Frecuencia** | Semanal, Mensual |
| **Valor** | Optimizar estimaciones futuras y detectar tareas problemáticas |

#### 2.3 Tasa de Cumplimiento de Plazos
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Porcentaje de proyectos entregados en la fecha comprometida |
| **Fórmula** | `(Proyectos a tiempo / Total proyectos completados) × 100` |
| **Fuentes** | `Project.end_date` vs fecha real de entrega (status `delivered`) |
| **Frecuencia** | Mensual, Trimestral |
| **Valor** | Indicador clave de satisfacción del cliente |

#### 2.4 Horas Trabajadas por Período
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Total de horas registradas por operario/subcontratista |
| **Fórmula** | `SUM(hours) FROM TimeEntry GROUP BY user_id, período` |
| **Fuentes** | Tabla `TimeEntry` |
| **Frecuencia** | Semanal, Mensual |
| **Valor** | Control de capacidad productiva y planificación de recursos |

#### 2.5 Carga de Trabajo por Operario
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Número de tareas activas asignadas por operario |
| **Fórmula** | `COUNT(ProjectTask) WHERE assigned_to = user_id AND status IN ('pending', 'in_progress')` |
| **Fuentes** | `ProjectTask` |
| **Frecuencia** | Diaria, Semanal |
| **Valor** | Balanceo de recursos y prevención de sobrecarga |

#### 2.6 Productividad por Categoría de Tarea
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Eficiencia agrupada por tipo de trabajo (estructura, electricidad, etc.) |
| **Fórmula** | `AVG(estimated_hours / actual_hours) GROUP BY Task.category` |
| **Fuentes** | `Task.category`, `ProjectTask` |
| **Frecuencia** | Mensual |
| **Valor** | Identificar qué tipos de trabajo son más predecibles |

---

### 📈 3. MÉTRICAS DE PROYECTOS

*Seguimiento operativo - Parcialmente implementadas*

#### 3.1 Tiempo en Cada Estado
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Cuánto tiempo permanece un proyecto en cada estado (planning, active, paused) |
| **Fórmula** | Tracking de transiciones de estado (requiere tabla de histórico o cálculo de diferencias) |
| **Fuentes** | `Project.status` con `AuditLog` para tracking de cambios |
| **Frecuencia** | Por proyecto, Promedios mensuales |
| **Valor** | Identificar cuellos de botella en el proceso |

#### 3.2 Proyectos Retrasados
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Proyectos activos con fecha de fin vencida |
| **Fórmula** | `COUNT(Project) WHERE status = 'active' AND end_date < NOW()` |
| **Fuentes** | `Project.status`, `Project.end_date` |
| **Frecuencia** | Diaria |
| **Valor** | Alertas tempranas de problemas de ejecución |

#### 3.3 Tasa de Completitud de Tareas
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Porcentaje de tareas completadas respecto al total |
| **Fórmula** | `(Tasks Completadas / Total Tasks) × 100` |
| **Fuentes** | `ProjectTask.status` |
| **Frecuencia** | Semanal, Por proyecto |
| **Valor** | Predicción de finalización de proyectos |

#### 3.4 Velocidad de Proyecto
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Tasa de progreso semanal (% de avance por semana) |
| **Fórmula** | `Δprogress / Δsemanas` |
| **Fuentes** | `Project.progress` con tracking temporal |
| **Frecuencia** | Semanal |
| **Valor** | Estimaciones de fecha de finalización |

#### 3.5 Proyectos por Condición (Alquiler vs Venta)
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Distribución de proyectos según su condición comercial |
| **Fórmula** | `COUNT(*) GROUP BY condition` |
| **Fuentes** | `Project.condition` |
| **Frecuencia** | Mensual, Trimestral |
| **Valor** | Análisis de modelo de negocio predominante |

---

### 👥 4. MÉTRICAS DE CLIENTES

*Valor comercial - Retención y crecimiento*

#### 4.1 Lifetime Value (LTV) por Cliente
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Valor total generado por cada cliente en todos sus proyectos |
| **Fórmula** | `SUM(Budget.final_price) WHERE status = 'approved' GROUP BY client_id` |
| **Fuentes** | `Budget` relacionado con `Client` |
| **Frecuencia** | Actualizado en tiempo real, reportes trimestrales |
| **Valor** | Identificar clientes VIP y enfocar atención |

#### 4.2 Tasa de Recurrencia
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Porcentaje de clientes que realizan 2 o más proyectos |
| **Fórmula** | `(Clientes con 2+ proyectos / Total clientes con proyectos) × 100` |
| **Fuentes** | `Client` + `Project` |
| **Frecuencia** | Semestral, Anual |
| **Valor** | Indicador de fidelización y calidad de servicio |

#### 4.3 Tiempo entre Proyectos
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Promedio de días desde la entrega de un proyecto hasta el nuevo presupuesto |
| **Fórmula** | `AVG(fecha_nuevo_presupuesto - fecha_entrega_proyecto_anterior)` |
| **Fuentes** | `Project` (fecha entrega) + `Budget` (fecha creación) |
| **Frecuencia** | Trimestral |
| **Valor** | Ciclo de recompra y oportunidades de cross-selling |

#### 4.4 Concentración de Clientes
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Distribución del valor total por cliente (Ley de Pareto) |
| **Fórmula** | Top 20% de clientes que generan el 80% de ingresos |
| **Fuentes** | `Budget` + `Client` |
| **Frecuencia** | Semestral |
| **Valor** | Riesgo de concentración y planificación de diversificación |

#### 4.5 Tasa de Respuesta a Presupuestos
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Qué tan rápido responden los clientes a los presupuestos enviados |
| **Fórmula** | `AVG(first_response_time)` desde envío |
| **Fuentes** | `Budget` (requiere tracking de respuestas) |
| **Frecuencia** | Mensual |
| **Valor** | Calidad de leads y priorización de seguimientos |

---

### 📦 5. MÉTRICAS DE STOCK Y MATERIALES

*Valor operativo - Optimización de inventario*

#### 5.1 Rotación de Stock
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Qué tan rápido se consumen los materiales del inventario |
| **Fórmula** | `Costo de Materiales Usados / Stock Promedio` |
| **Fuentes** | `Material.stock_quantity`, `ProjectMaterial` |
| **Frecuencia** | Mensual |
| **Valor** | Optimización de niveles de inventario |

#### 5.2 Materiales con Alerta de Stock
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Cantidad de materiales bajo el stock mínimo |
| **Fórmula** | `COUNT(Material) WHERE stock_quantity < min_stock` |
| **Fuentes** | `Material.stock_quantity`, `Material.min_stock` |
| **Frecuencia** | Diaria |
| **Valor** | Alertas para compras proactivas |

#### 5.3 Costo de Materiales por Proyecto
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Evolución del costo de materiales asignados a proyectos |
| **Fórmula** | `SUM(quantity × unit_price) FROM ProjectMaterial GROUP BY project_id` |
| **Fuentes** | `ProjectMaterial` |
| **Frecuencia** | Por proyecto, Mensual acumulado |
| **Valor** | Control de inflación y variaciones de costos |

#### 5.4 Materiales Más Utilizados
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Ranking de materiales por frecuencia de uso |
| **Fórmula** | `COUNT(*) o SUM(quantity) FROM ProjectMaterial GROUP BY material_id` |
| **Fuentes** | `ProjectMaterial` |
| **Frecuencia** | Trimestral |
| **Valor** | Planificación de compras y negociación con proveedores |

---

### 🔒 6. MÉTRICAS DE SISTEMA Y AUDITORÍA

*Valor de control y seguridad*

#### 6.1 Actividad del Sistema
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Número de acciones por tipo de entidad y período |
| **Fórmula** | `COUNT(*) FROM AuditLog GROUP BY entity_type, DATE(created_at)` |
| **Fuentes** | `AuditLog` |
| **Frecuencia** | Diaria, Semanal |
| **Valor** | Adopción del sistema y detección de anomalías |

#### 6.2 Usuarios Activos
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Distribución de usuarios por rol y actividad |
| **Fórmula** | `COUNT(*) FROM User WHERE deleted_at IS NULL GROUP BY role` |
| **Fuentes** | `User` |
| **Frecuencia** | Mensual |
| **Valor** | Gestión de licencias y recursos humanos |

#### 6.3 Tiempo de Respuesta del Sistema
| Aspecto | Detalle |
|---------|---------|
| **Definición** | Performance de carga de páginas y APIs |
| **Fórmula** | `AVG(response_time) FROM API calls` |
| **Fuentes** | Logs de Vercel o herramienta de monitoring |
| **Frecuencia** | Continua |
| **Valor** | Experiencia de usuario y optimización técnica |

---

## 🏗️ Arquitectura de Implementación

### Opciones de Implementación

#### Opción A: Expandir Dashboard de Analytics Existente
**Ubicación:** `/app/analytics/page.tsx`

**Ventajas:**
- Consistente con la implementación actual
- Un solo lugar para todas las métricas
- Fácil de mantener

**Desventajas:**
- Puede volverse muy cargado
- Pérdida de contexto de cada módulo

**Recomendado para:** Métricas globales y KPIs ejecutivos

---

#### Opción B: Analytics Integrado por Módulo
**Ubicaciones:**
- `/admin/budgets/analytics`
- `/admin/projects/analytics`
- `/admin/stock/analytics`
- `/admin/users/analytics`

**Ventajas:**
- Contexto inmediato al usar cada módulo
- Más granular y accionable
- Permite permisos diferenciados

**Desventajas:**
- Más archivos y componentes
- Posible duplicación de código

**Recomendado para:** Métricas operativas específicas

---

#### Opción C: Reportes Automatizados
**Implementación:** Generación de PDFs/Excel periódicos

**Ventajas:**
- Entrega automática a stakeholders
- Formato portable y archivable
- No requiere acceso al sistema

**Desventajas:**
- No es en tiempo real
- Requiere sistema de envío (email)

**Recomendado para:** Reportes ejecutivos y compliance

---

### Arquitectura Sugerida (Híbrida)

```
📊 Analytics Global (/analytics)
├── Dashboard Ejecutivo
│   ├── KPIs Financieros
│   ├── Estado de Proyectos
│   └── Tendencias Temporales
│
📈 Analytics por Módulo
├── Presupuestos (/admin/budgets/analytics)
│   ├── Pipeline de Ventas
│   ├── Tasas de Conversión
│   └── Comparativos de Montos
│
├── Proyectos (/admin/projects/analytics)
│   ├── Productividad
│   ├── Cumplimiento de Plazos
│   └── Distribución de Recursos
│
├── Stock (/admin/stock/analytics)
│   ├── Rotación de Inventario
│   ├── Alertas de Stock
│   └── Costos de Materiales
│
└── Personal (/admin/users/analytics)
    ├── Eficiencia por Operario
    ├── Carga de Trabajo
    └── Horas Trabajadas
```

---

## 📋 Plan de Implementación Priorizado

### Fase 1: Métricas Financieras (Alta Prioridad)
**Justificación:** Datos completos disponibles, alto impacto en decisiones de negocio

| # | Métrica | Complejidad | Tiempo Est. | Valor |
|---|---------|-------------|-------------|-------|
| 1.1 | Tasa de Conversión de Presupuestos | ⭐ Fácil | 2-3 horas | ⭐⭐⭐⭐⭐ |
| 1.2 | Pipeline de Ventas | ⭐ Fácil | 2 horas | ⭐⭐⭐⭐⭐ |
| 1.3 | Tiempo Promedio de Conversión | ⭐ Fácil | 2-3 horas | ⭐⭐⭐⭐ |
| 1.4 | Ticket Promedio | ⭐ Fácil | 1-2 horas | ⭐⭐⭐⭐ |

**Total Fase 1:** ~1 día de desarrollo

---

### Fase 2: Métricas de Productividad (Alta Prioridad)
**Justificación:** Permite optimizar recursos y mejorar estimaciones

| # | Métrica | Complejidad | Tiempo Est. | Valor |
|---|---------|-------------|-------------|-------|
| 2.1 | Eficiencia de Operarios | ⭐ Fácil | 3-4 horas | ⭐⭐⭐⭐⭐ |
| 2.2 | Horas Trabajadas por Período | ⭐ Fácil | 2 horas | ⭐⭐⭐⭐ |
| 2.3 | Tasa de Cumplimiento de Plazos | ⭐⭐ Media | 3-4 horas | ⭐⭐⭐⭐⭐ |
| 2.4 | Tiempo de Ciclo de Tareas | ⭐⭐ Media | 3-4 horas | ⭐⭐⭐⭐ |

**Total Fase 2:** ~1.5 días de desarrollo

---

### Fase 3: Métricas de Proyectos (Media Prioridad)
**Justificación:** Seguimiento operativo diario

| # | Métrica | Complejidad | Tiempo Est. | Valor |
|---|---------|-------------|-------------|-------|
| 3.1 | Proyectos Retrasados | ⭐ Fácil | 1-2 horas | ⭐⭐⭐⭐⭐ |
| 3.2 | Tiempo en Cada Estado | ⭐⭐ Media | 4-6 horas | ⭐⭐⭐⭐ |
| 3.3 | Velocidad de Proyecto | ⭐⭐ Media | 3-4 horas | ⭐⭐⭐ |

**Total Fase 3:** ~1 día de desarrollo

---

### Fase 4: Métricas de Clientes (Media Prioridad)
**Justificación:** Estrategia comercial y retención

| # | Métrica | Complejidad | Tiempo Est. | Valor |
|---|---------|-------------|-------------|-------|
| 4.1 | LTV por Cliente | ⭐ Fácil | 2 horas | ⭐⭐⭐⭐ |
| 4.2 | Tasa de Recurrencia | ⭐⭐ Media | 3 horas | ⭐⭐⭐⭐ |
| 4.3 | Concentración de Clientes | ⭐⭐ Media | 3 horas | ⭐⭐⭐ |

**Total Fase 4:** ~1 día de desarrollo

---

### Fase 5: Métricas de Stock y Avanzadas (Baja Prioridad)
**Justificación:** Optimización continua

| # | Métrica | Complejidad | Tiempo Est. | Valor |
|---|---------|-------------|-------------|-------|
| 5.1 | Materiales con Alerta | ⭐ Fácil | 1 hora | ⭐⭐⭐ |
| 5.2 | Rotación de Stock | ⭐⭐ Media | 4 horas | ⭐⭐⭐ |
| 1.5 | Margen por Proyecto | ⭐⭐⭐ Alta | 6-8 horas | ⭐⭐⭐⭐⭐ |
| 1.6 | Distribución de Costos | ⭐⭐⭐ Alta | 4-6 horas | ⭐⭐⭐⭐ |

**Total Fase 5:** ~2 días de desarrollo

---

## 📐 Especificaciones Técnicas de Implementación

### Componentes Reutilizables Sugeridos

```typescript
// components/analytics/
├── cards/
│   ├── MetricCard.tsx          // Tarjeta de métrica simple (valor + delta)
│   ├── ProgressCard.tsx        // Tarjeta con barra de progreso
│   └── ComparisonCard.tsx      // Comparación A vs B
│
├── charts/
│   ├── LineChart.tsx           // Tendencias temporales
│   ├── BarChart.tsx            // Comparaciones categóricas
│   ├── PieChart.tsx            // Distribuciones
│   └── FunnelChart.tsx         // Pipeline de ventas
│
├── tables/
│   └── RankingsTable.tsx       // Tablas ordenadas (top operarios, etc.)
│
└── filters/
    ├── DateRangeFilter.tsx     // Selector de rango de fechas
    ├── StatusFilter.tsx        // Filtro por estado
    └── UserFilter.tsx          // Filtro por operario/supervisor
```

### Estructura de Datos para APIs

```typescript
// Tipos de respuesta sugeridos

interface MetricValue {
  value: number;
  previousValue?: number;
  change?: number;        // Porcentaje de cambio
  changeType?: 'increase' | 'decrease' | 'neutral';
  unit?: string;          // '%', 'hs', '$', etc.
}

interface TimeSeriesData {
  labels: string[];       // Fechas o períodos
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

interface RankingItem {
  rank: number;
  id: string;
  name: string;
  value: number;
  secondaryValue?: number;
  trend?: 'up' | 'down' | 'stable';
}
```

### Endpoints API Sugeridos

```typescript
// app/api/analytics/
├── financial/
│   ├── conversion-rate/route.ts
│   ├── pipeline/route.ts
│   └── avg-ticket/route.ts
│
├── productivity/
│   ├── efficiency/route.ts
│   ├── hours-by-period/route.ts
│   └── deadline-compliance/route.ts
│
├── projects/
│   ├── status-distribution/route.ts
│   ├── overdue/route.ts
│   └── velocity/route.ts
│
└── clients/
    ├── ltv/route.ts
    ├── recurrence/route.ts
    └── concentration/route.ts
```

---

## 🎨 Diseño de Dashboards

### Dashboard Ejecutivo (Vista General)

```
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD EJECUTIVO - Fecha: [Selector]                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Tasa Conv.   │  │ Pipeline     │  │ Ticket Prom. │      │
│  │   45% ↑12%   │  │  $2.4M       │  │  $180K       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Pipeline de Ventas     │  │  Proyectos por Estado   │  │
│  │  [Funnel Chart]         │  │  [Pie/Donut Chart]      │  │
│  │                         │  │                         │  │
│  │  Draft: $800K           │  │  Active: 12             │  │
│  │  Sent: $1.2M            │  │  Planning: 5            │  │
│  │  Approved: $400K        │  │  Completed: 8           │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tendencia de Ingresos (últimos 6 meses)            │   │
│  │  [Line Chart]                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard de Productividad

```
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTIVIDAD - Período: [Selector]                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Eficiencia General     │  │  Top Operarios          │  │
│  │  112% ↑5%               │  │  [Ranking Table]        │  │
│  │  [Gauge Chart]          │  │  1. Juan Pérez - 125%   │  │
│  │                         │  │  2. Ana López - 118%    │  │
│  │  Estimado: 2,400 hs     │  │  3. Carlos Ruiz - 110%  │  │
│  │  Real: 2,140 hs         │  │                         │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Horas Trabajadas por Semana                        │   │
│  │  [Stacked Bar Chart - por operario]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Cumplimiento Plazos    │  │  Proyectos Retrasados   │  │
│  │  78% ↓3%                │  │  3 proyectos            │  │
│  │  [Progress Ring]        │  │  [Alert List]           │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Recomendaciones de Implementación

### Buenas Prácticas

1. **Caché de Datos:** Las métricas no críticas pueden calcularse cada hora/día y cachearse
2. **Lazy Loading:** Cargar gráficos pesados solo cuando son visibles
3. **Exportación:** Permitir exportar todos los datos a Excel/CSV
4. **Comparativos:** Siempre mostrar comparación vs período anterior
5. **Drill-down:** Permitir hacer clic en métricas para ver detalles

### Consideraciones de Performance

- Usar índices en campos de fecha para agregaciones rápidas
- Considerar materialized views para métricas complejas
- Implementar paginación en rankings grandes
- Usar React Query o similar para caching en frontend

### Seguridad y Permisos

| Rol | Acceso a Analytics |
|-----|-------------------|
| **Admin** | Todas las métricas (financieras, operativas, de personal) |
| **Supervisor** | Métricas operativas de sus proyectos asignados, productividad de operarios |
| **Operario** | Solo sus propias métricas personales |
| **Subcontratista** | Métricas de sus tareas asignadas |

---

## 📊 Métricas Clave Recomendadas (Top 10)

Si el tiempo es limitado, estas son las **10 métricas más importantes** para empezar:

| # | Métrica | Módulo | Por qué es importante |
|---|---------|--------|----------------------|
| 1 | **Tasa de Conversión de Presupuestos** | Financiero | Indica salud del negocio |
| 2 | **Pipeline de Ventas** | Financiero | Proyección de ingresos |
| 3 | **Eficiencia de Operarios** | Productividad | Optimización de recursos |
| 4 | **Tasa de Cumplimiento de Plazos** | Proyectos | Satisfacción del cliente |
| 5 | **Proyectos Retrasados** | Proyectos | Alertas de problemas |
| 6 | **Ticket Promedio** | Financiero | Tamaño de oportunidades |
| 7 | **Horas Trabajadas por Período** | Productividad | Capacidad productiva |
| 8 | **LTV por Cliente** | Clientes | Foco en clientes valiosos |
| 9 | **Tiempo de Conversión** | Financiero | Velocidad de ventas |
| 10 | **Materiales bajo Stock** | Stock | Continuidad operativa |

---

## 📝 Conclusión

### Resumen de Valor

La implementación de un sistema de analytics completo en ModulArq proporcionará:

1. **Visibilidad Financiera:** Control total sobre el pipeline de ventas y conversión
2. **Optimización Operativa:** Identificación de cuellos de botella y operarios destacados
3. **Mejora en Planificación:** Estimaciones más precisas basadas en datos históricos
4. **Fidelización:** Comprensión profunda del comportamiento de clientes
5. **Toma de Decisiones:** Datos concretos para decisiones estratégicas

### Siguientes Pasos Recomendados

1. **Validar prioridades** con los dueños del negocio
2. **Definir fecha de inicio** para recolección de datos históricos
3. **Implementar Fase 1** (Métricas Financieras) como MVP
4. **Iterar** basándose en feedback de usuarios
5. **Expandir** a métricas operativas y avanzadas

---

**Documento preparado por:** Análisis de Sistema  
**Versión:** 1.0  
**Fecha:** 27/02/2026
