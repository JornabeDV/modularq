-- =====================================================
-- MÓDULO DE PRESUPUESTOS - SQL Migration
-- =====================================================

-- Enum para estados de presupuesto
CREATE TYPE "BudgetStatus" AS ENUM ('draft', 'sent', 'approved', 'rejected');

-- Tabla: Conceptos de Mano de Obra (precios referenciales)
CREATE TABLE "labor_concepts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "hourly_rate" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labor_concepts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "labor_concepts_code_key" ON "labor_concepts"("code");

-- Tabla: Plantillas de Ítems para Presupuestos
CREATE TABLE "budget_item_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "is_standard" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "template_labors" JSONB,
    "template_materials" JSONB,
    "template_equipments" JSONB,

    CONSTRAINT "budget_item_templates_pkey" PRIMARY KEY ("id")
);

-- Tabla: Presupuestos
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "budget_code" TEXT NOT NULL,
    "client_id" TEXT,
    "client_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "status" "BudgetStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "project_id" TEXT,
    "financial_expenses_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "general_expenses_pct" DOUBLE PRECISION NOT NULL DEFAULT 17,
    "benefit_pct" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "iva_pct" DOUBLE PRECISION NOT NULL DEFAULT 10.5,
    "gross_income_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal_direct_costs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal_with_expenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal_with_benefit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculated_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "final_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exchange_rate" DOUBLE PRECISION DEFAULT 0,
    "exchange_rate_date" TIMESTAMP,
    "validity_days" INTEGER,
    "payment_terms" TEXT,
    "delivery_terms" TEXT,
    "delivery_location" TEXT,
    "notes" TEXT,
    "module_description" JSONB;

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "budgets_budget_code_key" ON "budgets"("budget_code");
CREATE UNIQUE INDEX "budgets_project_id_key" ON "budgets"("project_id");

-- Foreign key: budgets -> projects
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_project_id_fkey" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tabla: Ítems de Presupuesto
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "template_id" TEXT,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_cost_labor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_cost_materials" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_cost_equipment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_cost_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_budget_id_fkey" 
    FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabla: Análisis de Precios por Ítem
CREATE TABLE "budget_item_price_analyses" (
    "id" TEXT NOT NULL,
    "budget_item_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_item_price_analyses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "budget_item_price_analyses_budget_item_id_key" ON "budget_item_price_analyses"("budget_item_id");

ALTER TABLE "budget_item_price_analyses" ADD CONSTRAINT "budget_item_price_analyses_budget_item_id_fkey" 
    FOREIGN KEY ("budget_item_id") REFERENCES "budget_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabla: Desglose de Mano de Obra en Análisis
CREATE TABLE "budget_item_labors" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "labor_concept_id" TEXT NOT NULL,
    "quantity_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hourly_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "budget_item_labors_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "budget_item_labors" ADD CONSTRAINT "budget_item_labors_analysis_id_fkey" 
    FOREIGN KEY ("analysis_id") REFERENCES "budget_item_price_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabla: Desglose de Materiales en Análisis
CREATE TABLE "budget_item_materials" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "material_id" TEXT,
    "material_name" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_price" DOUBLE PRECISION,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "budget_item_materials_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "budget_item_materials" ADD CONSTRAINT "budget_item_materials_analysis_id_fkey" 
    FOREIGN KEY ("analysis_id") REFERENCES "budget_item_price_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabla: Desglose de Equipos en Análisis
CREATE TABLE "budget_item_equipments" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hourly_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "budget_item_equipments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "budget_item_equipments" ADD CONSTRAINT "budget_item_equipments_analysis_id_fkey" 
    FOREIGN KEY ("analysis_id") REFERENCES "budget_item_price_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- DATOS INICIALES: Conceptos de Mano de Obra
-- =====================================================

INSERT INTO "labor_concepts" ("id", "code", "name", "category", "hourly_rate", "updated_at")
VALUES 
    (gen_random_uuid()::text, 'oficial-esp', 'Oficial especializado', 'oficial_especializado', 8829.33, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'oficial', 'Oficial', 'oficial', 8500.00, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'medio-oficial', 'Medio oficial', 'medio_oficial', 7946.94, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'ayudante', 'Ayudante', 'ayudante', 7315.09, CURRENT_TIMESTAMP);

-- =====================================================
-- DATOS INICIALES: Plantillas de Ítems Estándar
-- (Basados en el Excel del usuario)
-- =====================================================

INSERT INTO "budget_item_templates" ("id", "code", "category", "description", "unit", "is_standard", "order", "updated_at")
VALUES
    -- ESTRUCTURA METÁLICA
    (gen_random_uuid()::text, '1.1', 'ESTRUCTURA METÁLICA', 'Provisión y limpieza de caños', 'kg', true, 1, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '1.2', 'ESTRUCTURA METÁLICA', 'Cortado de caños de jaula principal', 'kg', true, 2, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '1.3', 'ESTRUCTURA METÁLICA', 'Armado jaula principal', 'kg', true, 3, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '1.4', 'ESTRUCTURA METÁLICA', 'Armado y montado de parrilla inf.', 'kg', true, 4, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '1.5', 'ESTRUCTURA METÁLICA', 'Colocación de topes de placa', 'm', true, 5, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '1.6', 'ESTRUCTURA METÁLICA', 'Sellado de topes con caños', 'm', true, 6, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '1.7', 'ESTRUCTURA METÁLICA', 'Pintado completo de estructura y topes', 'm2', true, 7, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '1.8', 'ESTRUCTURA METÁLICA', 'Pintado completo de estructura (2da mano), topes (2da mano)', 'm2', true, 8, CURRENT_TIMESTAMP),
    
    -- PISO
    (gen_random_uuid()::text, '2.1', 'PISO', 'Pintado, corte y fijación de fenólicos de piso', 'm2', true, 9, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '2.2', 'PISO', 'Colocación de piso de PVC', 'm2', true, 10, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '2.3', 'PISO', 'Colocación de zócalos', 'm', true, 11, CURRENT_TIMESTAMP),
    
    -- MUROS
    (gen_random_uuid()::text, '3.1', 'MUROS', 'Colocación de paneles de muro (h:2,40m)', 'un', true, 12, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '3.2', 'MUROS', 'Remoción de plásticos de paneles', 'un', true, 13, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '3.3', 'MUROS', 'Sellado de paneles con topes de placa', 'm', true, 14, CURRENT_TIMESTAMP),
    
    -- ABERTURAS
    (gen_random_uuid()::text, '4.1', 'ABERTURAS', 'Cortado de panel para puerta (0,85x2)', 'un', true, 15, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '4.2', 'ABERTURAS', 'Cortado de panel para ventanas (1,00x1,00)', 'un', true, 16, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '4.3', 'ABERTURAS', 'Cortado y pintado del marco y borde de puerta (0,85x2)', 'm2', true, 17, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '4.4', 'ABERTURAS', 'Cortado y pintado del premarco de ventana (1,00x1,00)', 'm2', true, 18, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '4.5', 'ABERTURAS', 'Colocación de marco de puerta', 'un', true, 19, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '4.51', 'ABERTURAS', 'Colocación de premarco de ventana', 'un', true, 20, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '4.6', 'ABERTURAS', 'Colocación de ventanas (1,00x1,00)', 'un', true, 21, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '4.7', 'ABERTURAS', 'Colocación de puerta', 'un', true, 22, CURRENT_TIMESTAMP),
    
    -- TECHO
    (gen_random_uuid()::text, '5.1', 'TECHO', 'Colocación y fijación de paneles de techo (long. 2,5m)', 'un', true, 23, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '5.2', 'TECHO', 'Pintado de zinguería (1ra mano) - Interior y exterior', 'm2', true, 24, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '5.3', 'TECHO', 'Colocación de zinguerías (soldado y remachado)', 'gl', true, 25, CURRENT_TIMESTAMP),
    
    -- INSTALACIÓN ELÉCTRICA
    (gen_random_uuid()::text, '6.1', 'INSTALACIÓN ELÉCTRICA', 'Cañerías, cajas, cableado, TG, llaves y tomacorrientes', 'gl', true, 26, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '6.2', 'INSTALACIÓN ELÉCTRICA', 'Luminarias', 'gl', true, 27, CURRENT_TIMESTAMP),
    
    -- AIRE ACONDICIONADO
    (gen_random_uuid()::text, '7.1', 'PROVISIÓN A/A', 'Armado y montaje de jaula', 'gl', true, 28, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '7.2', 'PROVISIÓN A/A', 'Colocación e instalación de split A/Ac', 'un', true, 29, CURRENT_TIMESTAMP),
    
    -- VINÍLICOS Y LIMPIEZA
    (gen_random_uuid()::text, '8.1', 'VINÍLICOS Y LIMPIEZA', 'Colocación de vinílicos', 'gl', true, 30, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '8.2', 'VINÍLICOS Y LIMPIEZA', 'Limpieza general', 'gl', true, 31, CURRENT_TIMESTAMP);
