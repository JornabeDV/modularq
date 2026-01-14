"use client";

import { useState } from "react";
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
import type { ProjectTask } from "@/lib/types";

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const isReadOnly = userProfile?.role === "supervisor";

  const {
    project,
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
  } = useProjectDetail({
    projectId,
    userId: user?.id,
    isReadOnly,
  });

  const { files: projectFiles } = useProjectFiles(
    projectId,
    user?.id || "",
    userProfile?.role === "admin" || userProfile?.role === "supervisor"
  );

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

  const handleTaskSave = async (taskId: string, data: Partial<ProjectTask>) => {
    await handleUpdateTask(taskId, data);
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

  if (projectsError || !project) {
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

  const showFiles =
    userProfile?.role === "admin" || userProfile?.role === "supervisor";

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        isReadOnly={isReadOnly}
        isEditDialogOpen={isEditDialogOpen}
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
          />

          <TaskForm
            isOpen={isTaskDialogOpen}
            onClose={() => setIsTaskDialogOpen(false)}
            onSubmit={handleCreateTask}
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
