"use client"

import { useState } from "react"
import Link from "next/link"
import { useRentalContract } from "@/hooks/use-rental-contracts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { formatProjectDate } from "@/lib/utils/project-utils"
import { ReturnDialog } from "./return-dialog"
import { useRouter } from "next/navigation"

export function RentalContractDetail({ contractId }: { contractId: string }) {
  const router = useRouter()
  const { contract, loading, error, refetch } = useRentalContract(contractId)
  const [showReturnDialog, setShowReturnDialog] = useState(false)

  if (loading) return <div className="p-6">Cargando...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (!contract) return <div className="p-6">Contrato no encontrado</div>

  const isActive = contract.status === "active"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/rentals/contracts")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Contrato de Alquiler</h1>
            <p className="text-muted-foreground">
              {contract.rental_module?.code} — {contract.rental_module?.name}
            </p>
          </div>
        </div>
        {isActive && (
          <Button variant="default" onClick={() => setShowReturnDialog(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Registrar Devolución
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Información del Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge variant={isActive ? "default" : contract.status === "returned" ? "secondary" : "destructive"}>
                {contract.status === "active" ? "Activo" : contract.status === "returned" ? "Devuelto" : contract.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fecha Inicio</span>
              <span className="text-sm">{formatProjectDate(contract.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fecha Fin</span>
              <span className="text-sm">{formatProjectDate(contract.end_date) || "Indefinido"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Entrega</span>
              <span className="text-sm">{formatProjectDate(contract.delivery_date) || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Devolución</span>
              <span className="text-sm">{formatProjectDate(contract.return_date) || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Precio Mensual</span>
              <span className="text-sm font-medium">${contract.monthly_price} {contract.currency}</span>
            </div>

            {contract.delivery_notes && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">Notas de Entrega</span>
                <p className="text-sm mt-1">{contract.delivery_notes}</p>
              </div>
            )}
            {contract.return_notes && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">Notas de Devolución</span>
                <p className="text-sm mt-1">{contract.return_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Empresa</span>
              <span className="text-sm font-medium">{contract.client?.company_name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Representante</span>
              <span className="text-sm">{contract.client?.representative || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Teléfono</span>
              <span className="text-sm">{contract.client?.phone || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{contract.client?.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">CUIT</span>
              <span className="text-sm">{contract.client?.cuit || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Módulo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Código</span>
              <Link href={`/rentals/modules/${contract.rental_module?.id}`} className="text-sm text-primary hover:underline">
                {contract.rental_module?.code}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nombre</span>
              <span className="text-sm">{contract.rental_module?.name}</span>
            </div>
            {contract.quote && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">Cotización Origen</span>
                <p className="text-sm mt-1">
                  <Link href={`/quoter/history`} className="text-primary hover:underline">
                    {contract.quote.number} — ${contract.quote.total} {contract.quote.currency}
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
            setShowReturnDialog(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
