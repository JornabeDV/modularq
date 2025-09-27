"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Calendar, Edit, Trash2 } from "lucide-react"
import { useOperarios } from "@/hooks/use-operarios"
import { useTasks } from "@/hooks/use-tasks"
import { useProjects } from "@/hooks/use-projects"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

interface TimeEntriesListProps {
  operarioId?: string
  limit?: number
  showOperario?: boolean
}

export function TimeEntriesList({ operarioId, limit, showOperario = false }: TimeEntriesListProps) {
  const { operarios } = useOperarios()
  const { tasks } = useTasks()
  const { projects } = useProjects()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar time entries desde la base de datos
  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setLoading(true)
        let query = supabase
          .from('time_entries')
          .select('*')
          .order('created_at', { ascending: false })

        if (operarioId) {
          query = query.eq('user_id', operarioId)
        }

        if (limit) {
          query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) throw error
        setEntries(data || [])
      } catch (err) {
        console.error('Error loading time entries:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTimeEntries()
  }, [operarioId, limit])

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
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando registros de tiempo...</p>
          </div>
        ) : entries.length === 0 ? (
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
              const task = tasks.find((t) => t.id === entry.task_id)
              const project = projects.find((p) => p.id === entry.project_id)
              const operario = operarios.find((o) => o.id === entry.user_id)

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


                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(entry.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeRange(entry.start_time, entry.end_time)}</span>
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
