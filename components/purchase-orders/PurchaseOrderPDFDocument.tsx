"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import { sanitizePdfText } from "@/lib/pdf-sanitize"
import { PdfCompanyHeader } from "@/components/pdf/PdfCompanyHeader"
import { PdfCompanyFooter } from "@/components/pdf/PdfCompanyFooter"
import { PdfInfoCard } from "@/components/pdf/PdfInfoCard"
import { PdfCompanyInfoBox } from "@/components/pdf/PdfCompanyInfoBox"

// Tipos locales para evitar dependencias circulares
interface PDFSupplier {
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  cuit?: string
}

interface PDFItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  tax_pct: number
}

interface PDFPurchaseOrder {
  order_number: string
  status: string
  supplier: PDFSupplier
  items: PDFItem[]
  subtotal: number
  tax_pct: number
  tax_amount: number
  iibb_lh_pct: number
  iibb_lh_amount: number
  total: number
  currency?: 'ARS' | 'USD'
  total_ars?: number | null
  exchange_rate?: number | null
  payment_terms?: string
  delivery_terms?: string
  delivery_date?: string
  order_date?: string
  notes?: string
  created_at: string
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingTop: 100,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    position: "absolute",
    top: 25,
    left: 30,
    right: 30,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 80,
    height: 40,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  companySlogan: {
    fontSize: 9,
    color: "#6b7280",
  },
  companyContact: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  orderTitle: {
    textAlign: "right",
  },
  orderTitleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  orderCode: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 3,
  },
  orderDate: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
  },

  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  supplierInfo: {
    flexDirection: "row",
    gap: 40,
  },
  supplierBlock: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    fontWeight: "medium",
  },
  table: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },
  colDescription: { width: "40%" },
  colQuantity: { width: "15%", textAlign: "center" },
  colUnit: { width: "15%", textAlign: "center" },
  colUnitPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  totalsBox: {
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    width: 300,
    textAlign: "right",
    paddingRight: 15,
  },
  totalLabelSmall: {
    fontSize: 8,
    color: "#9ca3af",
    fontWeight: "normal",
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Courier",
    width: 120,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#1f2937",
    marginTop: 6,
    marginHorizontal: -10,
    marginBottom: -10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    width: 320,
    textAlign: "right",
    paddingRight: 15,
  },
  grandTotalLabelSmall: {
    fontSize: 9,
    color: "#d1d5db",
    fontWeight: "normal",
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "Courier",
    width: 120,
    textAlign: "right",
  },
  conditionLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  conditionValue: {
    fontSize: 9,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  pageNumber: {
    fontSize: 8,
    color: "#9ca3af",
  },
})

function formatCurrency(value: number, currency: 'ARS' | 'USD' = 'ARS'): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date)
  } catch {
    return dateStr
  }
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  approved: "Aprobada",
  partial_received: "Recibida parcial",
  received: "Recibida",
  cancelled: "Cancelada",
}

interface PurchaseOrderPDFDocumentProps {
  purchaseOrder: PDFPurchaseOrder
}

export function PurchaseOrderPDFDocument({ purchaseOrder }: PurchaseOrderPDFDocumentProps) {
  const currency = purchaseOrder.currency || 'ARS'

  const taxBreakdown = (() => {
    const map = new Map<number, number>()
    for (const item of purchaseOrder.items) {
      const pct = item.tax_pct ?? purchaseOrder.tax_pct ?? 21
      map.set(pct, (map.get(pct) || 0) + (item.total_price || 0))
    }
    return Array.from(map.entries())
      .map(([pct, base]) => ({ pct, base, amount: base * (pct / 100) }))
      .sort((a, b) => b.pct - a.pct)
  })()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <PdfCompanyHeader>
            <View style={styles.orderTitle}>
              <Text style={styles.orderTitleText}>Orden de Compra</Text>
              <Text style={styles.orderCode}>N°: {sanitizePdfText(purchaseOrder.order_number)}</Text>
              <Text style={styles.orderDate}>{formatDate(purchaseOrder.order_date || purchaseOrder.created_at)}</Text>
            </View>
          </PdfCompanyHeader>
        </View>

        {/* Datos de la empresa (page 1 only - normal flow) */}
        <PdfCompanyInfoBox />

        {/* Proveedor */}
        <PdfInfoCard
          cardLabel="Proveedor"
          leftFields={[
            { label: "Nombre", value: purchaseOrder.supplier.name },
            { label: "CUIT", value: purchaseOrder.supplier.cuit },
            { label: "Dirección", value: purchaseOrder.supplier.address },
          ]}
          rightFields={[
            { label: "Contacto", value: purchaseOrder.supplier.contact_name },
            { label: "Email", value: purchaseOrder.supplier.email },
            { label: "Teléfono", value: purchaseOrder.supplier.phone },
          ]}
        />

        {/* Ítems */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de ítems</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDescription]}>Descripción</Text>
              <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Cantidad</Text>
              <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unidad</Text>
              <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>P. Unit.</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            </View>
            {purchaseOrder.items.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDescription]}>{sanitizePdfText(item.description)}</Text>
                <Text style={[styles.tableCell, styles.colQuantity]}>
                  {item.quantity.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.tableCell, styles.colUnit]}>{sanitizePdfText(item.unit)}</Text>
                <Text style={[styles.tableCell, styles.colUnitPrice]}>
                  {formatCurrency(item.unit_price, currency)}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {formatCurrency(item.total_price, currency)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Subtotal <Text style={styles.totalLabelSmall}>(SIN IMPUESTOS)</Text>
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(purchaseOrder.subtotal, currency)}</Text>
          </View>
          {taxBreakdown.map((entry) => (
            <View key={entry.pct} style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                IVA <Text style={styles.totalLabelSmall}>({entry.pct}%)</Text>
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(entry.amount, currency)}</Text>
            </View>
          ))}
          {purchaseOrder.iibb_lh_pct > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Percepción IIBB y LH <Text style={styles.totalLabelSmall}>({purchaseOrder.iibb_lh_pct}%)</Text>
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(purchaseOrder.iibb_lh_amount, currency)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(purchaseOrder.total, currency)}</Text>
          </View>
        </View>

        {/* Condiciones */}
        {(purchaseOrder.payment_terms || purchaseOrder.delivery_terms || purchaseOrder.delivery_date || purchaseOrder.notes) && (
          <View style={[styles.section, { marginTop: 15 }]}>
            <Text style={styles.sectionTitle}>Condiciones</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
              {purchaseOrder.payment_terms && (
                <View style={{ width: "45%" }}>
                  <Text style={styles.conditionLabel}>Condiciones de pago</Text>
                  <Text style={styles.conditionValue}>{sanitizePdfText(purchaseOrder.payment_terms)}</Text>
                </View>
              )}
              {purchaseOrder.delivery_terms && (
                <View style={{ width: "45%" }}>
                  <Text style={styles.conditionLabel}>Términos de entrega</Text>
                  <Text style={styles.conditionValue}>{sanitizePdfText(purchaseOrder.delivery_terms)}</Text>
                </View>
              )}
              {purchaseOrder.delivery_date && (
                <View style={{ width: "45%" }}>
                  <Text style={styles.conditionLabel}>Fecha estimada de entrega</Text>
                  <Text style={styles.conditionValue}>{formatDate(purchaseOrder.delivery_date)}</Text>
                </View>
              )}
              {purchaseOrder.notes && (
                <View style={{ width: "100%", marginTop: 5 }}>
                  <Text style={styles.conditionLabel}>Notas</Text>
                  <Text style={styles.conditionValue}>{sanitizePdfText(purchaseOrder.notes)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <PdfCompanyFooter />
      </Page>
    </Document>
  )
}
