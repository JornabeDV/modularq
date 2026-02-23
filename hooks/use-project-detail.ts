import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useProjectTasksPrisma } from "@/hooks/use-project-tasks-prisma";
import { useTasksPrisma, type UpdateTaskData } from "@/hooks/use-tasks-prisma";
import { mapProjectFormData } from "@/lib/utils/project-utils";
import type { Project, ProjectTask, Task } from "@/lib/types";

interface UseProjectDetailProps {
  projectId: string;
  userId?: string;
  isReadOnly?: boolean;
  checklist?: any[];
  checklistItems?: any[];
}

export function useProjectDetail({
  projectId,
  userId,
  checklist = [],
  checklistItems = [],
}: UseProjectDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    updateProject,
    deleteProject,
  } = useProjectsPrisma();
  const {
    projectTasks,
    createProjectTask,
    updateProjectTask,
    deleteProjectTask,
    updateTaskOrder,
    refetch: refetchProjectTasks,
  } = useProjectTasksPrisma(projectId);
  const { tasks: allTasks, updateTask } = useTasksPrisma();

  const [project, setProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  // Find project from projects list
  useEffect(() => {
    if (projects.length > 0) {
      const foundProject = projects.find((p) => p.id === projectId);
      setProject(foundProject || null);
    }
  }, [projects, projectId]);

  // Ensure task status is "pending" if project is in planning
  useEffect(() => {
    if (
      editingTask &&
      project?.status === "planning" &&
      editingTask.status !== "pending"
    ) {
      setEditingTask({ ...editingTask, status: "pending" as any });
    }
  }, [editingTask, project?.status]);

  const handleUpdateProject = useCallback(
    async (projectData: Partial<Project>) => {
      if (!project) return;

      // ✅ VALIDACIÓN: Si se intenta activar proyecto desde edición, verificar checklist
      if (projectData.status === "active" && project.status === "planning") {
        const checklistComplete = checklistItems.every(item =>
          checklist.find(c => c.checklist_item === item)?.is_completed === true
        );

        if (!checklistComplete) {
          console.error("❌ No se puede activar proyecto desde edición: checklist incompleto");

          // Mostrar toast de error
          toast({
            title: "No se puede activar el proyecto",
            description: "Debe completar toda la planificación antes de activar el proyecto.",
            variant: "destructive",
          });

          return {
            success: false,
            error: "Checklist de planificación incompleto. Complete todos los elementos antes de activar el proyecto."
          };
        }
      }

      const mappedData = mapProjectFormData(projectData);
      const result = await updateProject(project.id, mappedData);

      if (!result.success) {
        console.error("❌ Error actualizando proyecto:", result.error);
      }

      return result;
    },
    [project, updateProject, checklist, checklistItems, toast]
  );

  const handleActivateProject = useCallback(async () => {
    if (!project) return;

    const result = await updateProject(project.id, {
      status: "active",
      start_date: new Date(),
    });

    return result;
  }, [project, updateProject]);

  const handleDeactivateProject = useCallback(async () => {
    if (!project) return;

    const result = await updateProject(project.id, {
      status: "planning",
    });

    return result;
  }, [project, updateProject]);

  const handleDeleteProject = useCallback(async () => {
    if (!project) return;
    await deleteProject(project.id);
    router.push("/admin/projects");
  }, [project, deleteProject, router]);

  const handleCreateTask = useCallback(
    async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      if (!userId || !project) return;

      try {
        const { data: createdTask, error: taskError } = await supabase
          .from("tasks")
          .insert({
            title: taskData.title,
            description: taskData.description,
            estimated_hours: taskData.estimatedHours,
            category: taskData.category,
            type: taskData.type || "custom",
            created_by: userId,
          })
          .select()
          .single();

        if (taskError) {
          console.error("Error creating task:", taskError);
          toast({
            title: "Error",
            description: "No se pudo crear la tarea",
            variant: "destructive",
          });
          return { success: false };
        }

        const projectTaskResult = await createProjectTask({
          projectId: project.id,
          taskId: createdTask.id,
        });

        if (projectTaskResult.success) {
          toast({
            title: "✓ Tarea creada y asignada",
            description: `${taskData.title} ha sido creada y asignada al proyecto`,
            variant: "default",
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo asignar la tarea al proyecto",
            variant: "destructive",
          });
        }

        return projectTaskResult;
      } catch (error) {
        console.error("Error in handleCreateTask:", error);
        toast({
          title: "Error inesperado",
          description: "Ocurrió un error al crear la tarea",
          variant: "destructive",
        });
        return { success: false };
      }
    },
    [userId, project, createProjectTask, toast]
  );

  const handleUpdateTask = useCallback(
    async (
      projectTaskId: string,
      taskData: Partial<ProjectTask>,
      relatedTaskUpdates?: Partial<Task>,
    ) => {
      const updateData: any = {};
      if (taskData.status !== undefined) updateData.status = taskData.status;
      if (taskData.actualHours !== undefined)
        updateData.actualHours = taskData.actualHours;
      if (taskData.progressPercentage !== undefined)
        updateData.progressPercentage = taskData.progressPercentage;
      if (taskData.notes !== undefined) updateData.notes = taskData.notes;
      if (taskData.startDate !== undefined)
        updateData.startDate = taskData.startDate;
      if (taskData.endDate !== undefined) updateData.endDate = taskData.endDate;
      if (taskData.assignedTo !== undefined)
        updateData.assignedTo = taskData.assignedTo;

      const result = await updateProjectTask(projectTaskId, updateData, false, userId);
      const currentTask = projectTasks.find((pt) => pt.id === projectTaskId);
      const relatedTaskId = currentTask?.taskId;
      if (relatedTaskUpdates && relatedTaskId) {
        const taskUpdateData: UpdateTaskData = {
          title: relatedTaskUpdates.title,
          description: relatedTaskUpdates.description,
          category: relatedTaskUpdates.category,
          type: relatedTaskUpdates.type,
          estimated_hours: relatedTaskUpdates.estimatedHours,
        };
        try {
          await updateTask(relatedTaskId, taskUpdateData);
        } catch (err) {
          console.error("Error syncing task metadata:", err);
        }
      }
      if (result.success) {
        setEditingTask(null);
        if (refetchProjectTasks) {
          await refetchProjectTasks();
        }
        toast({
          title: "✓ Tarea actualizada",
          description: `${relatedTaskUpdates?.title || "La tarea"} se guardó correctamente`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error al editar tarea",
          description:
            result.error || "No se pudo guardar la tarea. Intenta nuevamente.",
          variant: "destructive",
        });
      }
      return result;
    },
  [updateProjectTask, userId, projectTasks, updateTask]
  );

  const handleEditTask = useCallback(
    (task: ProjectTask) => {
      const taskToEdit =
        project?.status === "planning"
          ? { ...task, status: "pending" as any }
          : task;
      setEditingTask(taskToEdit);
    },
    [project?.status]
  );

  const handleCompleteTask = useCallback(
    async (task: ProjectTask) => {
      const actualHours =
        task.actualHours > 0
          ? task.actualHours
          : task.estimatedHours || task.task?.estimatedHours || 0;

      // Close active time entries
      if (task.taskId && projectId) {
        try {
          const now = new Date();
          const { data: activeEntries } = await supabase
            .from("time_entries")
            .select("id, start_time, description")
            .eq("task_id", task.taskId)
            .eq("project_id", projectId)
            .is("end_time", null);

          if (activeEntries && activeEntries.length > 0) {
            for (const entry of activeEntries) {
              const startTime = new Date(entry.start_time);
              const elapsedMs = now.getTime() - startTime.getTime();
              const elapsedHours = elapsedMs / (1000 * 60 * 60);

              await supabase
                .from("time_entries")
                .update({
                  end_time: now.toISOString(),
                  hours: elapsedHours,
                  description:
                    entry.description || "Sesión cerrada al completar la tarea",
                })
                .eq("id", entry.id);
            }
          }
        } catch (err) {
          console.error("Error closing active sessions:", err);
        }
      }

      const result = await updateProjectTask(task.id, {
        status: "completed",
        endDate: new Date().toISOString(),
        actualHours: actualHours,
      }, false, userId);

      if (result.success) {
        toast({
          title: "✓ Tarea completada",
          description: `${task.task?.title || "La tarea"} ha sido marcada como completada`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo completar la tarea",
          variant: "destructive",
        });
      }

      return result;
    },
    [projectId, updateProjectTask, toast]
  );

  const handleAssignTask = useCallback(
    async (taskId: string) => {
      if (!userId || !project) return;

      const result = await createProjectTask({
        projectId: project.id,
        taskId: taskId,
      });

      if (result.success) {
        const taskName = allTasks.find((t) => t.id === taskId)?.title || "tarea";
        toast({
          title: "✓ Tarea asignada",
          description: `${taskName} ha sido asignada al proyecto`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo asignar la tarea",
          variant: "destructive",
        });
      }

      return result;
    },
    [userId, project, createProjectTask, allTasks, toast]
  );

  const handleUnassignTask = useCallback(
    async (projectTaskId: string) => {
      const result = await deleteProjectTask(projectTaskId);
      if (result.success) {
        toast({
          title: "Tarea eliminada",
          description: "La tarea se eliminó del proyecto correctamente.",
        });
      } else {
        toast({
          title: "Error al eliminar tarea",
          description:
            result.error || "No se pudo eliminar la tarea. Probá nuevamente.",
          variant: "destructive",
        });
      }
      return result;
    },
    [deleteProjectTask, toast]
  );

  const handleReorderTasks = useCallback(
    async (taskOrders: { id: string; taskOrder: number }[]) => {
      const result = await updateTaskOrder(taskOrders);
      if (!result.success) {
        console.error("Error actualizando orden de tareas:", result.error);
      }
      return result;
    },
    [updateTaskOrder]
  );

  return {
    project,
    projects,
    projectsLoading,
    projectsError,
    projectTasks,
    editingTask,
    setEditingTask,
    handleUpdateProject,
    handleActivateProject,
    handleDeactivateProject,
    handleDeleteProject,
    handleCreateTask,
    handleUpdateTask,
    handleEditTask,
    handleCompleteTask,
    handleAssignTask,
    handleUnassignTask,
    handleReorderTasks,
  };
}
