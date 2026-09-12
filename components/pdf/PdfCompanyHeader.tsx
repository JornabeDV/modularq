import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { COMPANY } from "@/lib/company-config";
import { LOGO_BASE64 } from "@/lib/logo-base64";

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  logo: {
    width: 80,
    height: 40,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  companyTagline: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  docInfoWrapper: {
    textAlign: "right",
  },
});

interface PdfCompanyHeaderProps {
  children?: ReactNode;
}

export function PdfCompanyHeader({ children }: PdfCompanyHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoSection}>
          <Image style={styles.logo} src={LOGO_BASE64} />
          <View>
            <Text style={styles.companyName}>{COMPANY.name}</Text>
            <Text style={styles.companyTagline}>{COMPANY.tagline}</Text>
          </View>
        </View>
        {children && (
          <View style={styles.docInfoWrapper}>{children}</View>
        )}
      </View>
    </View>
  );
}
