"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRentalModules } from "@/hooks/use-rental-modules"
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
import { Search, Eye, Package, CheckCircle, Truck, Wrench, MapPin, History } from "lucide-react"
import { formatProjectDate } from "@/lib/utils/project-utils"
import { useToast } from "@/hooks/use-toast"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-emerald-100 text-emerald-700" },
  rented: { label: "En Alquiler", color: "bg-blue-100 text-blue-700" },
  maintenance: { label: "Mantenimiento", color: "bg-amber-100 text-amber-700" },
  retired: { label: "Dado de Baja", color: "bg-gray-100 text-gray-700" },
}

const LOCATION_LABELS: Record<string, string> = {
  factory: "Fábrica",
  destination: "En destino",
}

export function RentalModulesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { modules, loading, error, updateModule } = useRentalModules()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [updatingLocationId, setUpdatingLocationId] = useState<string | null>(null)

  const handleLocationChange = async (moduleId: string, newLocation: string) => {
    setUpdatingLocationId(moduleId)
    try {
      await updateModule(moduleId, { location: newLocation as "factory" | "destination" })
      toast({ title: "Ubicación actualizada", description: `El módulo ahora está ${newLocation === "factory" ? "en fábrica" : "en destino"}.` })
    } catch (err) {
      console.error("Error actualizando ubicación:", err)
      toast({ title: "Error", description: "No se pudo actualizar la ubicación.", variant: "destructive" })
    } finally {
      setUpdatingLocationId(null)
    }
  }

  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.project?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: modules.length,
    available: modules.filter((m) => m.status === "available").length,
    rented: modules.filter((m) => m.status === "rented").length,
    maintenance: modules.filter((m) => m.status === "maintenance").length,
    destination: modules.filter((m) => m.location === "destination").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Módulos de Alquiler</h1>
          <p className="text-muted-foreground">Gestión de activos en alquiler</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/rentals/contracts")}>
          <History className="h-4 w-4 mr-2" />
          Historial de Contratos
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Disponibles</p>
                <p className="text-xl font-bold">{stats.available}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En Alquiler</p>
                <p className="text-xl font-bold">{stats.rented}</p>
              </div>
              <Truck className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Mantenimiento</p>
                <p className="text-xl font-bold">{stats.maintenance}</p>
              </div>
              <Wrench className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En Destino</p>
                <p className="text-xl font-bold">{stats.destination}</p>
              </div>
              <MapPin className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-4">
          <div>
            <CardTitle className="text-lg font-semibold">Módulos de Alquiler</CardTitle>
            <p className="text-sm text-muted-foreground">Lista de todos los módulos de alquiler registrados</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o proyecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="rented">En Alquiler</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="retired">Dado de Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando módulos...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : filteredModules.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No se encontraron módulos</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Cliente Actual</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModules.map((m) => {
                    const statusInfo = STATUS_LABELS[m.status] || { label: m.status, color: "" }
                    return (
                      <TableRow
                        key={m.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/rentals/modules/${m.id}`)}
                      >
                        <TableCell className="font-medium">{m.code}</TableCell>
                        <TableCell>{m.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={m.location}
                            onValueChange={(v) => handleLocationChange(m.id, v)}
                            disabled={updatingLocationId === m.id}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="factory">Fábrica</SelectItem>
                              <SelectItem value="destination">En destino</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {m.current_contract?.client?.company_name || "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer">
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
