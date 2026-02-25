-- =====================================================
-- MIGRACIÓN: Agregar cantidades predeterminadas a templates
-- Módulo: Planta Libre 5.86m x 2.44m
-- =====================================================

-- 1. Agregar columna default_quantity
ALTER TABLE budget_item_templates 
ADD COLUMN IF NOT EXISTS default_quantity DOUBLE PRECISION DEFAULT 0;

-- 2. Actualizar cantidades predeterminadas para Módulo Planta Libre
-- ESTRUCTURA METÁLICA
UPDATE budget_item_templates SET default_quantity = 448.26 WHERE code = '1.1';
UPDATE budget_item_templates SET default_quantity = 439.21 WHERE code = '1.2';
UPDATE budget_item_templates SET default_quantity = 299.92 WHERE code = '1.3';
UPDATE budget_item_templates SET default_quantity = 139.30 WHERE code = '1.4';
UPDATE budget_item_templates SET default_quantity = 50.96  WHERE code = '1.5';
UPDATE budget_item_templates SET default_quantity = 50.96  WHERE code = '1.6';
UPDATE budget_item_templates SET default_quantity = 27.49  WHERE code = '1.7';
UPDATE budget_item_templates SET default_quantity = 27.49  WHERE code = '1.8';

-- PISO
UPDATE budget_item_templates SET default_quantity = 14.04 WHERE code = '2.1';
UPDATE budget_item_templates SET default_quantity = 14.04 WHERE code = '2.2';
UPDATE budget_item_templates SET default_quantity = 15.04 WHERE code = '2.3';

-- MUROS
UPDATE budget_item_templates SET default_quantity = 14.00 WHERE code = '3.1';
UPDATE budget_item_templates SET default_quantity = 20.00 WHERE code = '3.2';
UPDATE budget_item_templates SET default_quantity = 50.96 WHERE code = '3.3';

-- ABERTURAS
UPDATE budget_item_templates SET default_quantity = 2.00  WHERE code = '4.1';
UPDATE budget_item_templates SET default_quantity = 2.00  WHERE code = '4.2';
UPDATE budget_item_templates SET default_quantity = 7.04  WHERE code = '4.3';
UPDATE budget_item_templates SET default_quantity = 0.78  WHERE code = '4.4';
UPDATE budget_item_templates SET default_quantity = 1.00  WHERE code = '4.5';
UPDATE budget_item_templates SET default_quantity = 2.00  WHERE code = '4.51';
UPDATE budget_item_templates SET default_quantity = 2.00  WHERE code = '4.6';
UPDATE budget_item_templates SET default_quantity = 1.00  WHERE code = '4.7';

-- TECHO
UPDATE budget_item_templates SET default_quantity = 6.00  WHERE code = '5.1';
UPDATE budget_item_templates SET default_quantity = 21.28 WHERE code = '5.2';
UPDATE budget_item_templates SET default_quantity = 1.00  WHERE code = '5.3';

-- INSTALACIÓN ELÉCTRICA
UPDATE budget_item_templates SET default_quantity = 1.00  WHERE code = '6.1';
UPDATE budget_item_templates SET default_quantity = 1.00  WHERE code = '6.2';

-- AIRE ACONDICIONADO
UPDATE budget_item_templates SET default_quantity = 1.00  WHERE code = '7.1';
UPDATE budget_item_templates SET default_quantity = 1.00  WHERE code = '7.2';

-- VINÍLICOS Y LIMPIEZA
UPDATE budget_item_templates SET default_quantity = 1.00  WHERE code = '8.1';
UPDATE budget_item_templates SET default_quantity = 1.00  WHERE code = '8.2';
