"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus, FolderOpen, Clock, Users, CheckCircle } from 'lucide-react'
import { TaskStats } from './task-stats'
import { TaskTable } from './task-table'
import { TaskForm } from './task-form'
import { useTasksPrisma, type CreateTaskData } from '@/hooks/use-tasks-prisma'
import { useAuth } from '@/lib/auth-context'

export function TaskManagement() {
  const { user } = useAuth()
  const { tasks, loading, error, createTask, updateTask, deleteTask, reorderTasks } = useTasksPrisma()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const handleCreateTask = async (taskData: any) => {
    if (!user?.id) return

    const createData: CreateTaskData = {
      title: taskData.title,
      description: taskData.description || '',
      estimatedHours: taskData.estimatedHours || taskData.estimated_hours || 0,
      category: taskData.category || '',
      type: taskData.type || 'custom',
      createdBy: user.id
    }

    const result = await createTask(createData)
    if (result.success) {
      setIsCreateDialogOpen(false)
    }
  }

  const handleUpdateTask = async (taskId: string, taskData: any) => {
    if (isUpdating) return // Evitar múltiples actualizaciones simultáneas
    
    setIsUpdating(true)
    
    try {
      const updateData: any = {}
      if (taskData.title !== undefined) updateData.title = taskData.title
      if (taskData.description !== undefined) updateData.description = taskData.description
      if (taskData.estimatedHours !== undefined) updateData.estimated_hours = taskData.estimatedHours
      if (taskData.estimated_hours !== undefined) updateData.estimated_hours = taskData.estimated_hours
      if (taskData.category !== undefined) updateData.category = taskData.category
      if (taskData.type !== undefined) updateData.type = taskData.type
      
      const result = await updateTask(taskId, updateData)
      if (result.success) {
        setEditingTask(null)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task)
  }

  const handleReorderTasks = async (taskOrders: { id: string; taskOrder: number }[]) => {
    await reorderTasks(taskOrders)
  }

  // Filtrar tareas
  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
    const matchesType = typeFilter === 'all' || task.type === typeFilter
    
    return matchesSearch && matchesCategory && matchesType
  }) || []

  // Calcular estadísticas
  const totalTasks = tasks?.length || 0
  const standardTasks = tasks?.filter(t => t.type === 'standard').length || 0
  const customTasks = tasks?.filter(t => t.type === 'custom').length || 0
  // Las tareas base no tienen información de asignación, eso se maneja en project_tasks
  const assignedTasks = 0
  const unassignedTasks = totalTasks

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando tareas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Gestión de Tareas</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Crea y administra tareas estándar (se asignan automáticamente a proyectos nuevos) y personalizadas (se asignan manualmente)
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>


      {/* Stats Cards */}
      <TaskStats 
        totalTasks={totalTasks}
        standardTasks={standardTasks}
        customTasks={customTasks}
        assignedTasks={assignedTasks}
        unassignedTasks={unassignedTasks}
      />

      {/* Tasks Table */}
      <TaskTable
        tasks={filteredTasks as any}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onReorderTasks={handleReorderTasks}
      />

      {/* Create Task Dialog */}
      <TaskForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateTask}
        isEditing={false}
      />

      {/* Edit Task Dialog */}
      <TaskForm
        isOpen={!!editingTask}
        onClose={() => {
          if (!isUpdating) {
            setEditingTask(null)
          }
        }}
        onSubmit={(data) => editingTask && handleUpdateTask(editingTask.id, data)}
        isEditing={true}
        initialData={editingTask}
        isLoading={isUpdating}
      />
    </div>
  )
}