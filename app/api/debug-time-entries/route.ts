import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 [DEBUG] Checking time_entries status...')
    
    // Deshabilitar cache para obtener datos frescos
    const headers = new Headers()
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    
    // Obtener todas las sesiones activas (sin end_time)
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('time_entries')
      .select(`
        id,
        user_id,
        task_id,
        project_id,
        start_time,
        hours,
        end_time,
        description,
        created_at,
        updated_at
      `)
      .is('end_time', null)
      .order('start_time', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching active sessions:', sessionsError)
      return NextResponse.json({ error: 'Error fetching active sessions' }, { status: 500 })
    }

    // Obtener información de las tareas relacionadas
    const taskIds = [...new Set(activeSessions?.map((s: any) => s.task_id) || [])]
    
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, estimated_hours')
      .in('id', taskIds)

    const { data: projectTasks, error: projectTasksError } = await supabase
      .from('project_tasks')
      .select('id, status, actual_hours, task_id')
      .in('task_id', taskIds)

    // Crear mapas para acceso rápido
    const tasksMap = new Map(tasks?.map((t: any) => [t.id, t]) || [])
    const projectTasksMap = new Map(projectTasks?.map((pt: any) => [pt.task_id, pt]) || [])

    const sessionsWithDetails = activeSessions?.map((session: any) => {
      const task = tasksMap.get(session.task_id)
      const projectTask = projectTasksMap.get(session.task_id)
      
      const startTime = new Date(session.start_time)
      const now = new Date()
      const sessionElapsedMs = now.getTime() - startTime.getTime()
      const sessionElapsedHours = sessionElapsedMs / (1000 * 60 * 60)
      
      const previousHours = (projectTask as any)?.actual_hours || 0
      const totalWorkedHours = previousHours + sessionElapsedHours
      
      let maxTotalHours = 2
      if ((task as any)?.estimated_hours) {
        maxTotalHours = (task as any).estimated_hours * 1.2 // 20% extra
      }
      
      return {
        sessionId: session.id,
        taskId: session.task_id,
        taskTitle: (task as any)?.title || 'Unknown',
        projectTaskStatus: (projectTask as any)?.status || 'Unknown',
        startTime: session.start_time,
        sessionElapsedHours: sessionElapsedHours,
        totalWorkedHours: totalWorkedHours,
        maxTotalHours: maxTotalHours,
        exceedsLimit: totalWorkedHours >= maxTotalHours,
        shouldBeCut: totalWorkedHours >= maxTotalHours && (projectTask as any)?.status !== 'completed',
        userId: session.user_id,
        projectId: session.project_id
      }
    }) || []

    return NextResponse.json({
      message: 'Time entries debug information',
      totalActiveSessions: activeSessions?.length || 0,
      sessionsWithDetails: sessionsWithDetails,
      timestamp: new Date().toISOString()
    }, { headers })

  } catch (error) {
    console.error('❌ [DEBUG] Error in debug-time-entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
