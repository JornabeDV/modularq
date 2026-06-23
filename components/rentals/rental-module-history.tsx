"use client"

import { useRentalModule } from "@/hooks/use-rental-modules"
import { useRentalContracts } from "@/hooks/use-rental-contracts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowLeft, Eye } from "lucide-react"
import { formatProjectDate } from "@/lib/utils/project-utils"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function RentalModuleHistory({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  const { module, loading: moduleLoading, error: moduleError } = useRentalModule(moduleId)
  const { contracts, loading: contractsLoading, error: contractsError, fetchContracts } = useRentalContracts()

  useEffect(() => {
    fetchContracts({ rental_module_id: moduleId })
  }, [fetchContracts, moduleId])

  const loading = moduleLoading || contractsLoading
  const error = moduleError || contractsError

  if (loading) return <div className="p-6">Cargando...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (!module) return <div className="p-6">Módulo no encontrado</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push(`/rentals/modules/${moduleId}`)} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Historial de Alquileres</h1>
          <p className="text-muted-foreground">
            {module.code} — {module.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {contracts.length} contrato{contracts.length === 1 ? "" : "s"} registrado{contracts.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Finalización</TableHead>
                    <TableHead>Devolución</TableHead>
                    <TableHead>Precio Mensual</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/rentals/contracts/${c.id}`)}
                    >
                      <TableCell>{c.client?.company_name || "—"}</TableCell>
                      <TableCell>{formatProjectDate(c.start_date)}</TableCell>
                      <TableCell>{formatProjectDate(c.delivery_date)}</TableCell>
                      <TableCell>{formatProjectDate(c.end_date)}</TableCell>
                      <TableCell>{formatProjectDate(c.return_date)}</TableCell>
                      <TableCell>${c.monthly_price} {c.currency}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "active" ? "default" : c.status === "returned" ? "secondary" : "destructive"}>
                          {c.status === "active" ? "Activo" : c.status === "returned" ? "Devuelto" : c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 cursor-pointer"
                                onClick={() => router.push(`/rentals/contracts/${c.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver contrato</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Sin historial de alquileres</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
