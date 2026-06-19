"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRentalContracts } from "@/hooks/use-rental-contracts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Search, Eye, ArrowLeft } from "lucide-react"
import { formatProjectDate } from "@/lib/utils/project-utils"

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Activo", variant: "default" },
  returned: { label: "Devuelto", variant: "secondary" },
  overdue: { label: "Vencido", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
}

export function RentalContractsPage() {
  const router = useRouter()
  const { contracts, loading, error, refetch } = useRentalContracts()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.rental_module?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.rental_module?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/rentals/modules")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Contratos de Alquiler</h1>
          <p className="text-muted-foreground">Historial y seguimiento de contratos</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por módulo o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="returned">Devuelto</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando contratos...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : filteredContracts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No se encontraron contratos</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Finalización</TableHead>
                    <TableHead>Precio Mensual</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((c) => {
                    const statusInfo = STATUS_LABELS[c.status] || { label: c.status, variant: "outline" }
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/rentals/contracts/${c.id}`)}
                      >
                        <TableCell className="font-medium">
                          {c.rental_module?.code} — {c.rental_module?.name}
                        </TableCell>
                        <TableCell>{c.client?.company_name || "—"}</TableCell>
                        <TableCell>{formatProjectDate(c.start_date)}</TableCell>
                        <TableCell>{formatProjectDate(c.delivery_date)}</TableCell>
                        <TableCell>{formatProjectDate(c.end_date)}</TableCell>
                        <TableCell>${c.monthly_price} {c.currency}</TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-9 cursor-pointer">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
