"use client";

import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Budget } from "@/lib/prisma-typed-service";
import { pdf } from "@react-pdf/renderer";

interface BudgetPDFDownloadProps {
  budget: Budget;
  currentExchangeRate?: number;
}

export function BudgetPDFDownload({
  budget,
  currentExchangeRate,
}: BudgetPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // Importar dinámicamente el documento PDF
      const { BudgetPDFDocument } = await import("./BudgetPDFDocument");

      // Generar el blob del PDF
      const blob = await pdf(
        <BudgetPDFDocument
          budget={budget}
          currentExchangeRate={currentExchangeRate}
        />,
      ).toBlob();

      // Crear URL y descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Presupuesto_${budget.budget_code}_${budget.client_name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      size="lg"
      className="gap-2"
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Descargar PDF
        </>
      )}
    </Button>
  );
}
