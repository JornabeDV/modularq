"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getExchangeRate, ExchangeRate, arsToUsd } from "@/lib/exchange-rate";

interface QuoteInfo {
  id: string;
  number: string;
  quoteType: string;
  status: string;
  clientName: string;
  total: number;
  totalArs?: number | null;
  currency?: string;
  exchangeRate?: number;
  pdfUrl?: string;
}

interface ProjectQuoteCardProps {
  quotes?: QuoteInfo[];
}

function formatUSD(amount: number, rate: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(arsToUsd(amount, rate));
}

function formatARS(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}

function QuoteRow({ quote, todayRate }: { quote: QuoteInfo; todayRate: number }) {
  const isNewSemantic = quote.totalArs != null;

  const renderAmount = () => {
    if (isNewSemantic) {
      if (quote.currency === 'ARS') {
        return (
          <>
            <span className="text-sm font-bold tabular-nums">{formatARS(quote.total)}</span>
            {todayRate > 0 && (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {formatUSD(quote.total, todayRate)}
              </span>
            )}
          </>
        );
      }
      return (
        <>
          <span className="text-sm sm:text-base font-bold tabular-nums">{formatUSD(quote.total, 1)}</span>
          {todayRate > 0 && (
            <span className="text-xs sm:text-sm text-muted-foreground tabular-nums">
              {formatARS(quote.total * todayRate)}
            </span>
          )}
        </>
      );
    }
    // Vieja semántica
    const rate = quote.exchangeRate ?? todayRate ?? 0;
    if (rate > 0) {
      return (
        <>
          <span className="text-sm sm:text-base font-bold tabular-nums">{formatUSD(quote.total, rate)}</span>
          <span className="text-xs sm:text-sm text-muted-foreground tabular-nums">{formatARS(quote.total)}</span>
        </>
      );
    }
    return <span className="text-sm font-bold tabular-nums">{formatARS(quote.total)}</span>;
  };

  return (
    <div className="border-b last:border-b-0 pb-4 last:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{quote.number}</span>
          <Badge variant={quote.quoteType === "rental" ? "secondary" : "outline"} className="text-xs">
            {quote.quoteType === "rental" ? "Alquiler" : "Venta"}
          </Badge>
        </div>
        <div className="flex flex-col items-end">
          {renderAmount()}
        </div>
      </div>

      <div className="text-sm text-muted-foreground mt-1">
        Cliente: <span className="text-foreground">{quote.clientName}</span>
      </div>

      <div className="flex gap-2 pt-2">
        {quote.pdfUrl && (
          <Button variant="outline" size="sm" className="h-8" asChild>
            <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Ver PDF
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8" asChild>
          <Link href="/quoter/history">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Ver cotización
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function ProjectQuoteCard({ quotes }: ProjectQuoteCardProps) {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);

  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => {});
  }, []);

  const todayRate = exchangeRate?.venta ?? 0;
  const validQuotes = quotes?.filter(Boolean) ?? [];

  if (validQuotes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Cotizaciones Asociadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este proyecto no tiene cotizaciones asociadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-primary" />
          Cotizaciones Asociadas ({validQuotes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validQuotes.map((quote) => (
          <QuoteRow key={quote.id} quote={quote} todayRate={todayRate} />
        ))}
      </CardContent>
    </Card>
  );
}
