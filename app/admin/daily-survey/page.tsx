"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard";
import { DailySurveyProjectsList } from "@/components/admin/daily-survey/daily-survey-projects-list";

export default function DailySurveyPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <DailySurveyProjectsList />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  );
}
