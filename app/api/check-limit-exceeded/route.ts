import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MAX_EXTRA_PERCENTAGE = 0.20 // 20% extra del tiempo estimado

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización del cron job
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ [CRON] Unauthorized cron job request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 [CRON] Checking for tasks exceeding estimated hours...')

    // Obtener tareas en progreso que puedan haber excedido el límite
    const { data: projectTasks, error: projectTasksError } = await supabase
      .from('project_tasks')
      .select('id, task_id, actual_hours, estimated_hours, status')
      .eq('status', 'in_progress')

    if (projectTasksError) {
      console.error('Error fetching project tasks:', projectTasksError)
      return NextResponse.json({ error: 'Error fetching project tasks' }, { status: 500 })
    }

    if (!projectTasks || projectTasks.length === 0) {
      console.log('✅ No in-progress tasks found')
      return NextResponse.json({
        message: 'No in-progress tasks found',
        exceededTasks: 0,
        timestamp: new Date().toISOString()
      })
    }

    const exceededTasks: any[] = []

    for (const projectTask of projectTasks) {
      const actualHours = projectTask.actual_hours || 0
      const estimatedHours = projectTask.estimated_hours || 0
      const maxTotalHours = estimatedHours > 0
        ? estimatedHours * (1 + MAX_EXTRA_PERCENTAGE)
        : 2 // 2 horas por defecto si no hay tiempo estimado

      if (actualHours < maxTotalHours) continue

      const cutoffTime = new Date()
      const cutoffDescription = `Corte automático: Tarea excedió límite de tiempo (${maxTotalHours.toFixed(2)}h). Trabajado: ${actualHours.toFixed(2)}h. Sistema completó automáticamente.`

      const { error: updateError } = await supabase
        .from('project_tasks')
        .update({
          status: 'completed',
          end_date: cutoffTime.toISOString(),
          progress_percentage: 100,
          notes: cutoffDescription,
          updated_at: cutoffTime.toISOString()
        })
        .eq('id', projectTask.id)

      if (updateError) {
        console.error(`❌ [CRON] Error completing project task ${projectTask.id}:`, updateError)
        continue
      }

      exceededTasks.push({
        projectTaskId: projectTask.id,
        taskId: projectTask.task_id,
        actualHours,
        maxHours: maxTotalHours,
        excessHours: actualHours - maxTotalHours,
        cutoffTime: cutoffTime.toISOString()
      })

      console.log(`✅ [CRON] Project task ${projectTask.id} marked as completed due to time limit`)
    }

    console.log(`🎯 [CRON] Found ${exceededTasks.length} tasks exceeding limits (auto-completed)`)

    return NextResponse.json({
      message: `Checked ${projectTasks.length} in-progress tasks for limit violations`,
      exceededTasks: exceededTasks.length,
      exceededDetails: exceededTasks,
      timestamp: new Date().toISOString(),
      note: 'Tasks exceeding estimated hours + 20% are automatically completed'
    })

  } catch (error) {
    console.error('❌ [CRON] Error in check-limit-exceeded:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🔍 [CRON] Check-limit-exceeded endpoint is reachable via GET')

    return NextResponse.json({
      message: 'Cron job endpoint working via GET',
      timestamp: new Date().toISOString(),
      method: 'GET'
    })

  } catch (error) {
    console.error('❌ [CRON] Error in check-limit-exceeded GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
