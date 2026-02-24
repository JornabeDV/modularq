"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PrismaTypedService,
  Budget,
  BudgetStatus,
} from "@/lib/prisma-typed-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Send,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  getExchangeRate,
  formatUSD,
  formatExchangeRate,
  ExchangeRate,
} from "@/lib/exchange-rate";
import { MainLayout } from "@/components/layout/main-layout";
import { CreateBudgetDialog } from "@/components/budgets";
import { BUDGET_STATUS_LABELS, BUDGET_STATUS_COLORS } from "@/lib/constants";

const statusLabels: Record<BudgetStatus, string> =
  BUDGET_STATUS_LABELS as Record<BudgetStatus, string>;

const statusColors: Record<BudgetStatus, string> =
  BUDGET_STATUS_COLORS as Record<BudgetStatus, string>;

export default function BudgetsPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

  const handleCreateBudget = async (data: {
    client_name: string;
    location: string;
    description: string;
  }) => {
    try {
      const budget = await PrismaTypedService.createBudget(data);
      router.push(`/admin/budgets/${budget.id}`);
    } catch (error) {
      console.error("Error creating budget:", error);
      alert("Error al crear el presupuesto");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-AR");
  };

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
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los presupuestos de módulos habitacionales
            </p>
          </div>
          <div className="flex items-center gap-4">
            {exchangeRate && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Dólar BNA</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {formatExchangeRate(exchangeRate)}
                  </p>
                </div>
              </div>
            )}
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {budgets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay presupuestos creados. Crea el primero para comenzar.
              </CardContent>
            </Card>
          ) : (
            budgets.map((budget) => (
              <Card
                key={budget.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <span className="font-mono text-sm text-muted-foreground">
                          {budget.budget_code}
                        </span>
                        <Badge className={statusColors[budget.status]}>
                          {statusLabels[budget.status]}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold">
                        {budget.client_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {budget.location} •{" "}
                        {budget.description || "Sin descripción"}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-2xl font-bold">
                        {formatCurrency(budget.final_price)}
                      </p>
                      {exchangeRate && (
                        <p className="text-sm font-medium text-green-600">
                          {formatUSD(budget.final_price, exchangeRate.venta)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Creado: {formatDate(budget.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>
                        Costos directos:{" "}
                        {formatCurrency(budget.subtotal_direct_costs)}
                      </span>
                      <span>
                        Precio calculado:{" "}
                        {formatCurrency(budget.calculated_price)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/admin/budgets/${budget.id}`}>
                        <Button variant="outline" size="sm">
                          Ver detalle
                        </Button>
                      </Link>

                      {budget.status === "draft" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              /* TODO: Enviar */
                            }}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Enviar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              /* TODO: Aprobar */
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                        </>
                      )}

                      {budget.status === "sent" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              /* TODO: Rechazar */
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              /* TODO: Aprobar */
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                        </>
                      )}

                      {budget.project_id && (
                        <Link href={`/admin/projects/${budget.project_id}`}>
                          <Button variant="outline" size="sm">
                            Ver Proyecto
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <CreateBudgetDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateBudget}
      />
    </MainLayout>
  );
}
