"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTasks } from '@/hooks/use-tasks'
import { useProjectTasks } from '@/hooks/use-project-tasks'
import { DraggableTaskCard } from './draggable-task-card'
import type { Task, ProjectTask } from '@/lib/types'

interface ProjectTaskManagerProps {
  projectId: string
  projectTasks: ProjectTask[]
  projectStatus?: string
  onAssignTask: (taskId: string) => void
  onUnassignTask: (projectTaskId: string) => void
  onEditTask?: (task: ProjectTask) => void
  onCreateTask?: () => void
  onReorderTasks?: (taskOrders: { id: string; taskOrder: number }[]) => void
}

export function ProjectTaskManager({ 
  projectId, 
  projectTasks, 
  projectStatus,
  onAssignTask, 
  onUnassignTask,
  onEditTask,
  onCreateTask,
  onReorderTasks
}: ProjectTaskManagerProps) {
  const { tasks, loading: tasksLoading } = useTasks()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'standard' | 'custom'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

  // Filtrar tareas disponibles para asignar
  const availableTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || task.type === filterType
    const notAssigned = !projectTasks.some(pt => pt.taskId === task.id)
    
    return matchesSearch && matchesType && notAssigned
  })

  const standardTasks = availableTasks.filter(t => t.type === 'standard')
  const customTasks = availableTasks.filter(t => t.type === 'custom')
  
  // Determinar si el proyecto está en modo solo lectura (solo para operarios)
  // Los administradores siempre pueden editar
  const isReadOnly = false

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'assigned': return <User className="h-4 w-4 text-blue-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-orange-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Funciones de drag and drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null)
    setDragOverTaskId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDragOverTaskId(null)
      return
    }

    // Encontrar las posiciones de las tareas
    const draggedIndex = projectTasks.findIndex(task => task.id === draggedTaskId)
    const targetIndex = projectTasks.findIndex(task => task.id === targetTaskId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverTaskId(null)
      return
    }

    // Crear nuevo array con las tareas reordenadas
    const newTasks = [...projectTasks]
    const [draggedTask] = newTasks.splice(draggedIndex, 1)
    newTasks.splice(targetIndex, 0, draggedTask)

    // Actualizar el orden de las tareas
    const taskOrders = newTasks.map((task, index) => ({
      id: task.id,
      taskOrder: index + 1
    }))

    onReorderTasks?.(taskOrders)
    setDragOverTaskId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Tareas del Proyecto</h3>
        </div>
        <div className="flex gap-2">
          {!isReadOnly && onCreateTask && (
            <Button variant="outline" onClick={onCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Tarea Personalizada
            </Button>
          )}
          {!isReadOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar Tarea Existente
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asignar Tarea al Proyecto</DialogTitle>
            </DialogHeader>
            
            {/* Filtros */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar tareas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las tareas</SelectItem>
                    <SelectItem value="standard">Solo estándar</SelectItem>
                    <SelectItem value="custom">Solo personalizadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de tareas disponibles */}
              <div className="space-y-4">
                {standardTasks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      Tareas Reutilizables ({standardTasks.length})
                    </h4>
                    <div className="grid gap-2">
                      {standardTasks.map(task => (
                        <Card key={task.id} className="p-3 hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors cursor-pointer"
                              onClick={() => {
                                onAssignTask(task.id)
                                setIsDialogOpen(false)
                              }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{task.title}</h5>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{task.category}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {task.estimatedHours}h estimadas
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              Asignar
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {customTasks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      Tareas Específicas ({customTasks.length})
                    </h4>
                    <div className="grid gap-2">
                      {customTasks.map(task => (
                        <Card key={task.id} className="p-3 hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors cursor-pointer"
                              onClick={() => {
                                onAssignTask(task.id)
                                setIsDialogOpen(false)
                              }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{task.title}</h5>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{task.category}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {task.estimatedHours}h estimadas
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              Asignar
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {availableTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay tareas disponibles para asignar</p>
                    <p className="text-sm">Todas las tareas ya están asignadas a este proyecto</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
          )}
        </div>
      </div>

      {/* Tareas asignadas al proyecto */}
      <div>
        <h4 className="font-medium mb-3">
          Tareas Asignadas ({projectTasks.length})
          {!isReadOnly && (
            <span className="text-sm text-muted-foreground ml-2">
              - Arrastra y suelta para reordenar
            </span>
          )}
        </h4>
        <div className="space-y-3">
          {projectTasks
            .sort((a, b) => {
              const statusOrder = { in_progress: 0, assigned: 1, pending: 2, completed: 3, cancelled: 4 }
              return statusOrder[a.status] - statusOrder[b.status]
            })
            .map((projectTask, index) => (
            <DraggableTaskCard
              key={projectTask.id}
              projectTask={projectTask}
              taskNumber={index + 1}
              onUnassign={onUnassignTask}
              onEdit={onEditTask || (() => {})}
              isDragging={draggedTaskId === projectTask.id}
              isReadOnly={isReadOnly}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    </div>
  )
}