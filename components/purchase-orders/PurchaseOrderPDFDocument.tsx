"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer"
import { LOGO_BASE64 } from "@/lib/logo-base64"
import { COMPANY } from "@/lib/company-config"

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
}

interface PDFPurchaseOrder {
  order_number: string
  status: string
  supplier: PDFSupplier
  items: PDFItem[]
  subtotal: number
  tax_pct: number
  tax_amount: number
  total: number
  payment_terms?: string
  delivery_terms?: string
  delivery_date?: string
  notes?: string
  created_at: string
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingTop: 110,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    position: "absolute",
    top: 25,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
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
  orderTitle: {
    textAlign: "right",
  },
  orderTitleText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  orderCode: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    color: "#6b7280",
  },
  orderDate: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
  },
  contactInfo: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
    fontSize: 9,
    color: "#4b5563",
  },
  contactItem: {
    flexDirection: "row",
    gap: 4,
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
    width: 120,
    textAlign: "right",
    paddingRight: 15,
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
    width: 120,
    textAlign: "right",
    paddingRight: 15,
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

function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
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
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.logoSection}>
            <Image src={LOGO_BASE64} style={styles.logo} />
            <View>
              <Text style={styles.companyName}>{COMPANY.name}</Text>
              <Text style={styles.companySlogan}>{COMPANY.tagline}</Text>
            </View>
          </View>
          <View style={styles.orderTitle}>
            <Text style={styles.orderTitleText}>ORDEN DE COMPRA</Text>
            <Text style={styles.orderCode}>{purchaseOrder.order_number}</Text>
            <Text style={styles.orderDate}>{formatDate(purchaseOrder.created_at)}</Text>
          </View>
        </View>

        {/* Contacto empresa */}
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Text>{COMPANY.address}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text>{COMPANY.phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text>{COMPANY.email}</Text>
          </View>
        </View>

        {/* Proveedor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proveedor</Text>
          <View style={styles.supplierInfo}>
            <View style={styles.supplierBlock}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{purchaseOrder.supplier.name}</Text>
            </View>
            {purchaseOrder.supplier.contact_name && (
              <View style={styles.supplierBlock}>
                <Text style={styles.label}>Contacto</Text>
                <Text style={styles.value}>{purchaseOrder.supplier.contact_name}</Text>
              </View>
            )}
            {purchaseOrder.supplier.cuit && (
              <View style={styles.supplierBlock}>
                <Text style={styles.label}>CUIT</Text>
                <Text style={styles.value}>{purchaseOrder.supplier.cuit}</Text>
              </View>
            )}
          </View>
          <View style={[styles.supplierInfo, { marginTop: 8 }]}>
            {purchaseOrder.supplier.email && (
              <View style={styles.supplierBlock}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{purchaseOrder.supplier.email}</Text>
              </View>
            )}
            {purchaseOrder.supplier.phone && (
              <View style={styles.supplierBlock}>
                <Text style={styles.label}>Teléfono</Text>
                <Text style={styles.value}>{purchaseOrder.supplier.phone}</Text>
              </View>
            )}
            {purchaseOrder.supplier.address && (
              <View style={styles.supplierBlock}>
                <Text style={styles.label}>Dirección</Text>
                <Text style={styles.value}>{purchaseOrder.supplier.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Estado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <Text style={styles.value}>
            {STATUS_LABELS[purchaseOrder.status] || purchaseOrder.status}
          </Text>
        </View>

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
                <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQuantity]}>
                  {item.quantity.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
                <Text style={[styles.tableCell, styles.colUnitPrice]}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {formatCurrency(item.total_price)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(purchaseOrder.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA ({purchaseOrder.tax_pct}%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(purchaseOrder.tax_amount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(purchaseOrder.total)}</Text>
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
                  <Text style={styles.conditionValue}>{purchaseOrder.payment_terms}</Text>
                </View>
              )}
              {purchaseOrder.delivery_terms && (
                <View style={{ width: "45%" }}>
                  <Text style={styles.conditionLabel}>Términos de entrega</Text>
                  <Text style={styles.conditionValue}>{purchaseOrder.delivery_terms}</Text>
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
                  <Text style={styles.conditionValue}>{purchaseOrder.notes}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{COMPANY.name} - {COMPANY.address}</Text>
          <Text>{COMPANY.phone} | {COMPANY.email}</Text>
        </View>
      </Page>
    </Document>
  )
}
