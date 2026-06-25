"use client";

import { useState } from "react";
import Link from "next/link";
import { useRentalContract } from "@/hooks/use-rental-contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { formatProjectDate } from "@/lib/utils/project-utils";
import { ReturnDialog } from "./return-dialog";
import { useRouter } from "next/navigation";

export function RentalContractDetail({ contractId }: { contractId: string }) {
  const router = useRouter();
  const { contract, loading, error, refetch } = useRentalContract(contractId);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!contract) return <div className="p-6">Contrato no encontrado</div>;

  const isActive = contract.status === "active";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => router.push("/rentals/contracts")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Contrato de Alquiler
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {contract.rental_module?.code} — {contract.rental_module?.name}
            </p>
          </div>
          {isActive && (
            <Button
              variant="default"
              onClick={() => setShowReturnDialog(true)}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Registrar Devolución
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">
              Información del Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge
                variant={
                  isActive
                    ? "default"
                    : contract.status === "returned"
                      ? "secondary"
                      : "destructive"
                }
              >
                {contract.status === "active"
                  ? "Activo"
                  : contract.status === "returned"
                    ? "Devuelto"
                    : contract.status}
              </Badge>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">
                Fecha Inicio
              </span>
              <span className="text-sm text-right">
                {formatProjectDate(contract.start_date)}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Fecha Fin</span>
              <span className="text-sm text-right">
                {formatProjectDate(contract.end_date) || "Indefinido"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Entrega</span>
              <span className="text-sm text-right">
                {formatProjectDate(contract.delivery_date) || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Devolución</span>
              <span className="text-sm text-right">
                {formatProjectDate(contract.return_date) || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">
                Precio Mensual
              </span>
              <span className="text-sm font-medium text-right">
                ${contract.monthly_price} {contract.currency}
              </span>
            </div>

            {contract.delivery_notes && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  Notas de Entrega
                </span>
                <p className="text-sm mt-1">{contract.delivery_notes}</p>
              </div>
            )}
            {contract.return_notes && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  Notas de Devolución
                </span>
                <p className="text-sm mt-1">{contract.return_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Empresa</span>
              <span className="text-sm font-medium text-right">
                {contract.client?.company_name || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">
                Representante
              </span>
              <span className="text-sm text-right">
                {contract.client?.representative || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Teléfono</span>
              <span className="text-sm text-right">
                {contract.client?.phone || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm text-right">
                {contract.client?.email || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">CUIT</span>
              <span className="text-sm text-right">
                {contract.client?.cuit || "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Módulo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Código</span>
              <Link
                href={`/rentals/modules/${contract.rental_module?.id}`}
                className="text-sm text-primary hover:underline text-right"
              >
                {contract.rental_module?.code}
              </Link>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Nombre</span>
              <span className="text-sm text-right">
                {contract.rental_module?.name}
              </span>
            </div>
            {contract.quote && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  Cotización Origen
                </span>
                <p className="text-sm mt-1">
                  <Link
                    href={`/quoter/history`}
                    className="text-primary hover:underline"
                  >
                    {contract.quote.number} — ${contract.quote.total}{" "}
                    {contract.quote.currency}
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showReturnDialog && (
        <ReturnDialog
          contractId={contractId}
          moduleName={contract.rental_module?.name || ""}
          onClose={() => setShowReturnDialog(false)}
          onSuccess={() => {
            setShowReturnDialog(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
