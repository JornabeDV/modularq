import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { AnalyticsPdfDocument, type AnalyticsPdfData, type PdfProject } from '@/components/analytics/analytics-pdf-document'
import { getPeriodActivityStats, getAvailablePeriods } from '@/components/analytics/analytics-utils'

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planificación',
  active: 'Activo',
  paused: 'En Pausa',
  completed: 'Completado',
  delivered: 'Entregado',
}

const STATUS_COLORS: Record<string, string> = {
  planning: '#3b82f6',
  active: '#22c55e',
  paused: '#f59e0b',
  completed: '#64748b',
  delivered: '#a855f7',
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('❌ [REPORT] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let period: 'week' | 'month'
  try {
    const body = await request.json()
    period = body.period === 'week' ? 'week' : 'month'
  } catch {
    return NextResponse.json({ error: 'Invalid request body. Expected: { period: "week" | "month" }' }, { status: 400 })
  }

  console.log(`📊 [REPORT] Generating ${period} report...`)

  const { data: rawProjects, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients!client_id (
        id,
        company_name
      ),
      project_tasks (
        id,
        project_id,
        task_id,
        status,
        estimated_hours,
        actual_hours,
        assigned_to,
        start_date,
        end_date,
        completed_at,
        created_at,
        updated_at,
        task:task_id (
          id,
          title
        ),
        assigned_user:assigned_to (
          id,
          name,
          role,
          deleted_at
        )
      )
    `)
    .order('project_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [REPORT] Error fetching projects:', error)
    return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 })
  }

  // Map raw data to the shape expected by analytics utilities (mirrors use-projects-prisma.ts)
  const projects = ((rawProjects ?? []) as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    startDate: p.start_date,
    endDate: p.end_date,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    completedAt: p.completed_at ?? undefined,
    deliveredAt: p.delivered_at ?? undefined,
    client: p.clients ? { companyName: p.clients.company_name } : undefined,
    projectTasks: (p.project_tasks || []).map((pt: any) => ({
      id: pt.id,
      projectId: pt.project_id,
      status: pt.status,
      estimatedHours: parseFloat(pt.estimated_hours) || 0,
      actualHours: parseFloat(pt.actual_hours) || 0,
      completedAt: pt.completed_at,
      task: pt.task ? { title: pt.task.title } : undefined,
      assignedUser: pt.assigned_user
        ? {
            id: pt.assigned_user.id,
            name: pt.assigned_user.name,
            role: pt.assigned_user.role,
            deletedAt: pt.assigned_user.deleted_at ?? null,
          }
        : undefined,
    })),
  }))

  // Compute derived task counts per project (mirrors project-analytics.tsx)
  const projectsWithStatus = projects.map((project) => {
    const totalTasks = project.projectTasks.length
    const completedTasks = project.projectTasks.filter((t: any) => t.status === 'completed').length
    const inProgressTasks = project.projectTasks.filter(
      (t: any) => t.status === 'in_progress' || t.status === 'assigned',
    ).length
    const pendingTasks = project.projectTasks.filter((t: any) => t.status === 'pending').length
    const cancelledTasks = project.projectTasks.filter((t: any) => t.status === 'cancelled').length
    const validTasks = totalTasks - cancelledTasks
    const completionPercentage = validTasks > 0 ? Math.round((completedTasks / validTasks) * 100) : 0

    return {
      ...project,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      cancelledTasks,
      completionPercentage,
    }
  })

  // Resolve current period key and label
  const periods = getAvailablePeriods(period)
  const currentPeriod = periods[periods.length - 1]
  const periodKey = currentPeriod.key
  const periodLabel = currentPeriod.label

  // Compute period bounds (mirrors analytics-pdf-button.tsx)
  let periodStart: Date
  let periodEnd: Date

  if (period === 'week') {
    periodStart = new Date(periodKey)
    periodStart.setHours(0, 0, 0, 0)
    periodEnd = new Date(periodStart)
    periodEnd.setDate(periodEnd.getDate() + 6)
    periodEnd.setHours(23, 59, 59, 999)
  } else {
    const [year, month] = periodKey.split('-').map(Number)
    periodStart = new Date(year, month - 1, 1)
    periodEnd = new Date(year, month, 0)
    periodEnd.setHours(23, 59, 59, 999)
  }

  const inPeriod = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d >= periodStart && d <= periodEnd
  }

  const startedByPeriod = (p: typeof projectsWithStatus[number]): boolean =>
    !p.startDate || new Date(p.startDate) <= periodEnd

  const periodProjects = projectsWithStatus.filter(startedByPeriod)

  const periodStatusCounts = {
    planning: periodProjects.filter((p) => p.status === 'planning').length,
    active: periodProjects.filter((p) => p.status === 'active').length,
    paused: periodProjects.filter((p) => p.status === 'paused').length,
    completed: projectsWithStatus.filter(
      (p) => p.status === 'completed' && inPeriod(p.completedAt ?? p.updatedAt),
    ).length,
    delivered: projectsWithStatus.filter(
      (p) => p.status === 'delivered' && inPeriod(p.deliveredAt ?? p.updatedAt),
    ).length,
  }

  const ACTIVE_STATUSES = new Set(['planning', 'active', 'paused'])
  const activeTaskStats = periodProjects
    .filter((p) => ACTIVE_STATUSES.has(p.status))
    .reduce(
      (acc, p) => {
        acc.pending += p.pendingTasks
        acc.in_progress += p.inProgressTasks
        acc.completed += p.completedTasks
        acc.cancelled += p.cancelledTasks
        return acc
      },
      { pending: 0, in_progress: 0, completed: 0, cancelled: 0 },
    )

  const mapProject = (p: typeof projectsWithStatus[number]): PdfProject => ({
    name: p.name,
    statusLabel: STATUS_LABELS[p.status] ?? p.status,
    statusColor: STATUS_COLORS[p.status] ?? '#94a3b8',
    completionPercentage: p.completionPercentage,
    completedTasks: p.completedTasks,
    pendingTasks: p.pendingTasks,
    inProgressTasks: p.inProgressTasks,
    totalTasks: p.totalTasks,
    estimatedHours: p.projectTasks.reduce((s: number, t: any) => s + t.estimatedHours, 0),
    actualHours: p.projectTasks.reduce((s: number, t: any) => s + t.actualHours, 0),
    pendingTaskNames: p.projectTasks
      .filter((t: any) => t.status === 'pending')
      .map((t: any) => t.task?.title ?? ''),
    startDate: p.startDate
      ? new Date(p.startDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null,
    endDate: p.endDate
      ? new Date(p.endDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null,
    daysUntilDeadline: p.endDate
      ? Math.ceil(
          (new Date(p.endDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000,
        )
      : null,
    clientName: p.client?.companyName ?? null,
    completedAt: p.completedAt
      ? new Date(p.completedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null,
    deliveredAt: p.deliveredAt
      ? new Date(p.deliveredAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null,
  })

  const pdfData: AnalyticsPdfData = {
    generatedAt: new Date(),
    periodMode: period,
    periodLabel,
    projects: projectsWithStatus.filter(startedByPeriod).map(mapProject),
    deliveredProjects: projectsWithStatus
      .filter((p) => p.status === 'delivered' && inPeriod(p.deliveredAt ?? p.updatedAt))
      .map(mapProject),
    completedProjects: projectsWithStatus
      .filter((p) => p.status === 'completed' && inPeriod(p.completedAt ?? p.updatedAt))
      .map(mapProject),
    pausedProjects: projectsWithStatus
      .filter((p) => p.status === 'paused' && startedByPeriod(p))
      .map(mapProject),
    planningProjects: projectsWithStatus
      .filter((p) => p.status === 'planning' && startedByPeriod(p))
      .map(mapProject),
    statusCounts: periodStatusCounts,
    taskStats: activeTaskStats,
    periodActivity: getPeriodActivityStats(projectsWithStatus, period, periodKey),
  }

  console.log(`📄 [REPORT] Rendering PDF for period: ${periodLabel}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(AnalyticsPdfDocument, { data: pdfData }) as any,
  )

  const fileName = `Reporte_${period === 'week' ? 'Semanal' : 'Mensual'}_${periodLabel.replace(/\s/g, '_')}.pdf`

  console.log(`✅ [REPORT] PDF generated successfully: ${fileName} (${buffer.length} bytes)`)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}
