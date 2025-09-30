"use client"

import { useState, useMemo } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { OperarioOnly } from "@/components/auth/route-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskFilters } from "@/components/tasks/task-filters"
import { Plus, ListTodo, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { useTasks } from "@/hooks/use-tasks"
import { useAuth } from "@/lib/auth-context"
import type { Task } from "@/lib/types"

export default function TasksPage() {
  return (
    <OperarioOnly>
      <TasksContent />
    </OperarioOnly>
  )
}

function TasksContent() {
  const { tasks, loading, error, getStandardTasks } = useTasks()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  
  // Mostrar todas las tareas (estándar y personalizadas)
  const allTasks = tasks

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task: any) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = statusFilter === "all" || task.category === statusFilter
      const matchesType = priorityFilter === "all" || task.type === priorityFilter

      return matchesSearch && matchesCategory && matchesType
    })
  }, [allTasks, searchTerm, statusFilter, priorityFilter])

  const activeFiltersCount = [statusFilter, priorityFilter].filter((f) => f !== "all").length

  const clearFilters = () => {
    setStatusFilter("all")
    setPriorityFilter("all")
    setSearchTerm("")
  }

  // Task statistics
  const taskStats = {
    total: allTasks.length,
    analysis: allTasks.filter((t: any) => t.category === "Análisis").length,
    design: allTasks.filter((t: any) => t.category === "Diseño").length,
    development: allTasks.filter((t: any) => t.category === "Desarrollo").length,
    testing: allTasks.filter((t: any) => t.category === "Testing").length,
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando tareas...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive">Error</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Tareas Estándar</h1>
            <p className="text-muted-foreground">Gestiona las tareas reutilizables del sistema</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea Estándar
          </Button>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{taskStats.total}</div>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-500">{taskStats.analysis}</div>
                  <p className="text-sm text-muted-foreground">Análisis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-500">{taskStats.design}</div>
                  <p className="text-sm text-muted-foreground">Diseño</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-500">{taskStats.development}</div>
                  <p className="text-sm text-muted-foreground">Desarrollo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold text-orange-500">{taskStats.testing}</div>
                  <p className="text-sm text-muted-foreground">Testing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>Filtra las tareas según tus necesidades</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              assigneeFilter={assigneeFilter}
              onAssigneeFilterChange={setAssigneeFilter}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </CardContent>
        </Card>

        {/* Tasks Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tareas Estándar ({filteredTasks.length})</h2>
          </div>

          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron tareas</h3>
                <p className="text-muted-foreground">
                  {searchTerm || activeFiltersCount > 0
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Aún no hay tareas estándar creadas en el sistema"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTasks.map((task: any) => (
                <Card key={task.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Categoría:</span>
                      <span className="text-sm text-muted-foreground">{task.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tipo:</span>
                      <span className="text-sm text-muted-foreground capitalize">{task.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Horas Estimadas:</span>
                      <span className="text-sm text-muted-foreground">{task.estimatedHours}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Creada:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(task.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}