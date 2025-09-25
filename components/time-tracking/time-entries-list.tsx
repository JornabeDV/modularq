"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Calendar, Edit, Trash2 } from "lucide-react"
import { mockTimeEntries, mockTasks, mockProjects, mockOperarios } from "@/lib/mock-data"

interface TimeEntriesListProps {
  operarioId?: string
  limit?: number
  showOperario?: boolean
}

export function TimeEntriesList({ operarioId, limit, showOperario = false }: TimeEntriesListProps) {
  let entries = mockTimeEntries

  if (operarioId) {
    entries = entries.filter((entry) => entry.operarioId === operarioId)
  }

  if (limit) {
    entries = entries.slice(0, limit)
  }

  // Sort by date descending
  entries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTimeRange = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })

    if (!endTime) return `${start} - En curso`

    const end = new Date(endTime).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })

    return `${start} - ${end}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Registro de Tiempo
        </CardTitle>
        <CardDescription>
          {operarioId ? "Tus registros de tiempo recientes" : "Registros de tiempo del equipo"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay registros de tiempo</h3>
            <p className="text-muted-foreground">
              {operarioId ? "Aún no has registrado tiempo en ninguna tarea" : "No hay registros de tiempo disponibles"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const task = mockTasks.find((t) => t.id === entry.taskId)
              const project = mockProjects.find((p) => p.id === entry.projectId)
              const operario = mockOperarios.find((o) => o.id === entry.operarioId)

              return (
                <div key={entry.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task?.title || "Tarea desconocida"}</h4>
                        <Badge variant="outline" className="text-xs">
                          {project?.name || "Proyecto desconocido"}
                        </Badge>
                      </div>

                      {showOperario && operario && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {operario.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{operario.name}</span>
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground">{entry.description}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(entry.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeRange(entry.startTime, entry.endTime)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatTime(entry.hours)}</div>
                        <div className="text-xs text-muted-foreground">Tiempo total</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
