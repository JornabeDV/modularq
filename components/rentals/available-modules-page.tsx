"use client"

import Link from "next/link"
import { useRentalModules } from "@/hooks/use-rental-modules"
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
import { Truck, Eye, Plus } from "lucide-react"
import { formatProjectDate } from "@/lib/utils/project-utils"

export function AvailableModulesPage() {
  const { modules, loading, error } = useRentalModules()
  const availableModules = modules.filter((m) => m.status === "available")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Módulos Disponibles</h1>
          <p className="text-muted-foreground">Activos listos para nuevo alquiler</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {availableModules.length} {availableModules.length === 1 ? "módulo disponible" : "módulos disponibles"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : availableModules.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay módulos disponibles actualmente
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Dimensiones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableModules.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.code}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.height}m × {m.width}m × {m.depth}m</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/rentals/modules/${m.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/rentals/modules/${m.id}`}>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Alquilar
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
