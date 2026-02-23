"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard";
import { ProjectAnalytics } from "@/components/analytics/project-analytics";

export default function AnalyticsPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <ProjectAnalytics />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  );
}
