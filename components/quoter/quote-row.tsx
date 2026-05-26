"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  Copy,
  Pencil,
  Trash2,
  ChevronDown,
  FileX,
  FolderPlus,
} from "lucide-react";
import Link from "next/link";
import type { Quote, QuoteStatus } from "@/hooks/use-quotes";
import { ExchangeRate, arsToUsd } from "@/lib/exchange-rate";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Vencida",
};

const STATUS_VARIANTS: Record<
  QuoteStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  draft: "secondary",
  sent: "default",
  approved: "default",
  rejected: "destructive",
  expired: "outline",
};

const NEXT_STATUSES: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent"],
  sent: ["approved", "rejected"],
  approved: [],
  rejected: [],
  expired: [],
};

interface QuoteRowProps {
  quote: Quote;
  onStatusChange: (id: string, status: QuoteStatus) => Promise<void>;
  onDeleteClick: (quote: Quote) => void;
  role: string;
  userId: string;
  exchangeRate: ExchangeRate | null;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function QuoteRow({
  quote,
  onStatusChange,
  onDeleteClick,
  role,
  userId,
  exchangeRate,
}: QuoteRowProps) {
  const nextStatuses = NEXT_STATUSES[quote.status];
  const canChangeStatus =
    (role === "admin" || quote.status === "draft" || quote.status === "sent") &&
    nextStatuses.length > 0;

  const canDelete =
    role === "admin" ||
    role === "supervisor" ||
    (role === "vendedor" &&
      quote.created_by === userId &&
      quote.status === "draft");

  const canEdit = quote.status === "draft";

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium tabular-nums">{quote.number}</TableCell>
      <TableCell>
        <div className="flex gap-1.5">
          <Badge
            variant={quote.quote_type === "rental" ? "secondary" : "outline"}
            className="text-xs"
          >
            {quote.quote_type === "rental" ? "Alquiler" : "Venta"}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs"
          >
            {quote.currency === 'ARS' ? 'ARS' : 'USD'}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{quote.client_name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={quote.status === 'draft' && quote.pdf_url ? 'default' : STATUS_VARIANTS[quote.status]}
          className="text-xs"
        >
          {quote.status === 'draft'
            ? (quote.pdf_url ? 'Borrador · PDF listo' : 'Borrador')
            : STATUS_LABELS[quote.status]}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="tabular-nums font-semibold">
            {exchangeRate ? formatUSD(quote.total, exchangeRate.venta) : "—"}
          </span>
          {exchangeRate && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {formatARS(quote.total)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDate(quote.created_at)}
        {quote.valid_until && (
          <span className="block text-xs">
            Vence {formatDate(quote.valid_until)}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <TooltipProvider>
          <div className="flex justify-end gap-1.5">
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    asChild
                  >
                    <Link href={`/quoter?edit=${quote.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer"
                  asChild
                >
                  <Link href={`/quoter?duplicate=${quote.id}`}>
                    <Copy className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicar</p>
              </TooltipContent>
            </Tooltip>

            {quote.pdf_url ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    asChild
                  >
                    <a
                      href={quote.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Descargar PDF</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-not-allowed opacity-50"
                    disabled
                  >
                    <FileX className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sin PDF generado</p>
                </TooltipContent>
              </Tooltip>
            )}

            {canChangeStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs cursor-pointer"
                  >
                    Estado
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {nextStatuses.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      className="cursor-pointer"
                      onClick={() => onStatusChange(quote.id, s)}
                    >
                      Marcar como {STATUS_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {quote.status === 'approved' && !quote.has_project && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    asChild
                  >
                    <Link href={`/admin/projects?quoteId=${quote.id}`}>
                      <FolderPlus className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Crear proyecto</p>
                </TooltipContent>
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={() => onDeleteClick(quote)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Eliminar</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
}
