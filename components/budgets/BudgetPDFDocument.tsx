"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Budget, BudgetAttachment } from "@/lib/prisma-typed-service";
import { LOGO_BASE64 } from "@/lib/logo-base64";

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingTop: 110, // Espacio para el header fijo
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
  budgetTitle: {
    textAlign: "right",
  },
  budgetTitleText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  budgetCode: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    color: "#6b7280",
  },
  budgetDate: {
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
  clientInfo: {
    flexDirection: "row",
    gap: 40,
  },
  clientBlock: {
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
  totalsBox: {
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    width: "100%",
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
  amountInWords: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderLeftWidth: 3,
    borderLeftColor: "#d1d5db",
    borderRadius: 4,
  },
  amountInWordsLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  amountInWordsText: {
    fontSize: 10,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  moduleSection: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  moduleItem: {
    flexDirection: "row",
    marginBottom: 3,
  },
  moduleItemLabel: {
    fontSize: 9,
    fontWeight: "bold",
    width: 100,
    textTransform: "uppercase",
    color: "#374151",
  },
  moduleItemValue: {
    fontSize: 9,
    flex: 1,
    color: "#4b5563",
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
  bankSection: {
    marginTop: 12,
  },
  bankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  bankItem: {
    width: "48%",
  },
  bankLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
  bankValue: {
    fontSize: 9,
    fontWeight: "medium",
  },
  bankValueMono: {
    fontSize: 9,
    fontFamily: "Courier",
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
  // Estilos para archivos adjuntos
  attachmentsSection: {
    marginTop: 15,
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 15,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
  },
  attachmentsSubtitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 10,
    marginTop: 15,
  },
  // Estilos para imágenes de proyecto (grid)
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageContainer: {
    width: "48%",
    marginBottom: 12,
  },
  attachmentImage: {
    width: "100%",
    height: 300,
    objectFit: "cover",
    borderRadius: 4,
  },
  imageCaption: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  // Estilos para planos técnicos (hoja completa)
  fullPagePlan: {
    marginBottom: 20,
    pageBreakInside: "avoid",
  },
  fullPagePlanHeader: {
    backgroundColor: "#fee2e2",
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fullPagePlanNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 24,
  },
  fullPagePlanTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#7f1d1d",
    flex: 1,
  },
  fullPagePlanSize: {
    fontSize: 9,
    color: "#991b1b",
  },
  fullPagePlanContent: {
    borderWidth: 1,
    borderColor: "#fee2e2",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 15,
    minHeight: 400,
    alignItems: "center",
    justifyContent: "center",
  },
  fullPagePlanIcon: {
    fontSize: 64,
    color: "#dc2626",
    marginBottom: 15,
  },
  fullPagePlanText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  fullPagePlanSubtext: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 15,
  },
  fullPagePlanUrl: {
    fontSize: 9,
    color: "#2563eb",
    textAlign: "center",
    fontFamily: "Courier",
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 4,
    maxWidth: "100%",
  },
  // Estilos para lista de PDFs (fallback)
  pdfList: {
    marginTop: 8,
  },
  pdfItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    padding: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 4,
  },
  pdfBullet: {
    width: 6,
    height: 6,
    backgroundColor: "#dc2626",
    borderRadius: 3,
    marginRight: 8,
  },
  pdfName: {
    fontSize: 10,
    color: "#374151",
    flex: 1,
  },
  pdfSize: {
    fontSize: 9,
    color: "#6b7280",
  },
  pdfNote: {
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 15,
    textAlign: "center",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    lineHeight: 1.5,
  },

  conditionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  conditionsColumn: {
    width: "48%",
  },

  conditionBlock: {
    marginBottom: 8,
  },
});

// Datos de la empresa
const COMPANY_INFO = {
  name: "ModulArq",
  slogan: "Módulos Habitacionales",
  address: "Maurín 6688 Sur, Pocito, San Juan, Argentina",
  phone: "+54 264 555-5555",
  cuit: "30-71144558-3",
  bankName: "Banco Supervielle Argentina",
  accountType: "Cuenta Corriente en Pesos",
  cbu: "0270091510016725020039",
  alias: "PARRA.TAMBOR.BESO",
  contratista: "Piacenza SRL",
};

interface BudgetPDFDocumentProps {
  budget: Budget;
  currentExchangeRate?: number;
  attachments?: BudgetAttachment[];
}

// Convertir número a palabras
const numberToWords = (num: number): string => {
  const entero = Math.floor(num);
  const decimal = Math.round((num - entero) * 100);

  // Convertir número a palabras (simplificado para miles)
  const numeroEnPalabras = entero.toLocaleString("es-AR");

  return `dólares ${numeroEnPalabras} con ${decimal.toString().padStart(2, "0")}/100`;
};

// Truncar nombre de archivo si es muy largo
const truncateFilename = (name: string, maxLength: number = 35): string => {
  if (name.length <= maxLength) return name;
  const extension = name.split(".").pop();
  const nameWithoutExt = name.substring(0, name.lastIndexOf("."));
  const truncated = nameWithoutExt.substring(
    0,
    maxLength - 3 - (extension?.length || 0),
  );
  return `${truncated}...${extension}`;
};

// Formatear tamaño de archivo
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function BudgetPDFDocument({
  budget,
  currentExchangeRate,
  attachments = [],
}: BudgetPDFDocumentProps) {
  // Usar el tipo de cambio guardado (si está aprobado) o el actual
  const exchangeRateToUse = budget.exchange_rate || currentExchangeRate || 1;
  const totalUSD = budget.final_price / exchangeRateToUse;
  const ivaAmount = totalUSD * 0.105;
  const finalTotal = totalUSD + ivaAmount;

  // Separar por tipo de documento
  const projectImages = attachments.filter(
    (a) => a.document_type === "project_image",
  );
  // Los planos técnicos PDF se mergean al final, no se muestran como páginas separadas
  const technicalPlansPdf = attachments.filter(
    (a) => a.document_type === "technical_plan" && a.file_type === "pdf",
  );
  const hasProjectImages = projectImages.length > 0;
  const hasTechnicalPlansPdf = technicalPlansPdf.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header con Logo - Fijo en todas las páginas */}
        <View style={styles.header} fixed>
          <View style={styles.logoSection}>
            <Image style={styles.logo} src={LOGO_BASE64} />
            <View>
              <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
              <Text style={styles.companySlogan}>{COMPANY_INFO.slogan}</Text>
            </View>
          </View>
          <View style={styles.budgetTitle}>
            <Text style={styles.budgetTitleText}>PRESUPUESTO</Text>
            <Text style={styles.budgetCode}>{budget.budget_code}</Text>
            <Text style={styles.budgetDate}>
              Fecha: {new Date(budget.created_at).toLocaleDateString("es-AR")}
            </Text>
          </View>
        </View>

        {/* Info de contacto */}
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Text>{COMPANY_INFO.address}</Text>
          </View>

          <View style={styles.contactItem}>
            <Text>Contratista: {COMPANY_INFO.contratista}</Text>
          </View>

          <View style={styles.contactItem}>
            <Text>CUIT: {COMPANY_INFO.cuit}</Text>
          </View>
        </View>

        {/* Datos del cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <View style={styles.clientInfo}>
            <View style={styles.clientBlock}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>{budget.client_name}</Text>
            </View>
            <View style={styles.clientBlock}>
              <Text style={styles.label}>Proyecto</Text>
              <Text style={styles.value}>
                {budget.description || "Sin descripción"}
              </Text>
            </View>
          </View>
        </View>

        {/* Descripción del módulo */}
        {budget.module_description && budget.module_description.length > 0 && (
          <View style={styles.moduleSection}>
            <Text style={styles.sectionTitle}>Detalle del Módulo</Text>
            {budget.module_description.map((section, index) => (
              <View key={index} style={styles.moduleItem}>
                <Text style={styles.moduleItemLabel}>{section.section}:</Text>
                <Text style={styles.moduleItemValue}>
                  {section.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Importe del Presupuesto</Text>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SUBTOTAL:</Text>
              <Text style={styles.totalValue}>
                USD{" "}
                {totalUSD.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA 10,5%:</Text>
              <Text style={styles.totalValue}>
                USD{" "}
                {ivaAmount.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
              <Text style={styles.grandTotalValue}>
                USD{" "}
                {finalTotal.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* Precio en letras */}
          <View style={styles.amountInWords}>
            <Text style={styles.amountInWordsLabel}>1- PRECIO DE VENTA</Text>
            <Text style={styles.amountInWordsText}>
              El precio del presente presupuesto asciende a{" "}
              {numberToWords(finalTotal)}.
            </Text>
          </View>
        </View>

        {/* Condiciones comerciales */}
        <View>
          <Text style={styles.sectionTitle}>Condiciones Comerciales</Text>

          <View style={styles.conditionsGrid}>
            {/* Columna izquierda */}
            <View style={styles.conditionsColumn}>
              <View style={styles.conditionBlock}>
                <Text style={styles.conditionLabel}>
                  1- VALIDEZ DE LA OFERTA:
                </Text>
                <Text style={styles.conditionValue}>
                  {budget.validity_days || 30} días desde la fecha de emisión
                </Text>
              </View>

              <View style={styles.conditionBlock}>
                <Text style={styles.conditionLabel}>2- MONEDA:</Text>
                <Text style={styles.conditionValue}>
                  Dólar oficial BNA vendedor al día del efectivo pago
                </Text>
              </View>

              <View style={styles.conditionBlock}>
                <Text style={styles.conditionLabel}>
                  3- CONDICIONES DE PAGO:
                </Text>
                <Text style={styles.conditionValue}>
                  {budget.payment_terms || "50% anticipo, 50% contra entrega"}
                </Text>
              </View>
            </View>

            {/* Columna derecha */}
            <View style={styles.conditionsColumn}>
              <View style={styles.conditionBlock}>
                <Text style={styles.conditionLabel}>4- FECHA DE ENTREGA:</Text>
                <Text style={styles.conditionValue}>
                  {budget.delivery_terms || "Coordinada con el cliente"}
                </Text>
              </View>

              <View style={styles.conditionBlock}>
                <Text style={styles.conditionLabel}>5- LUGAR DE ENTREGA:</Text>
                <Text style={styles.conditionValue}>
                  {budget.delivery_location ||
                    "Predio ModulArq - Maurín 6688 Sur, Pocito"}
                </Text>
              </View>

              {budget.notes && (
                <View style={styles.conditionBlock}>
                  <Text style={styles.conditionLabel}>6- NOTAS:</Text>
                  <Text style={styles.conditionValue}>{budget.notes}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Datos bancarios */}
        <View style={styles.bankSection}>
          <Text style={styles.sectionTitle}>Datos para Transferencia</Text>
          <View style={styles.bankGrid}>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>Razón Social</Text>
              <Text style={styles.bankValue}>Piacenza SRL</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>CUIT</Text>
              <Text style={styles.bankValue}>{COMPANY_INFO.cuit}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>Banco</Text>
              <Text style={styles.bankValue}>{COMPANY_INFO.bankName}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>Tipo de Cuenta</Text>
              <Text style={styles.bankValue}>{COMPANY_INFO.accountType}</Text>
            </View>
            <View style={[styles.bankItem, { width: "100%" }]}>
              <Text style={styles.bankLabel}>CBU</Text>
              <Text style={styles.bankValueMono}>{COMPANY_INFO.cbu}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>Alias</Text>
              <Text style={styles.bankValueMono}>{COMPANY_INFO.alias}</Text>
            </View>
          </View>
        </View>        

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Cotización al {new Date().toLocaleDateString("es-AR")}</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* Página de Imágenes de Proyecto (si hay) */}
      {hasProjectImages && (
        <Page size="A4" style={styles.page}>
          {/* Header con Logo - Fijo en todas las páginas */}
          <View style={styles.header} fixed>
            <View style={styles.logoSection}>
              <Image style={styles.logo} src={LOGO_BASE64} />
              <View>
                <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
                <Text style={styles.companySlogan}>{COMPANY_INFO.slogan}</Text>
              </View>
            </View>
            <View style={styles.budgetTitle}>
              <Text style={styles.budgetTitleText}>PRESUPUESTO</Text>
              <Text style={styles.budgetCode}>{budget.budget_code}</Text>
              <Text style={styles.budgetDate}>
                Fecha: {new Date(budget.created_at).toLocaleDateString("es-AR")}
              </Text>
            </View>
          </View>

          <View style={styles.attachmentsSection}>
            <Text style={styles.attachmentsTitle}>Imágenes de Referencia</Text>

            <View style={styles.imagesGrid}>
              {projectImages.map((image, index) => (
                <View key={image.id} style={styles.imageContainer}>
                  <Image src={image.url} style={styles.attachmentImage} />
                  {/* <Text style={styles.imageCaption}>
                    Imagen {index + 1}:{" "}
                    {truncateFilename(image.original_name, 25)}
                  </Text> */}
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text>Cotización al {new Date().toLocaleDateString("es-AR")}</Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Página ${pageNumber} de ${totalPages}`
              }
            />
          </View>
        </Page>
      )}

      {/* Nota: Los planos técnicos PDF se mergean al final del documento final */}
    </Document>
  );
}
