import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { sanitizePdfText } from "@/lib/pdf-sanitize";

export interface InfoField {
  label: string;
  value: string | null | undefined;
}

export interface PdfInfoCardProps {
  cardLabel: string;
  title?: string;
  leftFields: InfoField[];
  rightFields?: InfoField[];
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#1f2937",
    width: "100%",
  },
  cardLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginTop: 6,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
    color: "#4b5563",
    marginTop: 4,
    lineHeight: 1.4,
  },
});

export function PdfInfoCard({
  cardLabel,
  title,
  leftFields,
  rightFields,
}: PdfInfoCardProps) {
  const left = leftFields.filter((f) => f.value);
  const right = (rightFields ?? []).filter((f) => f.value);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{sanitizePdfText(cardLabel)}</Text>
      {title && (
        <Text style={styles.cardTitle}>{sanitizePdfText(title)}</Text>
      )}
      <View style={styles.row}>
        <View style={styles.col}>
          {left.map((field, i) => (
            <View key={`l-${i}`}>
              <Text style={styles.fieldLabel}>
                {sanitizePdfText(field.label)}
              </Text>
              <Text style={styles.fieldValue}>
                {sanitizePdfText(field.value ?? "")}
              </Text>
            </View>
          ))}
        </View>
        {right.length > 0 && (
          <View style={styles.col}>
            {right.map((field, i) => (
              <View key={`r-${i}`}>
                <Text style={styles.fieldLabel}>
                  {sanitizePdfText(field.label)}
                </Text>
                <Text style={styles.fieldValue}>
                  {sanitizePdfText(field.value ?? "")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
