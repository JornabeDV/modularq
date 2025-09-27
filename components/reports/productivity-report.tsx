"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock, Target, Award, AlertTriangle } from "lucide-react"
import { useOperarios } from "@/hooks/use-operarios"
import { useTasks } from "@/hooks/use-tasks"
import { useProjects } from "@/hooks/use-projects"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

export function ProductivityReport() {
  const { operarios, loading: operariosLoading } = useOperarios()
  const { tasks, loading: tasksLoading } = useTasks()
  const { projects, loading: projectsLoading } = useProjects()
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar time entries desde la base de datos
  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setTimeEntries(data || [])
      } catch (err) {
        console.error('Error loading time entries:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTimeEntries()
  }, [])
  
  // Calculate productivity metrics
  const calculateOperarioMetrics = (operarioId: string) => {
    const operarioTasks = tasks.filter((task) => task.assignedTo === operarioId)
    const operarioTimeEntries = timeEntries.filter((entry) => entry.user_id === operarioId)

    const completedTasks = operarioTasks.filter((task) => task.status === "completed")
    const totalEstimatedHours = operarioTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
    const totalActualHours = operarioTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
    const totalLoggedHours = operarioTimeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0)

    const completionRate = operarioTasks.length > 0 ? (completedTasks.length / operarioTasks.length) * 100 : 0
    const timeEfficiency = totalActualHours > 0 ? (totalEstimatedHours / totalActualHours) * 100 : 0
    const hoursVariance = totalActualHours - totalEstimatedHours

    return {
      completedTasks: completedTasks.length,
      totalTasks: operarioTasks.length,
      completionRate,
      timeEfficiency: Math.min(timeEfficiency, 150), // Cap at 150% for display
      totalEstimatedHours,
      totalActualHours,
      totalLoggedHours,
      hoursVariance,
      isOverBudget: hoursVariance > 0,
      isUnderBudget: hoursVariance < 0,
    }
  }

  const operarioMetrics = operarios.map((operario) => ({
    ...operario,
    metrics: calculateOperarioMetrics(operario.id!),
  }))

  // Overall statistics
  const overallStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === "completed").length,
    totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
    totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
    totalLoggedHours: timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0),
  }

  const overallCompletionRate = (overallStats.completedTasks / overallStats.totalTasks) * 100
  const overallEfficiency = (overallStats.totalEstimatedHours / overallStats.totalActualHours) * 100

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return "text-green-500"
    if (efficiency >= 70) return "text-yellow-500"
    return "text-red-500"
  }

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 90) return { variant: "default" as const, label: "Excelente" }
    if (efficiency >= 70) return { variant: "secondary" as const, label: "Bueno" }
    return { variant: "destructive" as const, label: "Necesita mejora" }
  }

  if (loading || operariosLoading || tasksLoading || projectsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando reporte de productividad...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{overallStats.totalTasks > 0 ? Math.round(overallCompletionRate) : 0}%</div>
                <p className="text-sm text-muted-foreground">Tasa de Finalización</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${getEfficiencyColor(overallEfficiency)}`} />
              <div>
                <div className={`text-2xl font-bold ${getEfficiencyColor(overallEfficiency)}`}>
                  {overallStats.totalActualHours > 0 ? Math.round(overallEfficiency) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">Eficiencia General</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{overallStats.totalLoggedHours}h</div>
                <p className="text-sm text-muted-foreground">Horas Registradas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{overallStats.completedTasks}</div>
                <p className="text-sm text-muted-foreground">Tareas Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Operario Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Operario</CardTitle>
          <CardDescription>Métricas detalladas de productividad individual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {operarioMetrics.map((operario) => {
              const efficiencyBadge = getEfficiencyBadge(operario.metrics.timeEfficiency)

              return (
                <div key={operario.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {operario.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{operario.name}</h3>
                        <p className="text-sm text-muted-foreground">{operario.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={efficiencyBadge.variant}>{efficiencyBadge.label}</Badge>
                      {operario.metrics.isOverBudget && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Sobre tiempo
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Completion Rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tasa de Finalización</span>
                        <span className="font-medium">{Math.round(operario.metrics.completionRate)}%</span>
                      </div>
                      <Progress value={operario.metrics.completionRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {operario.metrics.completedTasks} de {operario.metrics.totalTasks} tareas
                      </p>
                    </div>

                    {/* Time Efficiency */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Eficiencia de Tiempo</span>
                        <span className={`font-medium ${getEfficiencyColor(operario.metrics.timeEfficiency)}`}>
                          {Math.round(operario.metrics.timeEfficiency)}%
                        </span>
                      </div>
                      <Progress value={Math.min(operario.metrics.timeEfficiency, 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {operario.metrics.totalActualHours}h reales vs {operario.metrics.totalEstimatedHours}h estimadas
                      </p>
                    </div>

                    {/* Hours Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Horas Registradas</span>
                        <span className="font-medium">{operario.metrics.totalLoggedHours}h</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Estimadas: {operario.metrics.totalEstimatedHours}h</div>
                        <div>Reales: {operario.metrics.totalActualHours}h</div>
                        <div className={operario.metrics.hoursVariance > 0 ? "text-red-500" : "text-green-500"}>
                          Varianza: {operario.metrics.hoursVariance > 0 ? "+" : ""}
                          {operario.metrics.hoursVariance}h
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Project Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Proyecto</CardTitle>
          <CardDescription>Estado y progreso de los proyectos activos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => {
              const projectTasks = tasks.filter((task) => task.projectId === project.id)
              const completedTasks = projectTasks.filter((task) => task.status === "completed")
              const totalEstimated = projectTasks.reduce((sum, task) => sum + task.estimatedHours, 0)
              const totalActual = projectTasks.reduce((sum, task) => sum + task.actualHours, 0)
              const efficiency = totalEstimated > 0 ? (totalEstimated / totalActual) * 100 : 0

              return (
                <div key={project.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.department}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={project.status === "active" ? "default" : "secondary"}>{project.status}</Badge>
                      <Badge variant={getEfficiencyBadge(efficiency).variant}>
                        {Math.round(efficiency)}% eficiencia
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Progreso General</div>
                      <div className="text-2xl font-bold">{project.progress}%</div>
                      <Progress value={project.progress} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tareas Completadas</div>
                      <div className="text-2xl font-bold">
                        {completedTasks.length}/{projectTasks.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((completedTasks.length / projectTasks.length) * 100)}% completado
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Horas</div>
                      <div className="text-2xl font-bold">{totalActual}h</div>
                      <div className="text-xs text-muted-foreground">de {totalEstimated}h estimadas</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}