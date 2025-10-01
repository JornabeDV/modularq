"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Users, X } from 'lucide-react'
import { useProjectOperarios } from '@/hooks/use-project-operarios'
import { useUsers } from '@/hooks/use-users'
import { useAuth } from '@/lib/auth-context'

interface ProjectOperariosManagerProps {
  projectId: string
}

export function ProjectOperariosManager({ projectId }: ProjectOperariosManagerProps) {
  const { user } = useAuth()
  const { projectOperarios, loading, assignOperarioToProject, unassignOperarioFromProject } = useProjectOperarios(projectId)
  const { users } = useUsers()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  // Filtrar solo operarios (no admins)
  const operarios = users.filter(user => user.role === 'operario')

  // Operarios ya asignados
  const assignedUserIds = projectOperarios.map(po => po.userId)
  const availableOperarios = operarios.filter(operario => !assignedUserIds.includes(operario.id))

  const handleAssignOperario = async () => {
    if (!selectedUserId || !user?.id) return

    const result = await assignOperarioToProject({
      projectId,
      userId: selectedUserId,
      assignedBy: user.id
    })

    if (result.success) {
      setSelectedUserId('')
      setIsDialogOpen(false)
    }
  }

  const handleUnassignOperario = async (assignmentId: string) => {
    await unassignOperarioFromProject(assignmentId)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Operarios Asignados
            </CardTitle>
            <CardDescription>
              Gestiona qué operarios pueden trabajar en este proyecto
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Asignar Operario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Operario al Proyecto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Seleccionar Operario</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un operario" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOperarios.map((operario) => (
                        <SelectItem key={operario.id} value={operario.id}>
                          <div className="flex items-center gap-2">
                            <span>{operario.name}</span>
                            <span className="text-xs text-muted-foreground">({operario.role})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAssignOperario}
                    disabled={!selectedUserId}
                  >
                    Asignar
                  </Button>
                </div>
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
        ) : projectOperarios.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay operarios asignados</h3>
            <p className="text-muted-foreground mb-4">
              Asigna operarios para que puedan trabajar en este proyecto
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projectOperarios.map((projectOperario) => (
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
