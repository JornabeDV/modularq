"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DraggableTaskRow } from './draggable-task-row'
import { TaskFilters } from './task-filters'
import type { Task } from '@/lib/types'

interface TaskTableProps {
  tasks: Task[]
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onReorderTasks?: (taskOrders: { id: string; taskOrder: number }[]) => void
  isReadOnly?: boolean
}

export function TaskTable({
  tasks,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  typeFilter,
  onTypeFilterChange,
  onEditTask,
  onDeleteTask,
  onReorderTasks,
  isReadOnly = false
}: TaskTableProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState(tasks)
  const [isReordering, setIsReordering] = useState(false)

  // Sincronizar localTasks con tasks cuando cambien
  React.useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

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

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDragOverTaskId(null)
      return
    }

    // Encontrar las posiciones de las tareas
    const draggedIndex = localTasks.findIndex(task => task.id === draggedTaskId)
    const targetIndex = localTasks.findIndex(task => task.id === targetTaskId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverTaskId(null)
      return
    }

    // Crear nuevo array con las tareas reordenadas
    const newTasks = [...localTasks]
    const [draggedTask] = newTasks.splice(draggedIndex, 1)
    newTasks.splice(targetIndex, 0, draggedTask)

    // Actualizar el orden de las tareas
    const taskOrders = newTasks.map((task, index) => ({
      id: task.id,
      taskOrder: index + 1
    }))

    // Actualización optimista: mostrar el nuevo orden inmediatamente
    setLocalTasks(newTasks.map((task, index) => ({
      ...task,
      taskOrder: index + 1
    })))
    setIsReordering(true)

    try {
      // Actualizar en el backend
      await onReorderTasks?.(taskOrders)
    } catch (error) {
      // Si falla, revertir al estado anterior
      setLocalTasks(tasks)
      console.error('Error reordering tasks:', error)
    } finally {
      setIsReordering(false)
    }

    setDragOverTaskId(null)
  }

  return (
    <Card>
      <CardHeader>
        <TaskFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          typeFilter={typeFilter}
          onTypeFilterChange={onTypeFilterChange}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead className="text-center min-w-[60px]">#</TableHead>
                <TableHead className="min-w-[200px]">Tarea</TableHead>
                <TableHead className="text-center min-w-[120px]">Categoría</TableHead>
                <TableHead className="text-center min-w-[100px]">Tipo</TableHead>
                <TableHead className="text-center min-w-[100px]">Horas</TableHead>
                {!isReadOnly && <TableHead className="text-center min-w-[120px]">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="text-center py-8 text-muted-foreground">
                    No se encontraron tareas
                  </td>
                </tr>
              ) : (
                localTasks.map((task, index) => (
                  <DraggableTaskRow
                    key={task.id}
                    task={task}
                    index={index + 1}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    isDragging={draggedTaskId === task.id}
                    isReordering={isReordering}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isReadOnly={isReadOnly}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}