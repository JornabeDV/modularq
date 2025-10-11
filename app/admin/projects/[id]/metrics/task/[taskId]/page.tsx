"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useProjectsPrisma } from "@/hooks/use-projects-prisma"
import { AdminOnly } from "@/components/auth/route-guard"
import { supabase } from "@/lib/supabase"
import { 
  ArrowLeft, 
  Target, 
  Timer, 
  Clock, 
  CheckCircle, 
  Calendar, 
  Users, 
  TrendingUp,
  Activity,
  FileText,
  User
} from "lucide-react"
import Link from "next/link"

export default function TaskMetricsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const taskId = params?.taskId as string
  const { projects, loading } = useProjectsPrisma()
  
  const project = projects?.find(p => p.id === projectId)
  const projectTask = project?.projectTasks?.find(pt => pt.id === taskId)
  const task = projectTask?.task

  // Estados para métricas detalladas
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [calculatedHours, setCalculatedHours] = useState(0)
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  // Función para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    
    const date = dateString.includes('T') 
      ? new Date(dateString) 
      : new Date(dateString + 'T00:00:00')
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (hours: number) => {
    if (hours < 0.0001) return '< 1m'
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      return minutes < 1 ? '< 1m' : `${minutes}m`
    }
    return `${hours % 1 === 0 ? hours : hours.toFixed(1)}hs`
  }

  // Cargar métricas detalladas
  useEffect(() => {
    const loadDetailedMetrics = async () => {
      if (!projectTask?.taskId) return

      setLoadingMetrics(true)
      try {
        // Cargar entradas de tiempo
        const { data: entries, error } = await supabase
          .from('time_entries')
          .select(`
            *,
            user:users(name),
            task:tasks(title)
          `)
          .eq('task_id', projectTask.taskId)
          .order('start_time', { ascending: false })

        if (error) {
          console.error('Error loading time entries:', error)
        } else {
          setTimeEntries(entries || [])
          
          // Calcular horas totales
          const totalHours = entries?.reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0) || 0
          setCalculatedHours(totalHours)
        }
      } catch (err) {
        console.error('Error loading detailed metrics:', err)
      } finally {
        setLoadingMetrics(false)
      }
    }

    loadDetailedMetrics()
  }, [projectTask?.taskId])

  if (loading || loadingMetrics) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando métricas de la tarea...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!project || !projectTask || !task) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Tarea no encontrada</h3>
          <p className="text-muted-foreground mb-4">
            La tarea que buscas no existe o no tienes permisos para verla
          </p>
          <Button onClick={() => router.push(`/admin/projects/${projectId}/metrics`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Métricas del Proyecto
          </Button>
        </div>
      </MainLayout>
    )
  }

  const actualHours = calculatedHours
  const estimatedHours = task.estimatedHours || 0
  const progressPercentage = projectTask.progressPercentage || 0
  const efficiency = estimatedHours > 0 ? (actualHours / estimatedHours) * 100 : 0

  return (
    <AdminOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/admin/projects/${projectId}/metrics`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <Badge 
                variant="outline" 
                className={`font-medium text-xs sm:text-sm ${
                  projectTask.status === 'completed' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : projectTask.status === 'in_progress' 
                    ? 'bg-orange-50 text-orange-700 border-orange-200' 
                    : projectTask.status === 'assigned'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : projectTask.status === 'pending'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                {projectTask.status === 'completed' ? 'Completada' : 
                 projectTask.status === 'in_progress' ? 'En Progreso' : 
                 projectTask.status === 'assigned' ? 'Asignada' :
                 projectTask.status === 'pending' ? 'Pendiente' : 
                 projectTask.status}
              </Badge>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight break-words">{task.title}</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Métricas detalladas de la tarea
              </p>
            </div>
          </div>

          {/* Información general de la tarea */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Target className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Horas Estimadas</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">{estimatedHours}hs</p>
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Timer className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Horas Reales</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">{formatTime(actualHours)}</p>
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Eficiencia</span>
                  </div>
                  <div className="space-y-1">
                    {estimatedHours > 0 && (
                      <Badge variant="outline" className={`text-xs ${
                        actualHours <= estimatedHours 
                          ? 'text-green-600 border-green-300' 
                          : 'text-red-600 border-red-300'
                      }`}>
                        {(() => {
                          const diff = estimatedHours - actualHours
                          if (diff >= 0) {
                            const diffFormatted = diff % 1 === 0 ? diff : diff.toFixed(1)
                            return `Tiempo ahorrado: ${diffFormatted}hs`
                          } else {
                            const diffFormatted = Math.abs(diff) % 1 === 0 ? Math.abs(diff) : Math.abs(diff).toFixed(1)
                            return `Tiempo extra: ${diffFormatted}hs`
                          }
                        })()}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Progreso</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">{progressPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas y asignación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas y Asignación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Fecha de Inicio</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base">{formatDate(projectTask.startDate)}</p>
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Fecha de Fin</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base">{formatDate(projectTask.endDate)}</p>
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Operario Asignado</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base truncate">
                    {projectTask.assignedUser?.name || 'Sin asignar'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial detallado de tiempo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial Detallado de Tiempo
              </CardTitle>
              <CardDescription>
                Registro completo de todas las sesiones de trabajo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeEntries.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {timeEntries.map((entry, index) => (
                    <div key={entry.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="font-medium text-sm sm:text-base truncate">{entry.user?.name || 'Usuario desconocido'}</span>
                        </div>
                        <Badge variant="outline" className="text-xs self-start sm:self-auto">
                          {formatTime(entry.hours)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Fecha: {formatDate(entry.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Hora: {formatDateTime(entry.start_time)} - {formatDateTime(entry.end_time)}</span>
                        </div>
                      </div>
                      
                      {entry.description && (
                        <div className="mt-3 p-2 bg-muted rounded text-xs sm:text-sm">
                          <span className="font-medium">Descripción:</span> {entry.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay registros de tiempo</h3>
                  <p className="text-muted-foreground">
                    Esta tarea aún no tiene entradas de tiempo registradas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Colaboradores */}
          {projectTask.collaborators && projectTask.collaborators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Colaboradores
                </CardTitle>
                <CardDescription>
                  Operarios que han participado en esta tarea
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {projectTask.collaborators.map((collaborator: any) => (
                    <Badge key={collaborator.id} variant="outline" className="text-xs sm:text-sm">
                      <User className="h-3 w-3 mr-1" />
                      {collaborator.user?.name || 'Usuario'}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </AdminOnly>
  )
}