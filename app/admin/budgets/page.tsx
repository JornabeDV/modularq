"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ArrowUpDown, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  PrismaTypedService,
  Budget,
  BudgetStatus,
} from "@/lib/prisma-typed-service";
import {
  getExchangeRate,
  formatUSD,
  formatExchangeRate,
  ExchangeRate,
} from "@/lib/exchange-rate";
import { MainLayout } from "@/components/layout/main-layout";
import { CreateBudgetDialog } from "@/components/budgets";
import { BUDGET_STATUS_LABELS, BUDGET_STATUS_COLORS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusLabels: Record<BudgetStatus, string> =
  BUDGET_STATUS_LABELS as Record<BudgetStatus, string>;

const statusColors: Record<BudgetStatus, string> =
  BUDGET_STATUS_COLORS as Record<BudgetStatus, string>;

type SortField =
  | "created_at"
  | "client_name"
  | "final_price"
  | "status"
  | "budget_code";
type SortOrder = "asc" | "desc";

export default function BudgetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);

  // Eliminación
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [isDeletingBudget, setIsDeletingBudget] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadBudgets();
    loadExchangeRate();
  }, []);

  const loadExchangeRate = async () => {
    const rate = await getExchangeRate();
    setExchangeRate(rate);
  };

  const loadBudgets = async () => {
    try {
      const data = await PrismaTypedService.getAllBudgets();
      setBudgets(data);
    } catch (error) {
      console.error("Error loading budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;

    setIsDeletingBudget(true);
    try {
      await PrismaTypedService.deleteBudget(budgetToDelete.id);
      setBudgets(budgets.filter((b) => b.id !== budgetToDelete.id));
      toast({
        title: "Presupuesto eliminado",
        description: `El presupuesto ${budgetToDelete.budget_code} ha sido eliminado.`,
      });
      setBudgetToDelete(null);
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el presupuesto.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingBudget(false);
    }
  };

  const handleCreateBudget = async (data: {
    client_name: string;
    location: string;
    description: string;
  }) => {
    // Cerrar el modal inmediatamente y mostrar overlay de carga
    setShowCreateDialog(false);
    setIsCreatingBudget(true);

    try {
      const budget = await PrismaTypedService.createBudget(data);
      router.push(`/admin/budgets/${budget.id}?new=true`);
    } catch (error) {
      console.error("Error creating budget:", error);
      toast({
        title: "Error al crear el presupuesto",
        description: "Por favor intenta nuevamente",
        variant: "destructive",
      });
      setIsCreatingBudget(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filtrar presupuestos
  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch =
      searchTerm === "" ||
      budget.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.budget_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || budget.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Ordenar presupuestos
  const sortedBudgets = [...filteredBudgets].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "budget_code":
        comparison = a.budget_code.localeCompare(b.budget_code);
        break;
      case "client_name":
        comparison = a.client_name.localeCompare(b.client_name);
        break;
      case "final_price":
        comparison = a.final_price - b.final_price;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "created_at":
      default:
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Paginar presupuestos
  const totalItems = sortedBudgets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedBudgets = sortedBudgets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Resetear página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Cargando presupuestos...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Presupuestos
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona todos los presupuestos solicitados por los clientes.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Badge variant="outline" className="text-sm px-3 py-1 h-9 flex items-center gap-1 border-none bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Dólar BNA: <span className="font-bold">$1.425</span>
            </Badge>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="inline">Nuevo Presupuesto</span>
            </Button>
          </div>
        </div>

        {/* Tabla de Presupuestos */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Presupuestos</CardTitle>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Buscar por cliente, código o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-background">
                    <TableHead
                      className="cursor-pointer min-w-[120px]"
                      onClick={() => handleSort("budget_code")}
                    >
                      <div className="flex items-center gap-1">
                        Código
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer min-w-[200px]"
                      onClick={() => handleSort("client_name")}
                    >
                      <div className="flex items-center gap-1">
                        Cliente
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer min-w-[120px]"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-1">
                        Estado
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer text-right min-w-[150px]"
                      onClick={() => handleSort("final_price")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Monto
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer min-w-[100px]"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center gap-1">
                        Fecha
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right min-w-[100px]">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBudgets.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchTerm || statusFilter !== "all"
                          ? "No se encontraron presupuestos con ese criterio de búsqueda"
                          : "No hay presupuestos registrados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBudgets.map((budget) => (
                      <TableRow
                        key={budget.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          // Solo navegar si el clic no fue en un botón
                          const target = e.target as HTMLElement;
                          if (!target.closest("button")) {
                            router.push(`/admin/budgets/${budget.id}`);
                          }
                        }}
                      >
                        <TableCell className="font-mono text-sm">
                          {budget.budget_code}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {budget.client_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {budget.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[budget.status]}>
                            {statusLabels[budget.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">
                            {formatCurrency(budget.final_price)}
                          </div>
                          {exchangeRate && (
                            <div className="text-xs text-green-600">
                              {formatUSD(
                                budget.final_price,
                                exchangeRate.venta,
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(budget.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/admin/budgets/${budget.id}`,
                                      );
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver Presupuesto</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setBudgetToDelete(budget);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar Presupuesto</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalItems > 0 && (
              <div className="pt-4 border-t mt-4">
                <DataPagination
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemsPerPageOptions={[5, 10, 20, 50]}
                  itemsText="presupuestos"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateBudgetDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateBudget}
      />

      {/* Overlay de carga fullscreen */}
      {isCreatingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Creando presupuesto...</p>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={!!budgetToDelete}
        onOpenChange={() => setBudgetToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar presupuesto?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar el presupuesto{" "}
              <strong>{budgetToDelete?.budget_code}</strong> de{" "}
              <strong>{budgetToDelete?.client_name}</strong>.
              <br />
              <br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setBudgetToDelete(null)}
              disabled={isDeletingBudget}
            >
              Cancelar
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleDeleteBudget}
              disabled={isDeletingBudget}
            >
              {isDeletingBudget ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
