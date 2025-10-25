"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, UserPlus, X, Crown } from 'lucide-react'
import { useTaskCollaborators } from '@/hooks/use-task-collaborators'
import { useAuth } from '@/lib/auth-context'
import type { ProjectTask, TaskCollaborator } from '@/lib/types'

interface TaskCollaboratorsProps {
  projectTask: ProjectTask
  projectOperarios: Array<{ id: string; name: string; role: string }>
  onUpdate?: () => void
}

export function TaskCollaborators({ projectTask, projectOperarios, onUpdate }: TaskCollaboratorsProps) {
  const { user } = useAuth()
  const { addCollaborator, removeCollaborator, getCollaborators } = useTaskCollaborators()
  
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Cargar colaboradores cuando se monta el componente y cuando cambia la tarea
  useEffect(() => {
    loadCollaborators()
  }, [projectTask.id])

  // Recargar colaboradores cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadCollaborators()
    }
  }, [isOpen])

  const loadCollaborators = async () => {
    const data = await getCollaborators(projectTask.id)
    setCollaborators(data)
  }

  // Filtrar operarios del proyecto que no son el responsable ni ya son colaboradores
  const availableUsers = projectOperarios.filter(operario => 
    operario.id !== projectTask.assignedTo && 
    !collaborators.some(c => c.userId === operario.id)
  )

  const handleAddCollaborator = async () => {
    if (!selectedUserId || !user?.id) return

    setIsLoading(true)
    const result = await addCollaborator({
      projectTaskId: projectTask.id,
      userId: selectedUserId,
      addedBy: user.id
    })

    if (result.success) {
      setSelectedUserId('')
      await loadCollaborators()
      onUpdate?.()
    }
    setIsLoading(false)
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setIsLoading(true)
    const result = await removeCollaborator(collaboratorId)

    if (result.success) {
      await loadCollaborators()
      onUpdate?.()
    }
    setIsLoading(false)
  }

  const isResponsible = user?.id === projectTask.assignedTo

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none cursor-pointer">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Colaboradores ({collaborators.length})</span>
          <span className="sm:hidden">Colab. ({collaborators.length})</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Colaboradores de la Tarea
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Responsable */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Responsable</h4>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Crown className="h-4 w-4 text-yellow-500" />
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {projectTask.assignedUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{projectTask.assignedUser?.name || 'Sin asignar'}</p>
                <p className="text-xs text-muted-foreground">Responsable principal</p>
              </div>
            </div>
          </div>

          {/* Colaboradores */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Colaboradores</h4>
            {collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay colaboradores asignados
              </p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center gap-2 p-2 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {collaborator.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{collaborator.user?.name || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">
                        Agregado por {collaborator.addedByUser?.name}
                      </p>
                    </div>
                    {isResponsible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        disabled={isLoading}
                        className="cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agregar colaborador (solo si es responsable) */}
          {isResponsible && availableUsers.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Agregar Colaborador</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar operario" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddCollaborator}
                  disabled={!selectedUserId || isLoading}
                  size="sm"
                  className="w-full sm:w-auto cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Agregar</span>
                </Button>
              </div>
            </div>
          )}

          {isResponsible && availableUsers.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Todos los operarios ya están asignados a esta tarea
            </div>
          )}

          {!isResponsible && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Solo el responsable puede gestionar colaboradores
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}