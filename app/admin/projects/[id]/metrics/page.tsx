"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProjectFiles } from "@/hooks/use-project-files";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { HeaderSection } from "@/components/admin/metrics/header-section";
import { SummaryCard } from "@/components/admin/metrics/summary-card";
import { ProjectFilesCard } from "@/components/admin/metrics/project-files-card";
import { OperarioDistributionCard } from "@/components/admin/metrics/operario-distribution-card";
import { TaskMetricsCard } from "@/components/admin/metrics/task-metrics-card";
import { buildProjectMetrics } from "@/components/admin/metrics/metrics-helpers";
import { SubcontractorDistributionCard } from "@/components/admin/metrics/subcontractor-distributon-card";

export default function ProjectMetricsPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const { projects, loading } = useProjectsPrisma();
  const { user } = useAuth();
  const { files: projectFiles, loading: filesLoading } = useProjectFiles(
    projectId,
    user?.id || "",
    true
  );
  const isMobile = useIsMobile();

  const project = projects?.find((p) => p.id === projectId);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Cargando métricas del proyecto...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Proyecto no encontrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              El proyecto que buscas no existe o no tienes permisos para verlo
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const metrics = buildProjectMetrics(project);
  const taskProgress =
    metrics.totalTasks > 0
      ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
      : 0;
  const timeProgress =
    metrics.estimatedHours > 0
      ? Math.min(
          Math.round(
            (metrics.completedEstimatedHours / metrics.estimatedHours) * 100
          ),
          100
        )
      : 0;

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <HeaderSection project={project} />
          <SummaryCard
            project={project}
            metrics={metrics}
            taskProgress={taskProgress}
            timeProgress={timeProgress}
            isMobile={isMobile}
          />
          <ProjectFilesCard
            projectFiles={projectFiles}
            filesLoading={filesLoading}
          />
          <OperarioDistributionCard project={project} />
          <SubcontractorDistributionCard project={project} />
          <TaskMetricsCard project={project} projectId={projectId} />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  );
}
