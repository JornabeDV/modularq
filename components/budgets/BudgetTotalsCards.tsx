"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Totals {
  subtotal_direct_costs: number;
  subtotal_with_expenses: number;
  subtotal_with_benefit: number;
  final_price: number;
  hasChanges: boolean;
}

interface BudgetTotalsCardsProps {
  totals: Totals;
  generalExpensesPct: number;
  benefitPct: number;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
}

export function BudgetTotalsCards({
  totals,
  generalExpensesPct,
  benefitPct,
}: BudgetTotalsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Costos Directos
            {totals.hasChanges && (
              <span className="text-xs text-muted-foreground/70">
                (preview)
              </span>
            )}
          </p>
          <p className="text-base sm:text-xl font-bold">
            {formatCurrency(totals.subtotal_direct_costs)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gastos Generales ({generalExpensesPct}%)
          </p>
          <p className="text-base sm:text-xl font-bold">
            {formatCurrency(
              totals.subtotal_direct_costs * (generalExpensesPct / 100),
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Beneficio ({benefitPct}%)
          </p>
          <p className="text-base sm:text-xl font-bold">
            {formatCurrency(
              totals.subtotal_with_benefit - totals.subtotal_with_expenses,
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Precio Final</p>
          <p className="text-base sm:text-2xl font-bold text-green-600">
            {formatCurrency(totals.final_price)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
