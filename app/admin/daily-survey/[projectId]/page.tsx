"use client";

import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard";
import { DailySurveyProjectTasks } from "@/components/admin/daily-survey/daily-survey-project-tasks";

export default function DailySurveyProjectPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-2 sm:p-6 space-y-3 sm:space-y-6">
          <DailySurveyProjectTasks projectId={projectId} />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  );
}
