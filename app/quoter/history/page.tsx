"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useQuotes, Quote, QuoteStatus } from "@/hooks/use-quotes";
import { Loader2, Plus } from "lucide-react";
import { QuoteTable } from "@/components/quoter/quote-table";
import { QuoteStats } from "@/components/quoter/quote-stats";
import { getExchangeRate, ExchangeRate } from "@/lib/exchange-rate";


const ALLOWED_ROLES = ["admin", "supervisor", "vendedor"];

type SortField = "number" | "client_name" | "status" | "total" | "created_at";

export default function QuoteHistorialPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<QuoteStatus | "all">("all");
  const [activeType, setActiveType] = useState<"sale" | "rental">("sale");
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { quotes, loading, updateStatus, deleteQuote } = useQuotes(
    userProfile?.id ?? "",
    userProfile?.role ?? "supervisor",
    activeFilter === "all" ? undefined : activeFilter,
    activeType,
  );

  // Filtrar por búsqueda y ordenar
  const filteredQuotes = useMemo(() => {
    let result = [...quotes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (quote) =>
          quote.number.toLowerCase().includes(term) ||
          quote.client_name.toLowerCase().includes(term) ||
          (quote.client_company &&
            quote.client_company.toLowerCase().includes(term)),
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "number":
          comparison = a.number.localeCompare(b.number);
          break;
        case "client_name":
          comparison = a.client_name.localeCompare(b.client_name);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "total":
          comparison = a.total - b.total;
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [quotes, searchTerm, sortField, sortOrder]);

  // Paginación
  const totalItems = filteredQuotes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Estadísticas (sobre todas las cotizaciones, no solo las filtradas por búsqueda)
  const totalQuotes = quotes.length;
  const approvedCount = quotes.filter((q) => q.status === "approved").length;
  const approvedRate = totalQuotes > 0 ? (approvedCount / totalQuotes) * 100 : 0;
  const totalApprovedAmount = quotes
    .filter((q) => q.status === "approved")
    .reduce((sum, q) => sum + q.total, 0);
  const pendingQuotes = quotes.filter(
    (q) => q.status === "draft" || q.status === "sent",
  ).length;

  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => {});
  }, []);

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
      toast({ title: `Cotización actualizada` });
    } catch {
      toast({ title: "Error al actualizar estado", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteQuote(id, userProfile!.id, userProfile!.role);
      toast({ title: "Cotización eliminada" });
    } catch {
      toast({ title: "Error al eliminar cotización", variant: "destructive" });
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  }

  function handleTypeChange(type: "sale" | "rental") {
    setActiveType(type);
    setCurrentPage(1);
  }

  function handleFilterChange(value: QuoteStatus | "all") {
    setActiveFilter(value);
    setCurrentPage(1);
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Cotizaciones</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestión del historial de cotizaciones generadas.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/quoter">
              <Plus className="w-4 h-4 mr-2" />
              Nueva cotización
            </Link>
          </Button>
        </div>

        <QuoteStats
          totalQuotes={totalQuotes}
          approvedRate={approvedRate}
          totalApprovedAmount={totalApprovedAmount}
          pendingQuotes={pendingQuotes}
          exchangeRate={exchangeRate}
        />

        <QuoteTable
          quotes={paginatedQuotes}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          activeType={activeType}
          onTypeChange={handleTypeChange}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          role={userProfile.role}
          userId={userProfile.id}
          loading={loading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          exchangeRate={exchangeRate}
        />
      </div>
    </MainLayout>
  );
}
