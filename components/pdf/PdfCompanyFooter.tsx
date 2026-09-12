import { View, Text, StyleSheet } from "@react-pdf/renderer"
import { COMPANY } from "@/lib/company-config"

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 25,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
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

export function PdfCompanyFooter() {
  const footerLeft = `${COMPANY.name} - ${COMPANY.tagline}`

  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerLeft}>{footerLeft}</Text>
      <Text
        style={styles.footerRight}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  )
}
