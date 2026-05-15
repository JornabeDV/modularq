"use client";

import { Card } from "@/components/ui/card";
import { FileText, CheckCircle, DollarSign, Clock } from "lucide-react";

interface QuoteStatsProps {
  totalQuotes: number;
  approvedRate: number;
  totalApprovedAmount: number;
  pendingQuotes: number;
}

export function QuoteStats({
  totalQuotes,
  approvedRate,
  totalApprovedAmount,
  pendingQuotes,
}: QuoteStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Cotizaciones</p>
            <p className="text-lg sm:text-xl font-bold">{totalQuotes}</p>
          </div>
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Tasa de Aprobación</p>
            <p
              className={`text-lg sm:text-xl font-bold ${
                approvedRate >= 50
                  ? "text-green-600"
                  : approvedRate >= 25
                    ? "text-yellow-600"
                    : ""
              }`}
            >
              {approvedRate.toFixed(1)}%
            </p>
          </div>
          <CheckCircle
            className={`h-4 w-4 sm:h-5 sm:w-5 ${
              approvedRate >= 50
                ? "text-green-600"
                : approvedRate >= 25
                  ? "text-yellow-600"
                  : "text-muted-foreground"
            }`}
          />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              Monto Total Aprobado
            </p>
            <p className="text-lg sm:text-xl font-bold">
              $
              {totalApprovedAmount.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              Cotizaciones Pendientes
            </p>
            <p
              className={`text-lg sm:text-xl font-bold ${
                pendingQuotes > 0 ? "text-yellow-600" : ""
              }`}
            >
              {pendingQuotes}
            </p>
          </div>
          <Clock
            className={`h-4 w-4 sm:h-5 sm:w-5 ${
              pendingQuotes > 0 ? "text-yellow-600" : "text-muted-foreground"
            }`}
          />
        </div>
      </Card>
    </div>
  );
}
