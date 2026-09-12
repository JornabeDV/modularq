import { View } from "@react-pdf/renderer";
import { COMPANY } from "@/lib/company-config";
import { PdfInfoCard } from "@/components/pdf/PdfInfoCard";

export function PdfCompanyInfoBox() {
  return (
    <PdfInfoCard
      cardLabel="Datos de la empresa"
      title={COMPANY.legalName}
      leftFields={[
        { label: "CUIT", value: COMPANY.cuit },
        { label: "Domicilio Fiscal", value: COMPANY.fiscalAddress },
        { label: "Domicilio Comercial", value: COMPANY.commercialAddress },
      ]}
      rightFields={[
        { label: "Teléfono", value: COMPANY.phone },
        { label: "Email", value: COMPANY.email },
        { label: "Web", value: COMPANY.website },
      ]}
    />
  );
}
