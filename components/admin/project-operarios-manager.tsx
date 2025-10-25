"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Users, X } from 'lucide-react'
import { useProjectOperariosPrisma } from '@/hooks/use-project-operarios-prisma'
import { useUsersPrisma } from '@/hooks/use-users-prisma'
import { useAuth } from '@/lib/auth-context'

interface ProjectOperariosManagerProps {
  projectId: string
}

export function ProjectOperariosManager({ projectId }: ProjectOperariosManagerProps) {
  const { user } = useAuth()
  const { projectOperarios, loading, assignOperarioToProject, unassignOperarioFromProject } = useProjectOperariosPrisma(projectId)
  const { users } = useUsersPrisma()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  // Filtrar solo operarios (no admins)
  const operarios = users?.filter(user => user.role === 'operario') || []

  // Operarios ya asignados
  const assignedUserIds = projectOperarios?.map(po => po.user_id) || []
  const availableOperarios = operarios.filter(operario => !assignedUserIds.includes(operario.id))

  const handleOperarioToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleAssignSelected = async () => {
    if (!user?.id || selectedUserIds.length === 0) return

    setIsAssigning(true)
    try {
      for (const userId of selectedUserIds) {
        await assignOperarioToProject({
          projectId,
          userId,
          assignedBy: user.id
        })
      }
      setSelectedUserIds([])
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error assigning operarios:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassignOperario = async (assignmentId: string) => {
    await unassignOperarioFromProject(assignmentId)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Operarios Asignados</span>
              <span className="sm:hidden">Operarios</span>
            </CardTitle>
            <CardDescription className="text-sm">
              <span className="hidden sm:inline">Gestiona qué operarios pueden trabajar en este proyecto</span>
              <span className="sm:hidden">Gestiona operarios del proyecto</span>
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer self-start sm:self-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Asignar Operarios</span>
                <span className="sm:hidden">Asignar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Asignar Operarios al Proyecto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {availableOperarios.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay operarios disponibles</h3>
                    <p className="text-muted-foreground">
                      Todos los operarios ya están asignados a este proyecto
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {availableOperarios.map((operario) => (
                        <div key={operario.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                          <Checkbox
                            id={operario.id}
                            checked={selectedUserIds.includes(operario.id)}
                            onCheckedChange={() => handleOperarioToggle(operario.id)}
                          />
                          <label 
                            htmlFor={operario.id}
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-sm">
                                {operario.name
                                  ?.split(' ')
                                  .map(n => n[0])
                                  .join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{operario.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {operario.role}
                              </Badge>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {selectedUserIds.length} operario{selectedUserIds.length !== 1 ? 's' : ''} seleccionado{selectedUserIds.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedUserIds([])
                            setIsDialogOpen(false)
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleAssignSelected}
                          disabled={selectedUserIds.length === 0 || isAssigning}
                          className="cursor-pointer"
                        >
                          {isAssigning ? 'Asignando...' : `Asignar ${selectedUserIds.length}`}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando operarios...</p>
          </div>
        ) : !projectOperarios || projectOperarios.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay operarios asignados</h3>
            <p className="text-muted-foreground mb-4">
              Asigna operarios para que puedan trabajar en este proyecto
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projectOperarios?.map((projectOperario) => (
              <div key={projectOperario.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {projectOperario.user?.name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{projectOperario.user?.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {projectOperario.user?.role || 'operario'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnassignOperario(projectOperario.id)}
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
