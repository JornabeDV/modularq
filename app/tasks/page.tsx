"use client"

import { useState, useMemo } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskFilters } from "@/components/tasks/task-filters"
import { mockTasks } from "@/lib/mock-data"
import { Plus, ListTodo, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import type { Task } from "@/lib/types"

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || task.status === statusFilter
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
      const matchesAssignee = assigneeFilter === "all" || task.assignedTo === assigneeFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
    })
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter])

  const activeFiltersCount = [statusFilter, priorityFilter, assigneeFilter].filter((f) => f !== "all").length

  const clearFilters = () => {
    setStatusFilter("all")
    setPriorityFilter("all")
    setAssigneeFilter("all")
    setSearchTerm("")
  }

  // Task statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Gestión de Tareas</h1>
            <p className="text-muted-foreground">Administra y supervisa todas las tareas del sistema</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
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
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{taskStats.pending}</div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-500">{taskStats.inProgress}</div>
                  <p className="text-sm text-muted-foreground">En Progreso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-500">{taskStats.completed}</div>
                  <p className="text-sm text-muted-foreground">Completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-500">{taskStats.blocked}</div>
                  <p className="text-sm text-muted-foreground">Bloqueadas</p>
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
            <h2 className="text-xl font-semibold">Tareas ({filteredTasks.length})</h2>
          </div>

          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron tareas</h3>
                <p className="text-muted-foreground">
                  {searchTerm || activeFiltersCount > 0
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Aún no hay tareas creadas en el sistema"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
