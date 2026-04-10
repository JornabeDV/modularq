"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { LOGO_BASE64 } from "@/lib/logo-base64";
import { COMPANY } from "@/lib/company-config";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingTop: 120,
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
  quoteBlock: {
    textAlign: "right",
  },
  quoteTitleText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  quoteNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 3,
  },
  quoteDate: {
    fontSize: 9,
    color: "#6b7280",
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
  moduleCard: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#1f2937",
  },
  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  moduleName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  modulePrice: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Courier",
    color: "#1f2937",
  },
  moduleDescription: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  descriptionSections: {
    marginTop: 6,
  },
  descriptionSectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 5,
    marginBottom: 2,
  },
  descriptionSectionBody: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  adicionalesSection: {
    marginTop: 8,
  },
  adicionalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  adicionalName: {
    fontSize: 9,
    color: "#374151",
  },
  adicionalPrice: {
    fontSize: 9,
    fontFamily: "Courier",
    color: "#374151",
  },
  label: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
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
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 10,
    width: 140,
    textAlign: "right",
    paddingRight: 15,
    color: "#4b5563",
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
    width: 140,
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
});

export interface CotizadorDescriptionSection {
  section: string;
  description: string;
}

export interface CotizadorItem {
  moduleId: string;
  moduleName: string;
  moduleDescription?: string;
  moduleDescriptionSections?: CotizadorDescriptionSection[];
  basePrice: number;
  adicionales: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export interface CotizadorPDFProps {
  quoteNumber?: string;
  notes?: string;
  items: CotizadorItem[];
  date: string;
  validUntil?: string;
  generatorName?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CotizadorPDFDocument({
  quoteNumber,
  notes,
  items,
  date,
  validUntil,
  generatorName,
}: CotizadorPDFProps) {
  const subtotalModules = items.reduce((acc, item) => acc + item.basePrice, 0);
  const subtotalAdicionales = items.reduce(
    (acc, item) => acc + item.adicionales.reduce((a, ad) => a + ad.price, 0),
    0,
  );
  const total = subtotalModules + subtotalAdicionales;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header fijo */}
        <View style={styles.header} fixed>
          {/* Izquierda: logo + datos empresa */}
          <View style={styles.logoSection}>
            <Image style={styles.logo} src={LOGO_BASE64} />
            <View>
              <Text style={styles.companyName}>{COMPANY.name}</Text>
              <Text style={styles.companyTagline}>{COMPANY.tagline}</Text>
              <Text style={styles.companyContact}>{COMPANY.address}</Text>
              <Text style={styles.companyContact}>
                {COMPANY.phone} · {COMPANY.email}
              </Text>
            </View>
          </View>

          {/* Derecha: título + número + fecha */}
          <View style={styles.quoteBlock}>
            <Text style={styles.quoteTitleText}>COTIZACIÓN</Text>
            {quoteNumber && (
              <Text style={styles.quoteNumber}>{quoteNumber}</Text>
            )}
            <Text style={styles.quoteDate}>Emisión: {date}</Text>
            {validUntil && (
              <Text style={styles.quoteDate}>Válida hasta: {validUntil}</Text>
            )}
          </View>
        </View>

        {/* Módulos cotizados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Módulos Cotizados</Text>
          {items.map((item, idx) => {
            const itemTotal =
              item.basePrice +
              item.adicionales.reduce((a, ad) => a + ad.price, 0);
            return (
              <View key={`${item.moduleId}-${idx}`} style={styles.moduleCard}>
                <View style={styles.moduleHeader}>
                  <Text style={styles.moduleName}>{item.moduleName}</Text>
                  <Text style={styles.modulePrice}>
                    {formatCurrency(itemTotal)}
                  </Text>
                </View>
                {item.moduleDescription && (
                  <Text style={styles.moduleDescription}>
                    {item.moduleDescription}
                  </Text>
                )}
                {item.moduleDescriptionSections && item.moduleDescriptionSections.length > 0 && (
                  <View style={styles.descriptionSections}>
                    {item.moduleDescriptionSections.map((sec, i) => (
                      <View key={i}>
                        <Text style={styles.descriptionSectionTitle}>{sec.section}</Text>
                        <Text style={styles.descriptionSectionBody}>{sec.description}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {item.adicionales.length > 0 && (
                  <View style={styles.adicionalesSection}>
                    <Text
                      style={[styles.label, { marginTop: 6, marginBottom: 4 }]}
                    >
                      Adicionales incluidos
                    </Text>
                    {item.adicionales.map((ad) => (
                      <View key={ad.id} style={styles.adicionalRow}>
                        <Text style={styles.adicionalName}>+ {ad.name}</Text>
                        <Text style={styles.adicionalPrice}>
                          {formatCurrency(ad.price)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal módulos</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(subtotalModules)}
            </Text>
          </View>
          {subtotalAdicionales > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal adicionales</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(subtotalAdicionales)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Notas */}
        {notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>
            {generatorName ? `Preparado por: ${generatorName}` : COMPANY.legalName}
          </Text>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
