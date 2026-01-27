import type { Project } from "@/lib/types";

export const PROJECT_STATUS_CONFIG = {
  planning: { label: "Planificación", color: "secondary" as const },
  active: { label: "Activo", color: "default" as const },
  paused: { label: "En Pausa", color: "destructive" as const },
  completed: { label: "Completado", color: "default" as const },
  delivered: { label: "Entregado", color: "default" as const },
  cancelled: { label: "Cancelado", color: "destructive" as const },
} as const;

export function getStatusInfo(status: string) {
  return (
    PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG] || {
      label: status,
      color: "default" as const,
    }
  );
}

export function formatProjectDate(dateString?: string): string {
  if (!dateString) return "Sin fecha";

  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function mapProjectFormData(projectData: Partial<Project>) {
  return {
    name: projectData.name,
    description: projectData.description,
    status: projectData.status,
    start_date: projectData.startDate
      ? new Date(projectData.startDate)
      : undefined,
    end_date: projectData.endDate ? new Date(projectData.endDate) : undefined,
    client_id: projectData.clientId,
    modulation: projectData.modulation,
    height: projectData.height,
    width: projectData.width,
    depth: projectData.depth,
    module_count: projectData.moduleCount,
  };
}

/**
 * @param percentage - Porcentaje de progreso (0-100)
 * @returns Color HSL como string
 */
export function getProgressColor(percentage: number): string {
  if (percentage === 100) return "hsl(142, 76%, 36%)"; // green-600
  if (percentage >= 75) return "hsl(262, 83%, 58%)"; // purple-500
  if (percentage >= 50) return "hsl(25, 95%, 53%)"; // orange-500
  if (percentage >= 25) return "hsl(45, 93%, 47%)"; // yellow-500
  return "hsl(217, 91%, 60%)"; // blue-500
}

export function getProjectStats (project: any) {
  const activeTasks =
    project.projectTasks?.filter((pt: any) => pt.status !== "cancelled") ||
    [];
  const totalTasks = activeTasks.length;
  const completedTasks =
    activeTasks.filter((pt: any) => pt.status === "completed").length || 0;
  const inProgressTasks =
    activeTasks.filter((pt: any) => pt.status === "in_progress").length || 0;
  const pendingTasks =
    activeTasks.filter((pt: any) => pt.status === "pending").length || 0;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    progressPercentage,
  };
};

export function getProjectWorkersCount(project: any) {
  const operarios =
    project.projectOperarios?.filter(
      (po: any) => po.user?.role === "operario",
    ) ?? [];

  const subcontratistas =
    project.projectOperarios?.filter(
      (po: any) => po.user?.role === "subcontratista",
    ) ?? [];

  return {
    operariosCount: operarios.length,
    subcontratistasCount: subcontratistas.length,
  };
};
