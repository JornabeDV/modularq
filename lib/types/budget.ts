// =====================================================
// TIPOS PARA EL MÓDULO DE PRESUPUESTOS
// =====================================================

export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected'

// Concepto de Mano de Obra
export interface LaborConcept {
  id: string
  code: string
  name: string
  category: 'oficial_especializado' | 'oficial' | 'medio_oficial' | 'ayudante' | string
  hourly_rate: number
  created_at: string
  updated_at: string
}

// Plantilla de ítem para presupuestos
export interface BudgetItemTemplate {
  id: string
  code: string
  category: string
  description: string
  unit: string
  is_standard: boolean
  order: number
  created_at: string
  updated_at: string
  template_labors?: TemplateLabor[]
  template_materials?: TemplateMaterial[]
  template_equipments?: TemplateEquipment[]
}

export interface TemplateLabor {
  labor_concept_id: string
  quantity_hours: number
}

export interface TemplateMaterial {
  material_id: string
  quantity: number
}

export interface TemplateEquipment {
  name: string
  quantity_hours: number
  hourly_cost: number
}

// Tipos de documentos
export type DocumentType = 'project_image' | 'technical_plan'

// Archivo adjunto de presupuesto
export interface BudgetAttachment {
  id: string
  budget_id: string
  filename: string
  original_name: string
  mime_type: string
  file_type: 'image' | 'pdf'
  document_type: DocumentType
  size: number
  url: string
  public_id: string
  thumbnail_url?: string
  description?: string
  uploaded_by?: string
  created_at: string
  updated_at: string
}

// Presupuesto
export interface Budget {
  id: string
  budget_code: string
  client_id?: string
  client_name: string
  location: string
  description?: string
  status: BudgetStatus
  created_at: string
  updated_at: string
  sent_at?: string
  approved_at?: string
  rejected_at?: string
  project_id?: string
  
  // Porcentajes
  financial_expenses_pct: number
  general_expenses_pct: number
  benefit_pct: number
  iva_pct: number
  gross_income_pct: number
  
  // Totales
  subtotal_direct_costs: number
  subtotal_with_expenses: number
  subtotal_with_benefit: number
  calculated_price: number
  final_price: number
  
  // Cotización al momento de aprobar
  exchange_rate?: number
  exchange_rate_date?: string
  
  // Condiciones comerciales editables
  validity_days?: number
  payment_terms?: string
  delivery_terms?: string
  delivery_location?: string
  notes?: string
  
  // Descripción comercial del módulo
  module_description?: ModuleDescriptionSection[]
  
  // Relaciones
  items: BudgetItem[]
  attachments?: BudgetAttachment[]
}

// Ítem de presupuesto
export interface BudgetItem {
  id: string
  budget_id: string
  template_id?: string
  
  // Datos del ítem
  code: string
  category: string
  description: string
  unit: string
  is_custom: boolean
  order: number
  
  // Cómputos
  quantity: number
  
  // Costos calculados
  unit_cost_labor: number
  unit_cost_materials: number
  unit_cost_equipment: number
  unit_cost_total: number
  total_cost: number
  
  // Análisis de precios
  price_analysis?: BudgetItemPriceAnalysis
}

// Análisis de precios
export interface BudgetItemPriceAnalysis {
  id: string
  budget_item_id: string
  created_at: string
  updated_at: string
  
  labors: BudgetItemLabor[]
  materials: BudgetItemMaterial[]
  equipments: BudgetItemEquipment[]
}

// Desglose de mano de obra
export interface BudgetItemLabor {
  id: string
  analysis_id: string
  labor_concept_id: string
  quantity_hours: number
  hourly_rate: number
  total_cost: number
  
  // Relación opcional
  labor_concept?: LaborConcept
}

// Desglose de materiales
export interface BudgetItemMaterial {
  id: string
  analysis_id: string
  material_id?: string
  material_name?: string
  quantity: number
  unit_price?: number
  total_cost: number
  
  // Relación opcional
  material?: {
    id: string
    code: string
    name: string
    unit: string
  }
}

// Desglose de equipos
export interface BudgetItemEquipment {
  id: string
  analysis_id: string
  name: string
  quantity_hours: number
  hourly_cost: number
  total_cost: number
}

// ============================================
// DTOS PARA CREAR/ACTUALIZAR
// ============================================

export interface CreateBudgetInput {
  client_name: string
  location: string
  description?: string
  client_id?: string
}

export interface UpdateBudgetInput {
  client_name?: string
  location?: string
  description?: string
  client_id?: string
  status?: BudgetStatus
  
  // Porcentajes
  financial_expenses_pct?: number
  general_expenses_pct?: number
  benefit_pct?: number
  iva_pct?: number
  gross_income_pct?: number
  
  // Precio final editable
  final_price?: number
}

export interface UpdateBudgetItemInput {
  quantity?: number
  description?: string
  code?: string
  category?: string
  unit?: string
  order?: number
}

export interface CreateBudgetItemLaborInput {
  labor_concept_id: string
  quantity_hours: number
}

export interface CreateBudgetItemMaterialInput {
  material_id?: string
  material_name?: string
  quantity: number
  unit_price?: number
}

export interface CreateBudgetItemEquipmentInput {
  name: string
  quantity_hours: number
  hourly_cost: number
}

export interface UpdatePriceAnalysisInput {
  labors?: CreateBudgetItemLaborInput[]
  materials?: CreateBudgetItemMaterialInput[]
  equipments?: CreateBudgetItemEquipmentInput[]
}

// ============================================
// RESPUESTAS
// ============================================

export interface BudgetTotals {
  subtotal_direct_costs: number
  financial_expenses: number
  general_expenses: number
  subtotal_with_expenses: number
  benefit: number
  subtotal_with_benefit: number
  iva: number
  gross_income: number
  calculated_price: number
  final_price: number
}

export interface ModuleDescriptionSection {
  section: string
  description: string
}

export interface ApproveBudgetResult {
  success: boolean
  budget?: Budget
  project?: {
    id: string
    name: string
  }
  error?: string
}
