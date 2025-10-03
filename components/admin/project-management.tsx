"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus, FolderOpen, Users, Calendar } from 'lucide-react'
import { ProjectStats } from './project-stats'
import { ProjectTable } from './project-table'
import { ProjectForm } from './project-form'
import { useProjects } from '@/hooks/use-projects'
import { useAuth } from '@/lib/auth-context'
import type { Project } from '@/lib/types'

export function ProjectManagement() {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) return

    const result = await createProject({
      ...projectData,
      createdBy: user.id
    })
    
    if (result.success && result.projectId) {
      setIsCreateDialogOpen(false)
      // Redirigir a la página de detalles del proyecto creado
      router.push(`/admin/projects/${result.projectId}`)
    }
  }

  const handleUpdateProject = async (projectId: string, projectData: Partial<Project>) => {
    const result = await updateProject(projectId, projectData)
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

  // Filtrar proyectos
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calcular estadísticas
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'active').length
  const completedProjects = projects.filter(p => p.status === 'completed').length
  const totalTasks = projects.reduce((sum, project) => sum + project.projectTasks.length, 0)

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
            <Button type="button" className="w-full sm:w-auto">
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
        totalTasks={totalTasks}
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