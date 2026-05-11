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
  quoteBlock: {
    textAlign: "right",
  },
  quoteTitleText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  quoteNumber: {
    fontSize: 10,
    color: "#6b7280",
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
  modulePriceBlock: {
    alignItems: "flex-end",
    marginLeft: 10,
  },
  moduleUnitPrice: {
    fontSize: 9,
    color: "#6b7280",
  },
  moduleSubtotal: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
    fontFamily: "Courier",
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
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  adicionalesLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  adicionalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    gap: 6,
  },
  adicionalBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#9ca3af",
  },
  adicionalName: {
    fontSize: 10,
    color: "#374151",
    flex: 1,
  },
  adicionalPrice: {
    fontSize: 9,
    fontFamily: "Courier",
    color: "#374151",
  },
  clientBox: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#1f2937",
  },
  clientLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  clientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  clientCol: {
    flex: 1,
  },
  clientName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  clientDetail: {
    fontSize: 10,
    color: "#4b5563",
    marginTop: 4,
    lineHeight: 1.4,
  },
  clientDetailLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginTop: 6,
    marginBottom: 2,
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
    width: 200,
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
  type: 'standard_module' | 'custom_module' | 'service';
  moduleId: string;
  moduleName: string;
  moduleDescription?: string;
  moduleDescriptionSections?: CotizadorDescriptionSection[];
  basePrice: number;
  quantity: number;
  adicionales: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export interface CotizadorPDFProps {
  quoteNumber?: string;
  notes?: string;
  notesList?: string[];
  items: CotizadorItem[];
  date: string;
  validUntil?: string;
  generatorName?: string;
  finalTotal?: number;
  discount?: number;
  client?: {
    name: string;
    cuit?: string;
    contact?: string;
    email?: string;
    phone?: string;
  };
  exchangeRate?: {
    venta: number;
    origen?: string;
    actualizado?: string;
  };
}

function formatUSD(amountARS: number, rate: number): string {
  const usd = rate > 0 ? amountARS / rate : 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}

export function CotizadorPDFDocument({
  quoteNumber,
  notes,
  notesList,
  items,
  date,
  validUntil,
  generatorName,
  finalTotal,
  discount,
  client,
  exchangeRate,
}: CotizadorPDFProps) {
  const rate = exchangeRate?.venta ?? 0;
  const standardItems = items.filter((i) => i.type === 'standard_module');
  const customItems = items.filter((i) => i.type === 'custom_module');
  const serviceItems = items.filter((i) => i.type === 'service');

  const calculateItemTotal = (item: CotizadorItem) => {
    const base = item.basePrice * item.quantity;
    const adds = item.adicionales.reduce((a, ad) => a + ad.price, 0);
    return base + adds;
  };

  const subtotalStandard = standardItems.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const subtotalCustom = customItems.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const subtotalServices = serviceItems.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const computedTotal = subtotalStandard + subtotalCustom + subtotalServices;
  const displayTotal = finalTotal ?? computedTotal;
  const discountAmount = discount ?? 0;
  const taxableAmount = Math.max(0, discountAmount > 0 ? computedTotal - discountAmount : displayTotal);
  const ivaAmount = taxableAmount * 0.21;
  const totalAmount = taxableAmount * 1.21;

  const renderItem = (item: CotizadorItem, idx: number) => {
    const showQty = item.quantity > 1;
    const itemTotal = calculateItemTotal(item);
    return (
      <View key={`${item.moduleId}-${idx}`} style={styles.moduleCard}>
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleName}>
            {item.moduleName}
            {showQty ? ` (x${item.quantity})` : ''}
          </Text>
          <View style={styles.modulePriceBlock}>
            {showQty && (
              <Text style={styles.moduleUnitPrice}>
                {formatUSD(item.basePrice, rate)} c/u
              </Text>
            )}
            <Text style={styles.moduleSubtotal}>
              {formatUSD(itemTotal, rate)}
            </Text>
          </View>
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
            <Text style={styles.adicionalesLabel}>Incluye</Text>
            {item.adicionales.map((ad) => (
              <View key={ad.id} style={styles.adicionalItem}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                  <View style={styles.adicionalBullet} />
                  <Text style={styles.adicionalName}>{ad.name}</Text>
                </View>
                <Text style={styles.adicionalPrice}>{formatUSD(ad.price, rate)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

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
            {quoteNumber && (
              <>
                <Text style={styles.quoteNumber}>Presupuesto N°: {quoteNumber.split('-').pop()}</Text>
              </>
            )}
            <Text style={styles.quoteDate}>Emisión: {date}</Text>
            {validUntil && (
              <Text style={styles.quoteDate}>Válida hasta: {validUntil}</Text>
            )}
            {exchangeRate && exchangeRate.venta > 0 && (
              <Text style={styles.quoteDate}>Dólar BNA Venta: ${exchangeRate.venta.toLocaleString('es-AR')}</Text>
            )}
          </View>
        </View>

        {/* Datos del cliente */}
        {client && (
          <View style={styles.clientBox}>
            <Text style={styles.clientLabel}>Datos del cliente</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            <View style={styles.clientRow}>
              <View style={styles.clientCol}>
                {client.cuit && (
                  <>
                    <Text style={styles.clientDetailLabel}>CUIT</Text>
                    <Text style={styles.clientDetail}>{client.cuit}</Text>
                  </>
                )}
                {client.contact && (
                  <>
                    <Text style={styles.clientDetailLabel}>Contacto</Text>
                    <Text style={styles.clientDetail}>{client.contact}</Text>
                  </>
                )}
              </View>
              <View style={styles.clientCol}>
                {client.email && (
                  <>
                    <Text style={styles.clientDetailLabel}>Email</Text>
                    <Text style={styles.clientDetail}>{client.email}</Text>
                  </>
                )}
                {client.phone && (
                  <>
                    <Text style={styles.clientDetailLabel}>Teléfono</Text>
                    <Text style={styles.clientDetail}>{client.phone}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Módulos Estándar */}
        {standardItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Módulos Estándar</Text>
            {standardItems.map((item, idx) => renderItem(item, idx))}
          </View>
        )}

        {/* Módulos Personalizados */}
        {customItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Módulos Personalizados</Text>
            {customItems.map((item, idx) => renderItem(item, idx))}
          </View>
        )}

        {/* Servicios */}
        {serviceItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicios</Text>
            {serviceItems.map((item, idx) => renderItem(item, idx))}
          </View>
        )}

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatUSD(discountAmount > 0 ? computedTotal : displayTotal, rate)}
            </Text>
          </View>
          {discountAmount > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuentos</Text>
                <Text style={styles.totalValue}>
                  {formatUSD(discountAmount, rate)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Importe Gravado</Text>
                <Text style={styles.totalValue}>
                  {formatUSD(taxableAmount, rate)}
                </Text>
              </View>
            </>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Impuestos</Text>
            <Text style={styles.totalValue}>
              {formatUSD(ivaAmount, rate)}
            </Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatUSD(totalAmount, rate)}</Text>
          </View>
        </View>

        {/* Notas */}
        {notesList && notesList.length > 0 ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            {notesList.map((note, i) => (
              <Text key={i} style={styles.notesText}>
                {i + 1}. {note}
              </Text>
            ))}
          </View>
        ) : notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        ) : null}

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
