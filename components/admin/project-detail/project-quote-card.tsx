"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ProjectQuoteCardProps {
  quote?: {
    id: string;
    number: string;
    quoteType: string;
    status: string;
    clientName: string;
    total: number;
    currency?: string;
    pdfUrl?: string;
  };
}

function formatCurrency(value: number, currency?: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency || "ARS",
    minimumFractionDigits: 0,
  }).format(value);
}

export function ProjectQuoteCard({ quote }: ProjectQuoteCardProps) {
  if (!quote) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Cotización Asociada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este proyecto no tiene una cotización asociada.
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
          Cotización Asociada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{quote.number}</span>
            <Badge variant={quote.quoteType === "rental" ? "secondary" : "outline"} className="text-xs">
              {quote.quoteType === "rental" ? "Alquiler" : "Venta"}
            </Badge>
          </div>
          <span className="text-sm font-bold tabular-nums">
            {formatCurrency(quote.total, quote.currency)}
          </span>
        </div>

        <div className="text-sm text-muted-foreground">
          Cliente: <span className="text-foreground">{quote.clientName}</span>
        </div>

        <div className="flex gap-2 pt-1">
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
              Ver cotizaciones
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
