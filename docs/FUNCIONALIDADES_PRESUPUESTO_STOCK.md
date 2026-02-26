# Documento de Funcionalidades del Sistema
## ModularQ - Sistema de Gestión de Módulos Habitacionales

**Fecha:** Febrero 2026  
**Versión:** 1.0

---

## 📋 Índice

1. [Módulo Presupuestos](#módulo-presupuestos)
2. [Módulo Stock](#módulo-stock)
3. [Integraciones entre Módulos](#integraciones-entre-módulos)
4. [Permisos y Roles](#permisos-y-roles)
5. [Flujos de Trabajo](#flujos-de-trabajo)

---

## Módulo Presupuestos

### 1.1 Gestión de Presupuestos

#### 1.1.1 Listado de Presupuestos
- **Vista general:** Tablero con todos los presupuestos creados
- **Visualización por tarjetas:** Cada presupuesto muestra:
  - Código único (generado automáticamente)
  - Nombre del cliente
  - Ubicación del proyecto
  - Estado actual (colores diferenciados)
  - Monto final en pesos y dólares (con conversión automática)
  - Fecha de creación
- **Indicador de tipo de cambio:** Dólar BNA vendedor en tiempo real
- **Filtros implícitos:** Por estado (borrador, enviado, aprobado, rechazado)

#### 1.1.2 Creación de Nuevos Presupuestos
- **Modal de creación rápida:**
  - Nombre del cliente (obligatorio)
  - Ubicación del proyecto (obligatorio)
  - Descripción del módulo (opcional)
- **Generación automática:**
  - Código único del presupuesto
  - Fecha de creación
  - Estado inicial: "Borrador"
- **Redirección:** Al crear, redirige automáticamente al detalle del presupuesto

#### 1.1.3 Estados del Presupuesto
| Estado | Color | Descripción | Acciones disponibles |
|--------|-------|-------------|---------------------|
| Borrador | Gris | Presupuesto en edición | Editar, Enviar, Aprobar |
| Enviado | Azul | Presupuesto enviado al cliente | Aprobar, Rechazar |
| Aprobado | Verde | Presupuesto aceptado | Ver proyecto asociado |
| Rechazado | Rojo | Presupuesto rechazado | Reabrir como borrador |

---

### 1.2 Detalle de Presupuesto (Vista Principal)

#### 1.2.1 Estructura de Pestañas
La vista de detalle se organiza en 3 pestañas:

##### Pestaña 1: "Cómputo y Presupuesto"
**Header del Presupuesto:**
- Código del presupuesto con badge de estado
- Nombre del cliente y ubicación
- Botones de acción:
  - Volver al listado
  - Agregar ítem (solo en borrador)
  - Aprobar presupuesto
  - Ver proyecto asociado (si existe)

**Tarjetas de Totales:**
- Costos directos (materiales + mano de obra)
- Costos indirectos (con porcentaje configurable)
- Ganancia (con porcentaje configurable)
- Precio final calculado
- Todos los valores en pesos y su conversión a USD

**Tabla de Ítems del Presupuesto:**
- Código del ítem
- Cantidad (editable en línea)
- Descripción
- Unidad de medida
- Costo unitario total
- Costo total
- Indicadores de cambios pendientes
- Acciones: Editar análisis de precios, Eliminar

**Banner de Cambios Pendientes:**
- Aparece cuando hay cantidades modificadas sin guardar
- Botón "Guardar todo" para aplicar cambios en batch
- Botón "Descartar" para revertir cambios
- Advertencia al intentar salir con cambios sin guardar

##### Pestaña 2: "Resumen de Recursos"
**Consolidación de Materiales:**
- Lista de todos los materiales requeridos
- Cantidad total por material
- Unidad de medida
- Costo unitario
- Costo total estimado

**Consolidación de Mano de Obra:**
- Conceptos laborales utilizados
- Total de horas por concepto
- Costo por hora (editable)
- Costo total por concepto

**Consolidación de Equipos:**
- Equipos requeridos
- Horas de uso estimadas
- Costo por hora
- Costo total

##### Pestaña 3: "Presupuesto Cliente"
**Vista Profesional para el Cliente:**
- Encabezado con logo de ModulArq
- Datos de contacto de la empresa
- Datos del cliente y proyecto

**Importe del Presupuesto (Sin detalle de ítems):**
- Subtotal
- IVA 10.5% (tasa de construcción)
- Total final
- Monto expresado en letras

**Condiciones Comerciales (Editables):**
1. Validez de la oferta (días)
2. Moneda (Dólar oficial BNA)
3. Condiciones de pago
4. Fecha de entrega
5. Lugar de entrega
6. Notas adicionales

**Datos para Transferencia:**
- Razón social
- CUIT
- Banco y tipo de cuenta
- CBU y Alias

**Exportación a PDF:**
- Botón "Descargar PDF"
- Diseño profesional con logo
- Formato optimizado para impresión
- Incluye tabla detallada de ítems (solo en PDF, no en pantalla)

---

### 1.3 Gestión de Ítems del Presupuesto

#### 1.3.1 Agregar Ítems
- **Modal de selección:**
  - Búsqueda de plantillas de ítems predefinidos
  - Categorías: Estructura, Paneles, Herrajes, Aislación, Electricidad, Sanitarios, Otros
  - Vista previa de descripción y unidad
  - Cantidad editable antes de agregar
- **Creación desde plantilla:**
  - Hereda descripción, unidad y análisis de precios base
  - Genera código único para el ítem

#### 1.3.2 Edición de Cantidades
- **Edición en línea:** Doble clic en cantidad para editar
- **Cambios locales:** Los cambios se mantienen localmente hasta guardar
- **Indicadores visuales:** Íconos que muestran ítems modificados
- **Guardado batch:** Guardar múltiples cambios en una sola operación

#### 1.3.3 Análisis de Precios
**Modal de Análisis Detallado:**

**Mano de Obra:**
- Lista de conceptos laborales predefinidos
- Cantidad de horas por concepto
- Tarifa por hora editable
- Subtotal por concepto
- Agregar/eliminar conceptos

**Materiales:**
- Selección desde stock existente
- Cantidad requerida
- Precio unitario (tomado del stock o editable)
- Subtotal por material
- **Creación de materiales nuevos:** Botón para crear material inexistente
- Agregar/eliminar materiales

**Equipos:**
- Nombre del equipo
- Cantidad de horas
- Costo por hora
- Subtotal por equipo

**Totales del Análisis:**
- Suma automática de costos
- Actualización en tiempo real del costo unitario del ítem

---

### 1.4 Cálculos y Fórmulas

#### 1.4.1 Estructura de Costos
```
Costo Directo = Suma(Costo Total de ítems)
Costo Indirecto = Costo Directo × (Porcentaje Indirecto / 100)
Subtotal = Costo Directo + Costo Indirecto
Ganancia = Subtotal × (Porcentaje Ganancia / 100)
Precio Final = Subtotal + Ganancia
```

#### 1.4.2 Conversión a Dólares
```
Valor USD = Valor en ARS / Tipo de Cambio
```
- Tipo de cambio: Dólar BNA vendedor
- Actualización en tiempo real desde API

#### 1.4.3 Porcentajes Configurables
- **Gastos indirectos:** Por defecto 15% (configurable por presupuesto)
- **Ganancia:** Por defecto 25% (configurable por presupuesto)
- **IVA:** 10.5% (tasa aplicable a construcción)

---

### 1.5 Flujo de Aprobación

#### 1.5.1 Desde Borrador
1. **Enviar:** Cambia estado a "Enviado"
2. **Aprobar:** 
   - Cambia estado a "Aprobado"
   - Opción de crear proyecto automáticamente
   - Genera enlace al proyecto

#### 1.5.2 Desde Enviado
- **Aprobar:** Cambia a estado aprobado
- **Rechazar:** Cambia a estado rechazado con opción de agregar nota

#### 1.5.3 Creación de Proyecto
Al aprobar, se puede:
- Crear proyecto automáticamente
- Vincular presupuesto con proyecto existente
- El presupuesto muestra enlace al proyecto creado

---

## Módulo Stock

### 2.1 Gestión de Materiales

#### 2.1.1 Listado de Materiales
**Vista Principal:**
- Tabla con todos los materiales
- Búsqueda en tiempo real (código, nombre, proveedor)
- Filtro por categoría
- Filtro "Solo stock bajo"

**Columnas de la Tabla:**
- Código único
- Nombre del material
- Categoría
- Stock actual / Stock mínimo (con indicador visual)
- Precio unitario
- Proveedor
- Acciones (editar/eliminar)

#### 2.1.2 Estadísticas de Stock
**Tarjetas de Resumen:**
- Total de materiales registrados
- Materiales con stock bajo (alerta visual)
- Valor total del inventario (suma de stock × precio unitario)
- Cantidad de categorías utilizadas

#### 2.1.3 Creación de Materiales
**Formulario de Material:**
- Código (generación automática por categoría o manual)
- Nombre del material
- Descripción (opcional)
- Categoría (selector desplegable):
  - Estructura
  - Paneles
  - Herrajes
  - Aislación
  - Electricidad
  - Sanitarios
  - Otros
- Unidad de medida:
  - Unidad
  - Metro
  - Metro cuadrado
  - Metro cúbico
  - Kilogramo
  - Litro
- Stock inicial
- Stock mínimo (para alertas)
- Precio unitario
- Proveedor (opcional)

**Generación Automática de Códigos:**
| Categoría | Prefijo | Ejemplo |
|-----------|---------|---------|
| Estructura | EST | EST-001 |
| Paneles | PAN | PAN-001 |
| Herrajes | HER | HER-001 |
| Aislación | AIS | AIS-001 |
| Electricidad | ELE | ELE-001 |
| Sanitarios | SAN | SAN-001 |
| Otros | OTR | OTR-001 |

#### 2.1.4 Edición de Materiales
- Edición inline o mediante modal
- Actualización de cualquier campo
- Histórico de cambios (actualización de timestamps)

#### 2.1.5 Eliminación de Materiales
- Eliminación lógica o física
- Validación de dependencias (no permite eliminar si está en uso)

---

### 2.2 Alertas de Stock

#### 2.2.1 Indicadores Visuales
- **Stock normal:** Indicador verde o neutro
- **Stock bajo:** Indicador rojo/alerta cuando `stock_actual <= stock_mínimo`
- **Sin stock:** Indicador especial

#### 2.2.2 Filtro de Stock Bajo
- Botón para filtrar solo materiales que necesitan reposición
- Contador en la tarjeta de estadísticas

---

## Integraciones entre Módulos

### 3.1 Presupuesto → Stock

#### 3.1.1 Uso de Materiales en Análisis de Precios
- Al crear análisis de precios, se pueden seleccionar materiales del stock
- Precio unitario se sugiere desde el stock pero es editable
- Si el material no existe, se puede crear desde el modal de análisis

#### 3.1.2 Consolidación de Recursos
- La pestaña "Resumen de Recursos" suma todos los materiales de todos los ítems
- Evita duplicados sumando cantidades del mismo material

### 3.2 Presupuesto → Proyectos

#### 3.2.1 Creación de Proyecto desde Presupuesto
- Al aprobar presupuesto, opción de crear proyecto automáticamente
- Los datos del cliente se transfieren al proyecto
- El presupuesto queda vinculado al proyecto

#### 3.2.2 Navegación Bidireccional
- Desde presupuesto se puede navegar al proyecto
- Desde proyecto se puede ver el presupuesto origen

---

## Permisos y Roles

### 4.1 Roles del Sistema

#### 4.1.1 Administrador
- Acceso completo a todos los módulos
- Crear, editar, eliminar presupuestos
- Crear, editar, eliminar materiales
- Aprobar presupuestos
- Ver todos los proyectos

#### 4.1.2 Supervisor
- **Presupuestos:** Solo lectura
- **Stock:** Solo lectura (puede ver pero no editar materiales)
- **Proyectos:** Acceso según asignación

### 4.2 Matriz de Permisos

| Funcionalidad | Administrador | Supervisor |
|--------------|---------------|------------|
| Ver presupuestos | ✅ | ✅ |
| Crear presupuestos | ✅ | ❌ |
| Editar presupuestos | ✅ | ❌ |
| Aprobar presupuestos | ✅ | ❌ |
| Ver stock | ✅ | ✅ |
| Crear materiales | ✅ | ❌ |
| Editar materiales | ✅ | ❌ |
| Eliminar materiales | ✅ | ❌ |

---

## Flujos de Trabajo

### 5.1 Flujo Completo de Presupuesto

```
1. Crear Presupuesto
   ↓
2. Agregar Ítems desde Plantillas
   ↓
3. Completar Análisis de Precios de cada Ítem
   ↓
4. Revisar Cálculos y Porcentajes
   ↓
5. Editar Condiciones Comerciales (vista cliente)
   ↓
6. Generar PDF para Cliente
   ↓
7. Enviar a Cliente (cambiar estado)
   ↓
8. [Cliente aprueba] → Aprobar Presupuesto → Crear Proyecto
   ↓
9. [Cliente rechaza] → Modificar → Volver a enviar
```

### 5.2 Flujo de Stock

```
1. Registrar Materiales en Stock
   ↓
2. Definir Stock Mínimo para alertas
   ↓
3. Revisar Alertas de Stock Bajo
   ↓
4. Reponer Inventario
   ↓
5. Actualizar Cantidades
   ↓
6. Materiales disponibles para Análisis de Precios
```

---

## Archivos y Componentes Clave

### Componentes de Presupuesto
| Componente | Descripción |
|------------|-------------|
| `BudgetHeader.tsx` | Encabezado con acciones principales |
| `BudgetTotalsCards.tsx` | Tarjetas de totales en ARS y USD |
| `BudgetItemsTable.tsx` | Tabla editable de ítems |
| `PendingChangesBanner.tsx` | Banner de cambios sin guardar |
| `BudgetResourceSummary.tsx` | Consolidación de recursos |
| `BudgetClientView.tsx` | Vista profesional para cliente |
| `BudgetPDFDocument.tsx` | Generador de PDF |
| `BudgetPDFDownload.tsx` | Botón de descarga con lazy loading |
| `AddItemDialog.tsx` | Modal para agregar ítems |
| `PriceAnalysisDialog.tsx` | Análisis detallado de precios |
| `CreateBudgetDialog.tsx` | Creación de nuevo presupuesto |
| `ModuleDescriptionEditor.tsx` | Editor de descripción del módulo |

### Componentes de Stock
| Componente | Descripción |
|------------|-------------|
| `stock-management.tsx` | Componente principal de stock |
| `material-stats.tsx` | Tarjetas de estadísticas |
| `material-table.tsx` | Tabla de materiales |
| `material-filters.tsx` | Filtros de búsqueda |
| `material-row.tsx` | Fila editable de material |
| `material-form.tsx` | Formulario de creación/edición |

### Hooks Personalizados
| Hook | Descripción |
|------|-------------|
| `useBudget.ts` | Gestión de estado del presupuesto |
| `use-materials-prisma.ts` | Gestión de materiales con Prisma |

### Servicios
| Servicio | Descripción |
|----------|-------------|
| `prisma-typed-service.ts` | Servicio unificado de base de datos |
| `exchange-rate.ts` | Obtención de tipo de cambio |

---

## Notas Técnicas

### Tecnologías Utilizadas
- **Framework:** Next.js 14+ con TypeScript
- **Base de Datos:** PostgreSQL via Supabase
- **ORM:** Prisma
- **UI:** shadcn/ui components
- **PDF:** @react-pdf/renderer
- **Estado:** React Hooks (useState, useEffect, useMemo)

### Convenciones
- Cálculos siempre en ARS, conversión a USD para visualización
- Tipo de cambio: Dólar BNA vendedor
- IVA aplicable: 10.5% (construcción)
- Formato de moneda: Locale es-AR

---

**Documento generado para ModularQ**  
*Sistema de Gestión de Módulos Habitacionales*
