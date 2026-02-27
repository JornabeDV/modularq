"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ProjectStats } from "./project-stats";
import { ProjectTable } from "./project-table";
import { ProjectForm } from "./project-form";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useOperariosPrisma } from "@/hooks/use-operarios-prisma";
import { useProjectOperariosPrisma } from "@/hooks/use-project-operarios-prisma";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/lib/types";

type ProjectStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "delivered";

type SortField =
  | "name"
  | "clientName"
  | "status"
  | "condition"
  | "startDate"
  | "endDate"
  | "progress";
type SortOrder = "asc" | "desc";

export function ProjectManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justDeleted = searchParams.get("deleted") === "true";
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const isReadOnly = userProfile?.role === "supervisor";

  const {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
  } = useProjectsPrisma();
  const { operarios } = useOperariosPrisma();
  const { assignOperarioToProject } = useProjectOperariosPrisma();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Loading state para creación
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleCreateProject = async (projectData: any) => {
    if (!user?.id) return { success: false, error: "Usuario no encontrado" };

    // Cerrar modal inmediatamente y mostrar loading fullscreen
    setIsCreateDialogOpen(false);
    setIsCreatingProject(true);

    try {
      const result = await createProject({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        condition: projectData.condition || "venta",
        start_date: projectData.startDate
          ? new Date(projectData.startDate)
          : new Date(),
        end_date: projectData.endDate ? new Date(projectData.endDate) : undefined,
        client_id: projectData.clientId || undefined,
        created_by: user.id,
        modulation: projectData.modulation,
        height: projectData.height,
        width: projectData.width,
        depth: projectData.depth,
        module_count: projectData.moduleCount,
      });

      if (result.success && result.project) {
        const project = result.project;

        if (operarios && operarios.length > 0) {
          try {
            const assignPromises = operarios.map((operario) =>
              assignOperarioToProject({
                projectId: project.id,
                userId: operario.id,
              }),
            );
            await Promise.all(assignPromises);
          } catch (error) {
            console.error("Error asignando operarios:", error);
          }
        }

        router.push(`/admin/projects/${project.id}?new=true`);
      } else {
        // Error: quitar loading y mostrar error
        setIsCreatingProject(false);
        toast({
          title: "Error al crear proyecto",
          description: result.error || "No se pudo crear el proyecto",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      setIsCreatingProject(false);
      toast({
        title: "Error al crear proyecto",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
      return { success: false, error: "Error inesperado" };
    }
  };

  const handleUpdateProject = async (projectId: string, projectData: any) => {
    const updateData: any = {};

    if (projectData.name !== undefined) updateData.name = projectData.name;
    if (projectData.description !== undefined)
      updateData.description = projectData.description;
    if (projectData.status !== undefined)
      updateData.status = projectData.status;
    if (projectData.condition !== undefined)
      updateData.condition = projectData.condition;
    if (projectData.startDate !== undefined)
      updateData.start_date = new Date(projectData.startDate);
    if (projectData.endDate !== undefined)
      updateData.end_date = projectData.endDate
        ? new Date(projectData.endDate)
        : undefined;
    if (projectData.clientId !== undefined)
      updateData.client_id = projectData.clientId || undefined;

    if (projectData.modulation !== undefined)
      updateData.modulation = projectData.modulation;
    if (projectData.height !== undefined)
      updateData.height = projectData.height;
    if (projectData.width !== undefined) updateData.width = projectData.width;
    if (projectData.depth !== undefined) updateData.depth = projectData.depth;
    if (projectData.moduleCount !== undefined)
      updateData.module_count = projectData.moduleCount;

    const result = await updateProject(projectId, updateData);
    if (result.success) {
      setEditingProject(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const result = await deleteProject(projectId);
    if (result.success) {
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto se ha eliminado exitosamente",
      });
    } else {
      toast({
        title: "Error al eliminar proyecto",
        description: result.error || "No se pudo eliminar el proyecto",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    await updateProject(projectId, {
      status: newStatus as ProjectStatus,
    });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
  };

  const handleReorderProjects = async (
    projectOrders: { id: string; projectOrder: number }[],
  ) => {
    await reorderProjects(projectOrders);
  };

  // Manejar ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredProjects =
    projects?.filter((project) => {
      const matchesSearch =
        searchTerm === "" ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description &&
          project.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  // Ordenar proyectos
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "condition":
        comparison = (a.condition || "").localeCompare(b.condition || "");
        break;
      case "startDate":
        comparison =
          new Date(a.startDate || 0).getTime() -
          new Date(b.startDate || 0).getTime();
        break;
      case "endDate":
        comparison =
          new Date(a.endDate || 0).getTime() -
          new Date(b.endDate || 0).getTime();
        break;
      case "progress":
        comparison = (a.progress || 0) - (b.progress || 0);
        break;
      case "clientName":
        const aClient = a.client?.companyName || "";
        const bClient = b.client?.companyName || "";
        comparison = aClient.localeCompare(bClient);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalItems = sortedProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = sortedProjects.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, searchTerm, statusFilter]);

  const totalProjects = projects?.length || 0;
  const activeProjects =
    projects?.filter((p) => p.status === "active").length || 0;
  const completedProjects =
    projects?.filter((p) => p.status === "completed").length || 0;
  const planningProjects =
    projects?.filter((p) => p.status === "planning").length || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    // Si venimos de eliminar un proyecto, no mostrar loading
    // para evitar el efecto de "doble spinner"
    if (justDeleted) {
      return <div className="min-h-screen" />;
    }

    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Gestión de Proyectos
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra proyectos y asigna tareas existentes
          </p>
        </div>

        {!isReadOnly && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button type="button" className="w-full sm:w-auto cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
          </Dialog>
        )}
      </div>

      <ProjectStats
        totalProjects={totalProjects}
        activeProjects={activeProjects}
        completedProjects={completedProjects}
        planningProjects={planningProjects}
      />

      <ProjectTable
        projects={paginatedProjects}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onStatusChange={!isReadOnly ? handleStatusChange : undefined}
        onReorderProjects={handleReorderProjects}
        isReadOnly={isReadOnly}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <ProjectForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateProject}
        isEditing={false}
      />

      <ProjectForm
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={(data) =>
          editingProject
            ? handleUpdateProject(editingProject.id, data)
            : Promise.resolve({ success: false, error: "No project selected" })
        }
        isEditing={true}
        initialData={editingProject}
      />

      {/* Overlay de carga fullscreen */}
      {isCreatingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Creando proyecto...</p>
          </div>
        </div>
      )}
    </div>
  );
}
