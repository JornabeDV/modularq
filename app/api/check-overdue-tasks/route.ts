import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MAX_EXTRA_TIME = 2 * 60 * 60 * 1000 // 2 horas en milisegundos

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checking for overdue tasks...')
    
    // Obtener solo sesiones activas que podrían estar vencidas (más de 1 hora de antigüedad)
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
      .lt('start_time', oneHourAgo) // Solo sesiones de más de 1 hora
      .order('start_time', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching active sessions:', sessionsError)
      return NextResponse.json({ error: 'Error fetching active sessions' }, { status: 500 })
    }

    if (!activeSessions || activeSessions.length === 0) {
      console.log('✅ No potentially overdue sessions found')
      return NextResponse.json({ message: 'No potentially overdue sessions found', completedTasks: 0 })
    }

    console.log(`📊 Found ${activeSessions.length} potentially overdue sessions`)

    // Obtener información detallada de las tareas para las sesiones activas
    const taskIds = [...new Set(activeSessions.map(s => s.task_id))]
    
    console.log(`🔍 Fetching task details for ${taskIds.length} tasks...`)
    
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

    let completedTasksCount = 0
    const results = []

    for (const session of activeSessions) {
      try {
        // Obtener información de la tarea y project_task usando los mapas
        const task = tasksMap.get(session.task_id)
        const projectTask = projectTasksMap.get(session.task_id)
        
        if (!task) {
          console.log(`⚠️ Task not found for session ${session.id}`)
          continue
        }

        // Saltar si la tarea ya está completada
        if (projectTask?.status === 'completed') {
          console.log(`⏭️ Task ${task.title} already completed, skipping`)
          continue
        }

        const startTime = new Date(session.start_time)
        const now = new Date()
        const sessionElapsedMs = now.getTime() - startTime.getTime()
        const sessionElapsedHours = sessionElapsedMs / (1000 * 60 * 60)

        // Calcular tiempo total trabajado
        const previousHours = projectTask?.actual_hours || 0
        const totalWorkedHours = previousHours + sessionElapsedHours

        // Determinar límite máximo
        let maxTotalHours = MAX_EXTRA_TIME / (1000 * 60 * 60) // 2 horas por defecto
        
        if (task.estimated_hours) {
          maxTotalHours = task.estimated_hours + (MAX_EXTRA_TIME / (1000 * 60 * 60))
        }

        console.log(`⏱️ Task ${task.title}: ${totalWorkedHours.toFixed(2)}h / ${maxTotalHours.toFixed(2)}h max`)

        // Si excede el límite, completar automáticamente
        if (totalWorkedHours >= maxTotalHours) {
          console.log(`🚨 Task ${task.title} exceeded limit! Completing automatically...`)

          // Finalizar la sesión activa
          const finalHours = sessionElapsedHours
          const { error: updateSessionError } = await supabase
            .from('time_entries')
            .update({
              end_time: now.toISOString(),
              hours: finalHours,
              description: 'Tarea completada automáticamente al alcanzar límite de tiempo'
            })
            .eq('id', session.id)

          if (updateSessionError) {
            console.error('Error updating session:', updateSessionError)
            continue
          }

          // Actualizar horas totales en project_tasks
          if (projectTask) {
            const { error: updateTaskError } = await supabase
              .from('project_tasks')
              .update({
                actual_hours: totalWorkedHours,
                status: 'completed',
                end_date: now.toISOString().split('T')[0],
                progress_percentage: 100,
                updated_at: now.toISOString()
              })
              .eq('id', projectTask.id)

            if (updateTaskError) {
              console.error('Error updating project task:', updateTaskError)
              continue
            }
          }

          // Verificar si todas las tareas del proyecto están completadas
          const { data: projectTasks, error: projectTasksError } = await supabase
            .from('project_tasks')
            .select('status')
            .eq('project_id', session.project_id)

          if (!projectTasksError && projectTasks) {
            const allCompleted = projectTasks.every(task => task.status === 'completed')
            
            if (allCompleted) {
              // Marcar proyecto como completado
              await supabase
                .from('projects')
                .update({
                  status: 'completed',
                  end_date: now.toISOString().split('T')[0],
                  updated_at: now.toISOString()
                })
                .eq('id', session.project_id)
              
              console.log(`🎉 Project ${session.project_id} completed automatically!`)
            }
          }

          completedTasksCount++
          results.push({
            taskId: task.id,
            taskTitle: task.title,
            totalHours: totalWorkedHours,
            maxHours: maxTotalHours,
            completed: true
          })

          console.log(`✅ Task ${task.title} completed automatically`)
        } else {
          results.push({
            taskId: task.id,
            taskTitle: task.title,
            totalHours: totalWorkedHours,
            maxHours: maxTotalHours,
            completed: false
          })
        }
      } catch (taskError) {
        console.error(`Error processing task ${session.task_id}:`, taskError)
        continue
      }
    }

    console.log(`🎯 Completed ${completedTasksCount} overdue tasks`)

    return NextResponse.json({
      message: `Checked ${activeSessions.length} active sessions`,
      completedTasks: completedTasksCount,
      results
    })

  } catch (error) {
    console.error('Error in check-overdue-tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}