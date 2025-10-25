"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { ProjectStats } from './project-stats'
import { ProjectTable } from './project-table'
import { ProjectForm } from './project-form'
import { useProjectsPrisma } from '@/hooks/use-projects-prisma'
import { useAuth } from '@/lib/auth-context'
import type { Project } from '@/lib/types'

export function ProjectManagement() {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error, createProject, updateProject, deleteProject, reorderProjects } = useProjectsPrisma()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleCreateProject = async (projectData: any) => {
    if (!user?.id) return

    const result = await createProject({
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      start_date: projectData.startDate ? new Date(projectData.startDate) : new Date(),
      end_date: projectData.endDate ? new Date(projectData.endDate) : undefined,
      client_id: projectData.clientId || undefined,
      created_by: user.id,
      // Especificaciones técnicas
      modulation: projectData.modulation,
      height: projectData.height,
      width: projectData.width,
      depth: projectData.depth,
      module_count: projectData.moduleCount
    })
    
    if (result.success && result.project) {
      setIsCreateDialogOpen(false)
      // Redirigir directamente al proyecto creado
      router.push(`/admin/projects/${result.project.id}`)
    }
  }

  const handleUpdateProject = async (projectId: string, projectData: any) => {
    const updateData: any = {}
    
    if (projectData.name !== undefined) updateData.name = projectData.name
    if (projectData.description !== undefined) updateData.description = projectData.description
    if (projectData.status !== undefined) updateData.status = projectData.status
    if (projectData.startDate !== undefined) updateData.start_date = new Date(projectData.startDate)
    if (projectData.endDate !== undefined) updateData.end_date = projectData.endDate ? new Date(projectData.endDate) : undefined
    if (projectData.clientId !== undefined) updateData.client_id = projectData.clientId || undefined
    
    // Especificaciones técnicas
    if (projectData.modulation !== undefined) updateData.modulation = projectData.modulation
    if (projectData.height !== undefined) updateData.height = projectData.height
    if (projectData.width !== undefined) updateData.width = projectData.width
    if (projectData.depth !== undefined) updateData.depth = projectData.depth
    if (projectData.moduleCount !== undefined) updateData.module_count = projectData.moduleCount
    
    const result = await updateProject(projectId, updateData)
    if (result.success) {
      setEditingProject(null)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
  }

  const handleReorderProjects = async (projectOrders: { id: string; projectOrder: number }[]) => {
    await reorderProjects(projectOrders)
  }

  // Filtrar proyectos
  const filteredProjects = projects?.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  // Calcular estadísticas
  const totalProjects = projects?.length || 0
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0
  const completedProjects = projects?.filter(p => p.status === 'completed').length || 0
  const planningProjects = projects?.filter(p => p.status === 'planning').length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
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
          <h2 className="text-xl sm:text-2xl font-bold">Gestión de Proyectos</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Administra proyectos y asigna tareas existentes</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="w-full sm:w-auto cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <ProjectStats 
        totalProjects={totalProjects}
        activeProjects={activeProjects}
        completedProjects={completedProjects}
        planningProjects={planningProjects}
      />

      {/* Projects Table */}
      <ProjectTable
        projects={filteredProjects}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onReorderProjects={handleReorderProjects}
      />

      {/* Create Project Dialog */}
      <ProjectForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateProject}
        isEditing={false}
      />

      {/* Edit Project Dialog */}
      <ProjectForm
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={(data) => editingProject && handleUpdateProject(editingProject.id, data)}
        isEditing={true}
        initialData={editingProject}
      />
    </div>
  )
}