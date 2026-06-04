"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, Download, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PriceInput } from "@/components/ui/price-input";
import { formatExchangeRate, type ExchangeRate } from "@/lib/exchange-rate";
import { parsePriceInput } from "@/lib/quote-utils";
import type { QuoteItemState } from "@/components/cotizador/QuoteItemCard";
import type { Client } from "@/hooks/use-clients-prisma";

interface ResumenCardProps {
  quoteItems: QuoteItemState[];
  subtotal: number;
  finalTotal: number;
  exchangeRate: ExchangeRate | null;
  currency: 'ARS' | 'USD';
  generating: boolean;
  savingDraft: boolean;
  selectedClient: Client | null;
  savedQuote: { id: string; number: string } | null;
  onGeneratePDF: () => void;
  onSaveDraft: () => void;
  onUpdateFinalTotal: (value: number) => void;
}

export function ResumenCard({
  quoteItems,
  subtotal,
  finalTotal,
  exchangeRate,
  currency,
  generating,
  savingDraft,
  selectedClient,
  savedQuote,
  onGeneratePDF,
  onSaveDraft,
  onUpdateFinalTotal,
}: ResumenCardProps) {
  const hasAdjustment = finalTotal !== subtotal;
  const rate = exchangeRate?.venta ?? 0;

  const primary = finalTotal;
  const secondary = currency === 'USD' && rate > 0 ? primary * rate : currency === 'ARS' && rate > 0 ? primary / rate : 0;

  const [primaryInput, setPrimaryInput] = useState(
    primary === 0 ? "" : primary.toFixed(2).replace(".", ","),
  );

  const ivaPrimary = primary * 0.21;
  const totalConIvaPrimary = primary * 1.21;
  const ivaSecondary = secondary * 0.21;
  const totalConIvaSecondary = secondary * 1.21;

  useEffect(() => {
    setPrimaryInput(primary === 0 ? "" : primary.toFixed(2).replace(".", ","));
  }, [primary]);

  const fmtARS = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(n);

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);

  const fmtPrimary = currency === 'USD' ? fmtUSD : fmtARS;
  const fmtSecondary = currency === 'USD' ? fmtARS : fmtUSD;

  const primaryLabel = currency === 'USD' ? 'USD' : 'ARS';
  const secondaryLabel = currency === 'USD' ? 'ARS' : 'USD';

  return (
    <Card>
      <CardContent className="space-y-4">
        {exchangeRate && (
          <div className="flex justify-end">
            <Badge
              variant="outline"
              className="text-xs px-2 py-1 border-none bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              Dólar BNA: {formatExchangeRate(exchangeRate)}
            </Badge>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Ítems seleccionados</span>
          <span className="font-semibold">{quoteItems.length}</span>
        </div>
        <div className="flex justify-between items-center border-t pt-3">
          <span className="text-sm text-muted-foreground">Subtotal calculado</span>
          {rate > 0 ? (
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium tabular-nums">{fmtPrimary(subtotal)}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{fmtSecondary(currency === 'USD' ? subtotal * rate : subtotal / rate)}</span>
            </div>
          ) : (
            <span className="text-sm font-medium tabular-nums">{fmtPrimary(subtotal)}</span>
          )}
        </div>
        {hasAdjustment && (
          <p className="text-xs text-muted-foreground text-right">
            Diferencia: {fmtPrimary(finalTotal - subtotal)}
          </p>
        )}

        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-center gap-3">
            <span className="font-semibold whitespace-nowrap text-sm">Subtotal sin IVA ({primaryLabel})</span>
            <div className="flex items-center gap-2">
              <PriceInput
                className={`w-32 text-right text-sm font-bold tabular-nums border rounded px-2 py-1 ${
                  hasAdjustment ? "border-primary bg-primary/5" : ""
                }`}
                value={primaryInput}
                onChange={(val) => setPrimaryInput(val)}
                onBlur={() => {
                  const parsed = parsePriceInput(primaryInput);
                  setPrimaryInput(parsed.toFixed(2).replace(".", ","));
                  onUpdateFinalTotal(parsed);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
              />
            </div>
          </div>
          {secondary > 0 && (
            <div className="flex justify-between items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Equivalente ({secondaryLabel})</span>
              <span className="text-sm font-medium tabular-nums text-muted-foreground">{fmtSecondary(secondary)}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-muted-foreground">IVA 21%</span>
            {rate > 0 ? (
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium tabular-nums">{fmtPrimary(ivaPrimary)}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{fmtSecondary(ivaSecondary)}</span>
              </div>
            ) : (
              <span className="text-sm font-medium tabular-nums">{fmtPrimary(ivaPrimary)}</span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center gap-3 bg-muted/40 rounded-lg px-3 py-2">
          <span className="font-bold whitespace-nowrap text-sm">Total con IVA</span>
          {rate > 0 ? (
            <div className="flex flex-col items-end">
              <span className="text-base font-bold tabular-nums">{fmtPrimary(totalConIvaPrimary)}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{fmtSecondary(totalConIvaSecondary)}</span>
            </div>
          ) : (
            <span className="text-base font-bold tabular-nums">{fmtPrimary(totalConIvaPrimary)}</span>
          )}
        </div>

        <Button
          className="w-full cursor-pointer"
          onClick={onSaveDraft}
          disabled={savingDraft || generating || !selectedClient || quoteItems.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          {savingDraft ? "Guardando..." : "Guardar borrador"}
        </Button>

        <Button
          className="w-full cursor-pointer"
          variant="secondary"
          onClick={onGeneratePDF}
          disabled={generating || !savedQuote || quoteItems.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          {generating ? "Generando PDF..." : "Generar PDF"}
        </Button>
        {savedQuote && (
          <div className="rounded-lg border bg-muted/40 px-3 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Guardada como</span>
              <Badge variant="secondary">{savedQuote.number}</Badge>
            </div>
            <Link
              href="/quoter/history"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <History className="w-3 h-3" />
              Ver historial de cotizaciones
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
