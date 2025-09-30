"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TimeEntriesListProps {
  operarioId?: string
  taskId?: string
  projectId?: string
  limit?: number
  showOperario?: boolean
  refreshTrigger?: number
}

export function TimeEntriesList({ operarioId, taskId, projectId, limit, showOperario = false, refreshTrigger }: TimeEntriesListProps) {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)


  // Cargar time entries desde la base de datos
  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setLoading(true)
        let query = supabase
          .from('time_entries')
          .select(`
            *,
            task:task_id (
              id,
              title
            ),
            project:project_id (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false })

        if (operarioId) {
          query = query.eq('user_id', operarioId)
        }

        if (taskId) {
          query = query.eq('task_id', taskId)
        }

        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        if (limit) {
          query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
          console.error('TimeEntriesList - Error in query:', error)
          throw error
        }
        
        setEntries(data || [])
      } catch (err) {
        console.error('TimeEntriesList - Error loading time entries:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTimeEntries()
  }, [operarioId, taskId, projectId, limit, refreshTrigger])

  const formatTime = useCallback((hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }, [])

  const formatTimeRange = useCallback((startTime: string, endTime?: string) => {
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
  }, [])

  const renderedEntries = useMemo(() => {
    return entries.map((entry) => (
      <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{entry.task?.title || 'Tarea eliminada'}</span>
              <Badge variant="outline" className="text-xs">
                {formatTime(entry.hours)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(entry.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimeRange(entry.start_time, entry.end_time)}</span>
              </div>
              {entry.project && (
                <div className="text-xs">
                  {entry.project.name}
                </div>
              )}
            </div>
            {entry.description && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span className="italic">{entry.description}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ))
  }, [entries, formatTime, formatDate, formatTimeRange])

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Cargando registros...</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay registros de tiempo</h3>
        <p className="text-muted-foreground">
          {taskId ? 'No se han registrado horas para esta tarea' : 'No se han registrado horas de trabajo'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {renderedEntries}
    </div>
  )
}