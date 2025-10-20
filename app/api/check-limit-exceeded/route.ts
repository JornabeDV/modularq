import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MAX_EXTRA_PERCENTAGE = 0.20 // 20% extra del tiempo estimado

export async function POST(request: NextRequest) {
  try {
    // Obtener sesiones activas de más de 1 hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('time_entries')
      .select(`
        id,
        user_id,
        task_id,
        project_id,
        start_time,
        hours,
        end_time
      `)
      .is('end_time', null)
      .lt('start_time', oneHourAgo)
      .order('start_time', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching active sessions:', sessionsError)
      return NextResponse.json({ error: 'Error fetching active sessions' }, { status: 500 })
    }

    if (!activeSessions || activeSessions.length === 0) {
      return NextResponse.json({ 
        message: 'No active sessions to check', 
        exceededTasks: 0,
        timestamp: new Date().toISOString()
      })
    }

    // Obtener información de tareas
    const taskIds = [...new Set(activeSessions.map(s => s.task_id))]
    
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, estimated_hours')
      .in('id', taskIds)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json({ error: 'Error fetching task details' }, { status: 500 })
    }

    const { data: projectTasks, error: projectTasksError } = await supabase
      .from('project_tasks')
      .select('id, status, actual_hours, task_id')
      .in('task_id', taskIds)

    if (projectTasksError) {
      console.error('Error fetching project tasks:', projectTasksError)
      return NextResponse.json({ error: 'Error fetching project task details' }, { status: 500 })
    }

    // Crear mapas para acceso rápido
    const tasksMap = new Map(tasks?.map(t => [t.id, t]) || [])
    const projectTasksMap = new Map(projectTasks?.map(pt => [pt.task_id, pt]) || [])

    let exceededTasksCount = 0
    const exceededTasks = []

    for (const session of activeSessions) {
      try {
        const task = tasksMap.get(session.task_id)
        const projectTask = projectTasksMap.get(session.task_id)
        
        if (!task || projectTask?.status === 'completed') {
          continue
        }

        const startTime = new Date(session.start_time)
        const now = new Date()
        const sessionElapsedMs = now.getTime() - startTime.getTime()
        const sessionElapsedHours = sessionElapsedMs / (1000 * 60 * 60)

        // Calcular tiempo total trabajado
        const previousHours = projectTask?.actual_hours || 0
        const totalWorkedHours = previousHours + sessionElapsedHours

        // Determinar límite máximo (20% extra del tiempo estimado)
        let maxTotalHours = 2 // 2 horas por defecto si no hay tiempo estimado
        
        if (task.estimated_hours) {
          maxTotalHours = task.estimated_hours * (1 + MAX_EXTRA_PERCENTAGE) // Tiempo estimado + 20%
        }

        // Verificar si excede el límite y hacer corte automático
        if (totalWorkedHours >= maxTotalHours) {
          exceededTasksCount++
          
          const exceededData = {
            taskId: task.id,
            taskTitle: task.title,
            totalHours: totalWorkedHours,
            maxHours: maxTotalHours,
            sessionElapsedHours: sessionElapsedHours,
            previousHours: previousHours,
            sessionStartTime: session.start_time,
            sessionId: session.id,
            userId: session.user_id,
            projectId: session.project_id,
            excessHours: totalWorkedHours - maxTotalHours
          }
          
          exceededTasks.push(exceededData)

          // CORTE AUTOMÁTICO: Completar la tarea automáticamente
          if (projectTask) {
            const now = new Date()
            
            // Actualizar project_task como completada
            const { error: updateTaskError } = await supabase
              .from('project_tasks')
              .update({
                status: 'completed',
                end_date: now.toISOString(),
                actual_hours: totalWorkedHours,
                progress_percentage: 100,
                updated_at: now.toISOString()
              })
              .eq('id', projectTask.id)

            if (updateTaskError) {
              console.error('Error updating project task:', updateTaskError)
            }

            // Finalizar la sesión de tiempo con descripción del corte automático
            const cutoffDescription = `Corte automático: Tarea excedió límite de tiempo (${maxTotalHours.toFixed(2)}h). Trabajado: ${totalWorkedHours.toFixed(2)}h. Sistema completó automáticamente.`
            
            const { error: updateSessionError } = await supabase
              .from('time_entries')
              .update({
                end_time: now.toISOString(),
                hours: sessionElapsedHours,
                description: cutoffDescription,
                updated_at: now.toISOString()
              })
              .eq('id', session.id)

            if (updateSessionError) {
              console.error('Error updating time session:', updateSessionError)
            }
          }
        }
      } catch (taskError) {
        console.error(`❌ [LIMIT] Error processing task ${session.task_id}:`, taskError)
        continue
      }
    }

    return NextResponse.json({
      message: `Checked ${activeSessions.length} sessions for limit violations`,
      exceededTasks: exceededTasksCount,
      exceededDetails: exceededTasks,
      timestamp: new Date().toISOString(),
      note: 'Tasks exceeding limits are automatically completed and sessions are terminated'
    })

  } catch (error) {
    console.error('❌ [LIMIT] Error in check-limit-exceeded:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Check Limit Exceeded API',
    usage: {
      method: 'POST',
      endpoint: '/api/check-limit-exceeded',
      description: 'Checks for tasks that have exceeded their time limit and completes them automatically',
      schedule: 'Runs every 5 minutes via cron job',
      behavior: 'Automatically completes tasks and terminates sessions when limits are exceeded'
    }
  })
}