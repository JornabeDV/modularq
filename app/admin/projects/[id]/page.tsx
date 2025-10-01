"use client"

import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { ProjectDetail } from '@/components/admin/project-detail'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <ProjectDetail projectId={projectId} />
      </div>
    </MainLayout>
  )
}