"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useQuotes, Quote, QuoteStatus } from "@/hooks/use-quotes";
import {
  Download,
  Plus,
  ChevronDown,
  Loader2,
  FileText,
} from "lucide-react";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Vencida",
};

const STATUS_VARIANTS: Record<QuoteStatus, "secondary" | "default" | "outline" | "destructive"> = {
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

const ALLOWED_ROLES = ["admin", "supervisor", "vendedor"];
const FILTERS: { label: string; value: QuoteStatus | "all" }[] = [
  { label: "Todas", value: "all" },
  { label: "Borrador", value: "draft" },
  { label: "Enviadas", value: "sent" },
  { label: "Aprobadas", value: "approved" },
  { label: "Rechazadas", value: "rejected" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function QuoteCard({
  quote,
  onStatusChange,
  role,
}: {
  quote: Quote;
  onStatusChange: (id: string, status: QuoteStatus) => Promise<void>;
  role: string;
}) {
  const nextStatuses = NEXT_STATUSES[quote.status];
  const canChangeStatus =
    (role === "admin" || quote.status === "draft" || quote.status === "sent") &&
    nextStatuses.length > 0;

  return (
    <Card className="md:py-3">
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm tabular-nums">
                {quote.number}
              </span>
              <Badge variant={STATUS_VARIANTS[quote.status]} className="text-xs">
                {STATUS_LABELS[quote.status]}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-0.5 truncate">{quote.client_name}</p>
            {quote.client_company && (
              <p className="text-xs text-muted-foreground truncate">
                {quote.client_company}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(quote.created_at)}
              {quote.valid_until && (
                <span className="ml-2">· Vence {formatDate(quote.valid_until)}</span>
              )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="font-bold tabular-nums text-sm">
              {formatCurrency(quote.total)}
            </span>
            <div className="flex items-center gap-1.5">
              {quote.pdf_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  asChild
                >
                  <a href={quote.pdf_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3 h-3 mr-1" />
                    PDF
                  </a>
                </Button>
              )}
              {canChangeStatus && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs cursor-pointer">
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuoteHistorialPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<QuoteStatus | "all">("all");

  const { quotes, loading, updateStatus } = useQuotes(
    userProfile?.id ?? "",
    userProfile?.role ?? "supervisor",
    activeFilter === "all" ? undefined : activeFilter
  );

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ALLOWED_ROLES.includes(userProfile.role)) {
    router.push("/dashboard");
    return null;
  }

  async function handleStatusChange(id: string, status: QuoteStatus) {
    try {
      await updateStatus(id, status);
      toast({ title: `Cotización marcada como ${STATUS_LABELS[status]}` });
    } catch {
      toast({ title: "Error al actualizar estado", variant: "destructive" });
    }
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cotizaciones</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Historial de cotizaciones generadas.
            </p>
          </div>
          <Button asChild>
            <Link href="/quoter">
              <Plus className="w-4 h-4 mr-2" />
              Nueva cotización
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={activeFilter === f.value ? "default" : "outline"}
              size="sm"
              className="cursor-pointer"
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : quotes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground text-sm">
                {activeFilter === "all"
                  ? "No hay cotizaciones todavía."
                  : `No hay cotizaciones con estado "${STATUS_LABELS[activeFilter]}".`}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/quoter">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear cotización
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {quotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onStatusChange={handleStatusChange}
                role={userProfile.role}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
