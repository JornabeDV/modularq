# RESUMEN DE MÓDULOS ENTREGADOS

**Sistema:** ModulArq  
**Fecha:** Julio 2026

---

## 1. OBJETIVO

Incorporar al sistema ModulArq cuatro nuevos módulos funcionales que amplían la gestión operativa, comercial y de recursos de la empresa:

1. **Módulo de Proveedores**  
   Centraliza la información de los proveedores con los que trabaja la empresa.

2. **Módulo de Gestión de Compra**  
   Digitaliza el proceso completo de compras, desde el pedido interno de materiales hasta la recepción física de mercadería.

3. **Módulo de Gestión de Alquileres**  
   Permite administrar los módulos físicos alquilados a clientes, sus contratos, entregas y devoluciones.

4. **Módulo de Histórico de Movimientos de Materiales**  
   Registra automáticamente cada entrada, salida y ajuste de stock, dando trazabilidad total de los materiales.

---

## 2. MÓDULO DE PROVEEDORES

### 2.1. Gestión de proveedores
Los administradores podrán:
- Crear, editar y eliminar proveedores.
- Registrar datos de contacto: nombre, persona de contacto, email, teléfono, dirección y CUIT.
- Activar o desactivar proveedores sin perder su historial.
- Visualizar el listado completo con búsqueda y filtros.
- Ver en detalle la información de cada proveedor.

### 2.2. Beneficios
- Información de proveedores organizada en un solo lugar.
- Facilita la comunicación y la trazabilidad al momento de generar órdenes de compra.
- Base necesaria para el módulo de Gestión de Compra.

---

## 3. MÓDULO DE GESTIÓN DE COMPRA

### 3.1. Pedidos de materiales
Los administradores podrán:
- Crear pedidos internos de materiales indicando descripción, cantidad y unidad.
- Generar número de pedido automático.
- Registrar observaciones y estado del pedido.

### 3.2. Presupuestos de proveedores
- Asociar cotizaciones de proveedores a cada pedido.
- Comparar precios y condiciones entre proveedores.
- Adjuntar archivos de soporte.

### 3.3. Órdenes de compra
- Generar órdenes de compra formales a partir de un pedido o de forma manual.
- Registrar ítems, cantidades, precios unitarios, totales, condiciones de pago y entrega.
- Generar número de orden de compra automático.
- Asociar proveedor y pedido de origen.

### 3.4. Recepción de materiales
- Registrar recepciones parciales o totales de cada orden.
- Asociar número de remito del proveedor.
- Subir PDF del remito como adjunto.
- Registrar cantidades recibidas por ítem.
- El stock de materiales se actualiza automáticamente al recepcionar.

### 3.5. Estados de la orden de compra
El sistema actualiza automáticamente el estado de cada orden:
- Borrador
- Pendiente
- Aprobada
- Recibida parcial
- Recibida
- Cancelada

### 3.6. Gestión y filtros
- Listado general de pedidos y órdenes de compra.
- Filtros por estado, proveedor y fecha.
- Búsqueda rápida.
- Visualización detallada de cada documento.

### 3.7. Beneficios
- Digitaliza todo el proceso de compras.
- Reduce errores y evita pérdida de información.
- Deja constancia de cada compra realizada.
- Mantiene actualizado el stock de materiales automáticamente.

---

## 4. MÓDULO DE GESTIÓN DE ALQUILERES

### 4.1. Módulos de alquiler
Los administradores podrán:
- Registrar cada activo físico disponible para alquilar.
- Guardar código, nombre, descripción, dimensiones, modulación y cantidad.
- Controlar el estado del módulo: disponible, en alquiler, en mantenimiento o dado de baja.
- Registrar ubicación y condición física.
- Asociar un proyecto de origen cuando corresponda.

### 4.2. Contratos de alquiler
- Crear contratos vinculados a un cliente y a un módulo.
- Registrar fechas de inicio, entrega, finalización y devolución.
- Guardar precio mensual, moneda y depósito en garantía.
- Asociar cotización de alquiler aprobada como origen.
- Agregar notas de entrega y devolución.

### 4.3. Entrega y devolución
- Registrar la fecha y observaciones de entrega.
- Procesar la devolución del módulo, actualizando automáticamente el estado del contrato a "Devuelto".
- El módulo vuelve automáticamente a estado "Disponible" al confirmar la devolución.

### 4.4. Historial por módulo
- Revisar todos los contratos históricos de cada activo.
- Visualizar cliente, fechas, precio mensual y estado de cada contrato.

### 4.5. Vistas principales
- Listado de módulos con KPIs y filtros.
- Detalle de módulo con contrato activo e historial.
- Listado general de contratos con filtros por estado.
- Detalle completo de cada contrato.

### 4.6. Beneficios
- Control centralizado de activos alquilados.
- Visibilidad completa del ciclo de vida de cada módulo.
- Integración con clientes, proyectos y cotizaciones.
- Evita pérdida de activos y mejora la planificación.

---

## 5. MÓDULO DE HISTÓRICO DE MOVIMIENTOS DE MATERIALES

### 5.1. Registro automático de movimientos
El sistema registra automáticamente cada cambio de stock, indicando:
- Tipo de movimiento: entrada, salida o ajuste.
- Cantidad afectada.
- Stock resultante.
- Origen del movimiento.
- Fecha y usuario que lo registró.

### 5.2. Orígenes de movimiento
Los movimientos pueden provenir de:
- Recepción de una orden de compra.
- Asignación de material a un proyecto.
- Devolución de material desde un proyecto.
- Ajuste de cantidad en un proyecto.
- Ajuste manual de stock.
- Stock inicial al crear un material.

### 5.3. Página de detalle por material
- Acceso desde el listado de stock haciendo clic en cualquier fila.
- Muestra información general del material.
- Tabla de historial con fecha, tipo, cantidad, stock resultante, origen y referencia.
- Botón para ajustar stock manualmente con registro del motivo.

### 5.4. Beneficios
- Trazabilidad total de cada material.
- Permite auditar entradas y salidas.
- Facilita la detección de diferencias de inventario.
- Base para análisis de rotación y costos.

---

## 6. ESTADO DE LOS MÓDULOS

Los cuatro módulos están desarrollados, integrados entre sí y listos para ser utilizados en producción.

---

## 7. BENEFICIOS GENERALES

| Beneficio | Descripción |
|-----------|-------------|
| Centralización | Toda la información de proveedores, compras, stock y alquileres en un solo sistema. |
| Trazabilidad | Cada movimiento de stock y cada contrato de alquiler quedan registrados con origen, fecha y usuario. |
| Automatización | El stock se actualiza solo al recibir materiales o asignarlos a proyectos; los módulos cambian de estado al alquilarlos o devolverlos. |
| Control | Estados automáticos de órdenes de compra, alertas de stock bajo y visibilidad de activos alquilados. |
| Auditoría | Historial completo que permite revisar qué pasó, cuándo y quién lo hizo. |

---

*Documento preparado para presentación al cliente.*
