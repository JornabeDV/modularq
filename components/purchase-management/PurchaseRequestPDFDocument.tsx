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

interface PDFMaterial {
  id?: string
  code?: string
  name?: string
  brand?: string
}

interface PDFItem {
  description: string
  quantity: number
  unit: string
  material?: PDFMaterial | null
}

interface PDFPurchaseRequest {
  request_number: string
  status: string
  notes?: string
  items: PDFItem[]
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
  companyContact: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  requestTitle: {
    textAlign: "right",
  },
  requestTitleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  requestNumber: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 3,
  },
  requestDate: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
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
  infoRow: {
    flexDirection: "row",
    gap: 40,
  },
  infoBlock: {
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
  colNumber: { width: "10%", textAlign: "center" },
  colQuantity: { width: "15%", textAlign: "center" },
  colDescription: { width: "45%" },
  colUnit: { width: "15%", textAlign: "center" },
  colBrand: { width: "15%", textAlign: "center" },
  notesBox: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    minHeight: 60,
  },
  notesLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#374151",
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
})

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  quoted: "Cotizado",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
}

interface PurchaseRequestPDFDocumentProps {
  purchaseRequest: PDFPurchaseRequest
}

export function PurchaseRequestPDFDocument({ purchaseRequest }: PurchaseRequestPDFDocumentProps) {
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
              <Text style={styles.companyContact}>{COMPANY.address}</Text>
              <Text style={styles.companyContact}>
                {COMPANY.phone} · {COMPANY.email}
              </Text>
            </View>
          </View>
          <View style={styles.requestTitle}>
            <Text style={styles.requestTitleText}>Pedido de Materiales</Text>
            <Text style={styles.requestNumber}>N°: {purchaseRequest.request_number}</Text>
            <Text style={styles.requestDate}>Emisión: {formatDate(purchaseRequest.created_at)}</Text>
          </View>
        </View>

        {/* Ítems */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de ítems solicitados</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNumber]}>N°</Text>
              <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Cantidad</Text>
              <Text style={[styles.tableHeaderCell, styles.colDescription]}>Descripción</Text>
              <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unidad</Text>
              <Text style={[styles.tableHeaderCell, styles.colBrand]}>Marca</Text>
            </View>
            {purchaseRequest.items.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colNumber]}>{idx + 1}</Text>
                <Text style={[styles.tableCell, styles.colQuantity]}>
                  {item.quantity.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
                <Text style={[styles.tableCell, styles.colBrand]}>
                  {item.material?.brand || "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Observaciones */}
        {purchaseRequest.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{purchaseRequest.notes}</Text>
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
