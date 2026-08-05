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
import { DEFAULT_DELIVERY_CONDITIONS } from "@/lib/constants"

export interface DeliveryReceiptPDFItemAdditional {
  name: string
  quantity: number
}

export interface DeliveryReceiptPDFItem {
  type: 'standard_module' | 'custom_module' | 'service'
  name: string
  description?: string | null
  quantity: number
  is_optional?: boolean
  module_description?: { section: string; description: string }[] | null
  additionals?: DeliveryReceiptPDFItemAdditional[]
}

export interface DeliveryReceiptPDFData {
  number: string
  type: 'sale' | 'rental'
  status: string
  client_name: string
  client_company?: string | null
  client_cuit?: string | null
  client_phone?: string | null
  client_email?: string | null
  delivery_address?: string | null
  issue_date: string
  delivery_date?: string | null
  notes?: string | null
  delivery_conditions?: any[] | null
  notes_list?: any[] | null
  items: DeliveryReceiptPDFItem[]
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingTop: 110,
    paddingBottom: 60,
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
  companyTagline: {
    fontSize: 9,
    color: "#6b7280",
  },
  companyContact: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  receiptBlock: {
    textAlign: "right",
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  receiptNumber: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 3,
  },
  receiptDate: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  pageInfo: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 6,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 3,
  },
  clientBox: {
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#1f2937",
  },
  clientLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 6,
  },
  clientColumns: {
    flexDirection: "row",
    gap: 16,
  },
  clientColumn: {
    flex: 1,
  },
  clientDetail: {
    fontSize: 10,
    color: "#4b5563",
    marginTop: 3,
  },
  clientDetailLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginTop: 4,
  },
  table: {
    marginTop: 4,
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
  colQty: { width: "12%", textAlign: "center" },
  colDescription: { width: "88%" },
  itemName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.4,
    marginTop: 2,
  },
  sectionBody: {
    fontSize: 8,
    color: "#4b5563",
    lineHeight: 1.4,
    marginTop: 1,
  },
  sectionTitleSmall: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 3,
  },
  additionalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    paddingLeft: 8,
  },
  additionalBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9ca3af",
    marginRight: 6,
  },
  additionalText: {
    fontSize: 8,
    color: "#4b5563",
  },
  notesBox: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderLeftWidth: 3,
    borderLeftColor: "#d1d5db",
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  disclaimer: {
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  conditionsBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderLeftWidth: 3,
    borderLeftColor: "#1f2937",
    borderRadius: 4,
  },
  conditionsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  conditionsText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.6,
  },
  liabilityText: {
    marginTop: 16,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  conformityBox: {
    marginTop: 30,
  },
  conformityTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 16,
    textDecoration: "underline",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 40,
  },
  signatureCol: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 4,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingTop: 4,
    fontSize: 9,
    color: "#374151",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
  footerLeft: {
    fontSize: 8,
    color: "#9ca3af",
  },
  footerRight: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "right",
  },
})

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
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

export function DeliveryReceiptPDFDocument({
  receipt,
}: {
  receipt: DeliveryReceiptPDFData
}) {
  const standardItems = receipt.items.filter((i) => i.type === "standard_module")
  const customItems = receipt.items.filter((i) => i.type === "custom_module")
  const serviceItems = receipt.items.filter((i) => i.type === "service")
  const includedServices = serviceItems.filter((i) => !i.is_optional)
  const optionalServices = serviceItems.filter((i) => i.is_optional)

  const renderItem = (item: DeliveryReceiptPDFItem, idx: number) => (
    <View key={idx} style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
      <View style={styles.colDescription}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
        {item.module_description && item.module_description.length > 0 && (
          <View>
            {item.module_description.map((sec, i) => (
              <View key={i}>
                <Text style={styles.sectionTitleSmall}>{sec.section}</Text>
                <Text style={styles.sectionBody}>{sec.description}</Text>
              </View>
            ))}
          </View>
        )}
        {item.additionals && item.additionals.length > 0 && (
          <View style={{ marginTop: 4 }}>
            {item.additionals.map((ad, i) => (
              <View key={i} style={styles.additionalRow}>
                <View style={styles.additionalBullet} />
                <Text style={styles.additionalText}>
                  {ad.name} x {ad.quantity}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )

  const renderTable = (
    title: string,
    items: DeliveryReceiptPDFItem[],
    subtitle?: string
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
        {subtitle ? ` - ${subtitle}` : ""}
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
          <Text style={[styles.tableHeaderCell, styles.colDescription]}>
            Descripción
          </Text>
        </View>
        {items.map((item, idx) => renderItem(item, idx))}
      </View>
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.logoSection}>
            <Image src={LOGO_BASE64} style={styles.logo} />
            <View>
              <Text style={styles.companyName}>{COMPANY.name}</Text>
              <Text style={styles.companyTagline}>{COMPANY.tagline}</Text>
              <Text style={styles.companyContact}>{COMPANY.address}</Text>
              <Text style={styles.companyContact}>
                {COMPANY.phone} · {COMPANY.email}
              </Text>
            </View>
          </View>
          <View style={styles.receiptBlock}>
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>Documento no válido como factura</Text>
            </View>
            <Text style={styles.receiptTitle}>
              {receipt.type === "rental" ? "Remito de Alquiler" : "Remito de Entrega"}
            </Text>
            <Text style={styles.receiptNumber}>N°: {receipt.number}</Text>
            <Text style={styles.receiptDate}>
              Emisión: {formatDate(receipt.issue_date)}
            </Text>
            {receipt.delivery_date && (
              <Text style={styles.receiptDate}>
                Entrega estimada: {formatDate(receipt.delivery_date)}
              </Text>
            )}
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <View style={styles.clientBox}>
            <Text style={styles.clientLabel}>Datos del cliente</Text>
            <Text style={styles.clientName}>
              {receipt.client_name}
              {receipt.client_company ? ` (${receipt.client_company})` : ""}
            </Text>
            <View style={styles.clientColumns}>
              <View style={styles.clientColumn}>
                {receipt.client_cuit && (
                  <>
                    <Text style={styles.clientDetailLabel}>CUIT</Text>
                    <Text style={styles.clientDetail}>{receipt.client_cuit}</Text>
                  </>
                )}
                {receipt.client_phone && (
                  <>
                    <Text style={styles.clientDetailLabel}>Teléfono</Text>
                    <Text style={styles.clientDetail}>{receipt.client_phone}</Text>
                  </>
                )}
              </View>
              <View style={styles.clientColumn}>
                {receipt.client_email && (
                  <>
                    <Text style={styles.clientDetailLabel}>Email</Text>
                    <Text style={styles.clientDetail}>{receipt.client_email}</Text>
                  </>
                )}
                {receipt.delivery_address && (
                  <>
                    <Text style={styles.clientDetailLabel}>Dirección de entrega</Text>
                    <Text style={styles.clientDetail}>{receipt.delivery_address}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Items */}
        {standardItems.length > 0 && renderTable("Módulos Estándar", standardItems)}
        {customItems.length > 0 && renderTable("Módulos Personalizados", customItems)}
        {includedServices.length > 0 && renderTable("Servicios", includedServices)}
        {optionalServices.length > 0 &&
          renderTable("Servicios opcionales", optionalServices, "no incluidos")}

        {/* Notas */}
        {(receipt.notes || (receipt.notes_list && receipt.notes_list.length > 0)) && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            {receipt.notes && <Text style={styles.notesText}>{receipt.notes}</Text>}
            {receipt.notes_list &&
              receipt.notes_list.length > 0 &&
              receipt.notes_list.map((note, i) => (
                <Text key={i} style={styles.notesText}>
                  {typeof note === "string"
                    ? `${i + 1}. ${note}`
                    : note?.content
                    ? `${i + 1}. ${note.content}`
                    : null}
                </Text>
              ))}
          </View>
        )}

        {/* Condiciones de entrega */}
        <View style={styles.conditionsBox}>
          <Text style={styles.conditionsTitle}>Condiciones de entrega</Text>
          {(receipt.delivery_conditions && receipt.delivery_conditions.length > 0
            ? receipt.delivery_conditions
            : DEFAULT_DELIVERY_CONDITIONS
          ).map((condition, i) => (
            <Text key={i} style={styles.conditionsText}>
              {i + 1}) {typeof condition === 'string' ? condition : condition?.content}
            </Text>
          ))}
        </View>

        {/* Responsabilidad de traslado */}
        <Text style={styles.liabilityText}>
          PIACENZA SRL - MODULARQ NO SE RESPONSABILIZA POR EL TRASLADO DE LOS ELEMENTOS MENCIONADOS
        </Text>

        {/* Conformidad de entrega */}
        <View style={styles.conformityBox}>
          <Text style={styles.conformityTitle}>Conformidad de entrega</Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureCol}>
              <Text style={styles.signatureLabel}>Firma:</Text>
              <Text style={styles.signatureLine} />
            </View>
            <View style={styles.signatureCol}>
              <Text style={styles.signatureLabel}>Aclaración:</Text>
              <Text style={styles.signatureLine} />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>{COMPANY.legalName}</Text>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
