"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Zap } from "lucide-react";
import { ProjectDocumentsViewer } from "@/components/projects/project-documents-viewer";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useProjectOperariosPrisma } from "@/hooks/use-project-operarios-prisma";
import { useAuth } from "@/lib/auth-context";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { projects, loading: projectsLoading } = useProjectsPrisma();
  const { projectOperarios, loading: operariosLoading } =
    useProjectOperariosPrisma(params.id);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (projects.length > 0) {
      const foundProject = projects.find((p) => p.id === params.id);
      setProject(foundProject || null);
    }
  }, [projects, params.id]);

  const isAssignedToProject =
    projectOperarios?.some((po) => po.user_id === user?.id) || false;

  if (projectsLoading || operariosLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando proyecto...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">
              Proyecto no encontrado
            </h2>
            <p className="text-muted-foreground mt-2">
              El proyecto solicitado no existe
            </p>
            <Button
              onClick={() => router.push("/projects")}
              className="mt-4 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Proyectos
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!operariosLoading && !isAssignedToProject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">
              Acceso Denegado
            </h2>
            <p className="text-muted-foreground mt-2">
              No tienes acceso a este proyecto. Contacta con tu administrador.
            </p>
            <Button
              onClick={() => router.push("/projects")}
              className="mt-4 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Proyectos
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getDaysRemaining = () => {
    if (!project.endDate) return null;
    const endDate = new Date(project.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  
  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/projects")}
              className="shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-balance leading-tight">
                {project.name}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1 line-clamp-2">
                {project.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Activo
            </Badge>
            {daysRemaining !== null && (
              <Badge
                variant={
                  daysRemaining < 7
                    ? "destructive"
                    : daysRemaining < 14
                    ? "secondary"
                    : "outline"
                }
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                {daysRemaining > 0 ? `${daysRemaining} días` : "Vencido"}
              </Badge>
            )}
          </div>
        </div>

        <ProjectDocumentsViewer projectId={params.id} />
      </div>
    </MainLayout>
  );
}
