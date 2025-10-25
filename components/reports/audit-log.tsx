"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye, Calendar, User, Activity } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuditLogs } from "@/hooks/use-audit-logs"

export function AuditLogComponent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [entityFilter, setEntityFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  
  const { auditLogs, loading, error, fetchAuditLogs } = useAuditLogs()
  
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase())
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter
    const matchesUser = userFilter === "all" || log.user_id === userFilter

    return matchesSearch && matchesAction && matchesEntity && matchesUser
  })

  const getActionColor = (action: string) => {
    if (action.includes("creado") || action.includes("completada")) return "default"
    if (action.includes("actualizado") || action.includes("asignado")) return "secondary"
    if (action.includes("eliminado")) return "destructive"
    return "outline"
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "project":
        return "📁"
      case "task":
        return "✓"
      case "operario":
        return "👤"
      case "time-entry":
        return "⏱️"
      default:
        return "📄"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatChanges = (changes?: Record<string, { from: any; to: any }>) => {
    if (!changes) return null

    return Object.entries(changes).map(([field, change]) => (
      <div key={field} className="text-xs text-muted-foreground">
        <span className="font-medium">{field}:</span> {String(change.from)} → {String(change.to)}
      </div>
    ))
  }

  return (
    <TooltipProvider>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Registro de Auditoría
            </CardTitle>
            <CardDescription>Historial completo de actividades del sistema</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en auditoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              <SelectItem value="creado">Creado</SelectItem>
              <SelectItem value="actualizado">Actualizado</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="asignado">Asignado</SelectItem>
              <SelectItem value="registrado">Registrado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las entidades</SelectItem>
              <SelectItem value="project">Proyectos</SelectItem>
              <SelectItem value="task">Tareas</SelectItem>
              <SelectItem value="operario">Operarios</SelectItem>
              <SelectItem value="time-entry">Tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audit Log Entries */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando logs de auditoría...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Error al cargar logs</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchAuditLogs} variant="outline">
                Reintentar
              </Button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron registros</h3>
              <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-lg">{getEntityIcon(log.entity_type)}</div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                        <span className="text-sm font-medium">{log.entity_name}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{log.user_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatTimestamp(log.created_at)}</span>
                        </div>
                        {log.ip_address && <span className="text-xs">IP: {log.ip_address}</span>}
                      </div>

                      {log.changes && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                          <div className="font-medium text-muted-foreground">Cambios:</div>
                          {formatChanges(log.changes)}
                        </div>
                      )}
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="cursor-pointer">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver detalles</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {filteredLogs.length} de {auditLogs.length} registros
            </span>
            <span>
              Última actualización: {formatTimestamp(auditLogs[0]?.created_at || new Date().toISOString())}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}