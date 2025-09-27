"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus, FolderOpen, Clock, Users, CheckCircle } from 'lucide-react'
import { TaskStats } from './task-stats'
import { TaskTable } from './task-table'
import { TaskForm } from './task-form'
import { useTasks, type CreateTaskData } from '@/hooks/use-tasks'
import { useAuth } from '@/lib/auth-context'
import type { Task } from '@/lib/types'

export function TaskManagement() {
  const { user } = useAuth()
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) return

    const createData: CreateTaskData = {
      title: taskData.title,
      description: taskData.description,
      estimatedHours: taskData.estimatedHours,
      actualHours: taskData.actualHours,
      category: taskData.category,
      isTemplate: taskData.isTemplate,
      createdBy: user.id,
      projectId: taskData.projectId,
      assignedUsers: taskData.assignedUsers,
      startDate: taskData.startDate,
      endDate: taskData.endDate,
      dependencies: taskData.dependencies
    }

    const result = await createTask(createData)
    if (result.success) {
      setIsCreateDialogOpen(false)
    }
  }

  const handleUpdateTask = async (taskId: string, taskData: Partial<Task>) => {
    const result = await updateTask(taskId, taskData)
    if (result.success) {
      setEditingTask(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  // Filtrar tareas
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  // Calcular estadísticas
  const totalTasks = tasks.length
  const templateTasks = tasks.filter(t => t.isTemplate).length
  const assignedTasks = tasks.filter(t => t.assignedUsers && t.assignedUsers.length > 0).length
  const unassignedTasks = tasks.filter(t => !t.assignedUsers || t.assignedUsers.length === 0).length

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
          <p className="text-sm sm:text-base text-muted-foreground">Administra las tareas del sistema que se pueden asignar a proyectos</p>
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
        templateTasks={templateTasks}
        assignedTasks={assignedTasks}
        unassignedTasks={unassignedTasks}
      />

      {/* Tasks Table */}
      <TaskTable
        tasks={filteredTasks}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
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
        onClose={() => setEditingTask(null)}
        onSubmit={(data) => editingTask && handleUpdateTask(editingTask.id, data)}
        isEditing={true}
        initialData={editingTask}
      />
    </div>
  )
}