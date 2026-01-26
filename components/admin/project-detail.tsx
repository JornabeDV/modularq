"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "./project-form";
import { TaskForm } from "./task-form";
import { ProjectTaskManager } from "./project-task-manager";
import { ProjectOperariosManager } from "./project-operarios-manager";
import { FileUpload } from "@/components/projects/file-upload";
import { useProjectFiles } from "@/hooks/use-project-files";
import { useAuth } from "@/lib/auth-context";
import { useProjectDetail } from "@/hooks/use-project-detail";
import { ProjectHeader } from "./project-detail/project-header";
import { ProjectInfoCards } from "./project-detail/project-info-cards";
import { ProjectSpecs } from "./project-detail/project-specs";
import { EditTaskDialog } from "./project-detail/edit-task-dialog";
import { ActivateProjectDialog } from "./project-detail/activate-project-dialog";
import { PlanningChecklist } from "./planning-checklist";
import { useProjectPlanningChecklist } from "@/hooks/use-project-planning-checklist";
import type { Project, ProjectTask, Task } from "@/lib/types";

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const isReadOnly = userProfile?.role === "supervisor";

  const checklistHook = useProjectPlanningChecklist(projectId, user?.id || "");
  const { checklist, checklistItems } = checklistHook;

  const projectDetailResult = useProjectDetail({
    projectId,
    userId: user?.id,
    isReadOnly,
    checklist,
    checklistItems,
  });

  const {
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
  } = projectDetailResult as typeof projectDetailResult & { projects: Project[] };

  const { files: projectFiles } = useProjectFiles(
    projectId,
    user?.id || "",
    userProfile?.role === "admin" || userProfile?.role === "supervisor"
  );

  const [showActivateButton, setShowActivateButton] = useState(false);

  const handleChecklistChange = useCallback(
    (updatedChecklist?: typeof checklist) => {
      const currentChecklist = updatedChecklist || checklist;
      const allCompleted = checklistItems.every(
        (item) =>
          currentChecklist.find((c) => c.checklist_item === item)
            ?.is_completed === true
      );
      setShowActivateButton(allCompleted);
    },
    [checklist, checklistItems]
  );

  const handleCreateTaskAndClose = useCallback(
    async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      const result = await handleCreateTask(taskData);
      if (result?.success) {
        setIsTaskDialogOpen(false);
      }
      return result;
    },
    [handleCreateTask]
  );

  useEffect(() => {
    handleChecklistChange();
  }, [handleChecklistChange]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);

  const handleActivateClick = () => setIsActivateDialogOpen(true);
  const handleDeactivateClick = () => setIsDeactivateDialogOpen(true);

  const confirmActivate = async () => {
    const result = await handleActivateProject();
    if (result?.success) {
      setIsActivateDialogOpen(false);
    }
  };

  const confirmDeactivate = async () => {
    const result = await handleDeactivateProject();
    if (result?.success) {
      setIsDeactivateDialogOpen(false);
    }
  };

  const handleTaskSave = async (
    taskId: string,
    projectTaskData: Partial<ProjectTask>,
    baseTaskData?: Partial<Task>,
  ) => {
    await handleUpdateTask(taskId, projectTaskData, baseTaskData);
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (projectsError || (!projectsLoading && projects.length > 0 && !project)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">
            Proyecto no encontrado
          </h2>
          <p className="text-muted-foreground mt-2">
            {projectsError || "El proyecto solicitado no existe"}
          </p>
          <Button
            onClick={() => router.push("/admin/projects")}
            className="mt-4 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Proyectos
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const showFiles =
    userProfile?.role === "admin" || userProfile?.role === "supervisor";

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project!}
        isReadOnly={isReadOnly}
        isEditDialogOpen={isEditDialogOpen}
        showActivateButton={showActivateButton}
        onEditClick={() => setIsEditDialogOpen(!isEditDialogOpen)}
        onActivateClick={handleActivateClick}
        onDeactivateClick={handleDeactivateClick}
        onDelete={handleDeleteProject}
      />

      <ProjectInfoCards
        project={project}
        projectTasksCount={projectTasks.length}
        projectFilesCount={projectFiles.length}
        showFiles={showFiles}
      />

      <ProjectSpecs project={project} />

      {(project.status === "planning" || project.status === "active") && (
        <PlanningChecklist
          projectId={project.id}
          userId={user?.id || ""}
          onChecklistChange={handleChecklistChange}
          isReadOnly={project.status === "active"} // Solo lectura cuando está activo
        />
      )}

      <ProjectOperariosManager projectId={project.id} isReadOnly={isReadOnly} />

      {showFiles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Archivos del Proyecto
            </CardTitle>
            <CardDescription>
              Gestiona documentos PDF, Excel y otros archivos relacionados con
              este proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              projectId={project.id}
              userId={user?.id || ""}
              existingFiles={projectFiles}
              isReadOnly={isReadOnly}
            />
          </CardContent>
        </Card>
      )}

      <ProjectTaskManager
        projectId={project.id}
        projectTasks={projectTasks}
        projectStatus={project.status}
        onAssignTask={handleAssignTask}
        onUnassignTask={handleUnassignTask}
        onEditTask={handleEditTask}
        onCompleteTask={handleCompleteTask}
        onCreateTask={() => setIsTaskDialogOpen(true)}
        onReorderTasks={handleReorderTasks}
        isReadOnly={isReadOnly}
      />

      <EditTaskDialog
        isOpen={!!editingTask}
        task={editingTask}
        project={project}
        onClose={() => setEditingTask(null)}
        onSave={handleTaskSave}
      />

      {!isReadOnly && (
        <>
          <ProjectForm
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onSubmit={handleUpdateProject}
            isEditing={true}
            initialData={project}
            checklistComplete={showActivateButton}
          />

          <TaskForm
            isOpen={isTaskDialogOpen}
            onClose={() => setIsTaskDialogOpen(false)}
            onSubmit={handleCreateTaskAndClose}
            isEditing={false}
            projectId={project.id}
          />

          <ActivateProjectDialog
            isOpen={isActivateDialogOpen}
            type="activate"
            onClose={() => setIsActivateDialogOpen(false)}
            onConfirm={confirmActivate}
          />

          <ActivateProjectDialog
            isOpen={isDeactivateDialogOpen}
            type="deactivate"
            onClose={() => setIsDeactivateDialogOpen(false)}
            onConfirm={confirmDeactivate}
          />
        </>
      )}
    </div>
  );
}
