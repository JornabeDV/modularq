"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FilePlus } from "lucide-react";
import { Budget, BudgetAttachment } from "@/lib/prisma-typed-service";
import { pdf } from "@react-pdf/renderer";
import { mergePdfs } from "@/lib/pdf-merger";

interface BudgetPDFDownloadProps {
  budget: Budget;
  currentExchangeRate?: number;
  attachments?: BudgetAttachment[];
}

export function BudgetPDFDownload({
  budget,
  currentExchangeRate,
  attachments = [],
}: BudgetPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // 1. Importar dinámicamente el documento PDF
      const { BudgetPDFDocument } = await import("./BudgetPDFDocument");

      // 2. Generar el PDF del presupuesto
      const budgetBlob = await pdf(
        <BudgetPDFDocument
          budget={budget}
          currentExchangeRate={currentExchangeRate}
          attachments={attachments}
        />,
      ).toBlob();

      // 3. Obtener los PDFs de planos técnicos
      const technicalPlans = attachments.filter(
        (a) => a.document_type === "technical_plan" && a.file_type === "pdf",
      );

      let finalBlob: Blob;

      if (technicalPlans.length > 0) {
        // 4. Convertir el blob del presupuesto a ArrayBuffer
        const budgetBuffer = await budgetBlob.arrayBuffer();

        // 5. Obtener URLs de los planos
        const planUrls = technicalPlans.map((plan) => plan.url);

        // 6. Mergear todos los PDFs
        const mergedPdfBytes = await mergePdfs(budgetBuffer, planUrls);

        // 7. Crear el blob final
        finalBlob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], {
          type: "application/pdf",
        });
      } else {
        // Si no hay planos, usar el presupuesto directamente
        finalBlob = budgetBlob;
      }

      // 8. Descargar el PDF
      const url = URL.createObjectURL(finalBlob);
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

  // Contar cuántos planos técnicos PDF hay
  const technicalPlansCount = attachments.filter(
    (a) => a.document_type === "technical_plan" && a.file_type === "pdf",
  ).length;

  return (
    <Button
      size="lg"
      className="gap-2 cursor-pointer "
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {technicalPlansCount > 0 ? "Creando Presupuesto..." : "Creando Presupuesto..."}
        </>
      ) : (
        <>
          {technicalPlansCount > 0 ? (
            <FilePlus className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Descargar Presupuesto
        </>
      )}
    </Button>
  );
}
