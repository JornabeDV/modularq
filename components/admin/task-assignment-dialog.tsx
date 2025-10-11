"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Plus, X } from 'lucide-react'
import { useTasksPrisma } from '@/hooks/use-tasks-prisma'
import { useProjectTasksPrisma } from '@/hooks/use-project-tasks-prisma'
import { useAuth } from '@/lib/auth-context'
import type { Task } from '@/lib/types'

interface TaskAssignmentDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

export function TaskAssignmentDialog({ isOpen, onClose, projectId, projectName }: TaskAssignmentDialogProps) {
  const { user } = useAuth()
  const { tasks, loading: tasksLoading } = useTasksPrisma()
  const { projectTasks, createProjectTask, deleteProjectTask } = useProjectTasksPrisma(projectId)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  // Filtrar tareas personalizadas que no están ya asignadas al proyecto
  const assignedTaskIds = projectTasks?.map(pt => pt.taskId) || []
  const availableTasks = tasks?.filter(task => 
    task.type === 'custom' && 
    !assignedTaskIds.includes(task.id) &&
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleAssignSelected = async () => {
    if (!user?.id || selectedTasks.length === 0) return

    setIsAssigning(true)
    try {
      for (const taskId of selectedTasks) {
        await createProjectTask({
          projectId,
          taskId,
          assignedBy: user.id
        })
      }
      setSelectedTasks([])
      onClose()
    } catch (error) {
      console.error('Error assigning tasks:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassignTask = async (projectTaskId: string) => {
    await deleteProjectTask(projectTaskId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-auto max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Gestionar Tareas - {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tareas ya asignadas */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Tareas Asignadas al Proyecto</h3>
            {!projectTasks || projectTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay tareas asignadas a este proyecto.</p>
            ) : (
              <div className="space-y-2">
                {projectTasks?.map(projectTask => (
                  <div key={projectTask.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={projectTask.task?.type === 'standard' ? 'default' : 'secondary'}>
                          {projectTask.task?.type === 'standard' ? 'Estándar' : 'Personalizada'}
                        </Badge>
                        <span className="font-medium">{projectTask.task?.title}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{projectTask.task?.description}</p>
                    </div>
                    {projectTask.task?.type === 'custom' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignTask(projectTask.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Asignar nuevas tareas personalizadas */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Asignar Tareas Personalizadas</h3>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar tareas personalizadas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {tasksLoading ? (
              <p className="text-gray-500">Cargando tareas...</p>
            ) : availableTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'No se encontraron tareas que coincidan con la búsqueda.' : 'No hay tareas personalizadas disponibles para asignar.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableTasks.map(task => (
                  <div key={task.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={task.id}
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={task.id} className="font-medium cursor-pointer">
                        {task.title}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{task.description || ''}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{task.category || 'Sin categoría'}</Badge>
                        <span className="text-xs text-gray-500">
                          {task.estimated_hours}h estimadas
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTasks.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  {selectedTasks.length} tarea{selectedTasks.length > 1 ? 's' : ''} seleccionada{selectedTasks.length > 1 ? 's' : ''}
                </p>
                <Button 
                  onClick={handleAssignSelected}
                  disabled={isAssigning}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isAssigning ? 'Asignando...' : 'Asignar Seleccionadas'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}