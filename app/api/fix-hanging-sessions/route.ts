import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [FIX] Starting to fix hanging sessions...')
    
    // Obtener todas las sesiones activas
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

    if (sessionsError) {
      console.error('Error fetching active sessions:', sessionsError)
      return NextResponse.json({ error: 'Error fetching active sessions' }, { status: 500 })
    }

    if (!activeSessions || activeSessions.length === 0) {
      console.log('✅ No hanging sessions found')
      return NextResponse.json({ 
        message: 'No hanging sessions found', 
        fixedSessions: 0,
        timestamp: new Date().toISOString()
      })
    }

    console.log(`📊 Found ${activeSessions.length} hanging sessions`)

    // Obtener información de las tareas relacionadas
    const taskIds = [...new Set(activeSessions.map((s: any) => s.task_id))]
    
    const { data: projectTasks, error: projectTasksError } = await supabase
      .from('project_tasks')
      .select('id, status, actual_hours, task_id')
      .in('task_id', taskIds)

    if (projectTasksError) {
      console.error('Error fetching project tasks:', projectTasksError)
      return NextResponse.json({ error: 'Error fetching project task details' }, { status: 500 })
    }

    // Crear mapa para acceso rápido
    const projectTasksMap = new Map(projectTasks?.map((pt: any) => [pt.task_id, pt]) || [])

    let fixedSessionsCount = 0
    const fixedSessions = []

    for (const session of activeSessions) {
      try {
        const projectTask = projectTasksMap.get(session.task_id)
        
        // Solo cerrar sesiones de tareas que ya están completadas
        if (projectTask && (projectTask as any).status === 'completed') {
          const startTime = new Date(session.start_time)
          const now = new Date()
          const sessionElapsedMs = now.getTime() - startTime.getTime()
          const sessionElapsedHours = sessionElapsedMs / (1000 * 60 * 60)
          
          const fixDescription = `Sesión cerrada automáticamente: Tarea ya estaba completada pero sesión no se cerró. Trabajado: ${sessionElapsedHours.toFixed(2)}h.`
          
          const { error: updateSessionError } = await supabase
            .from('time_entries')
            .update({
              end_time: now.toISOString(),
              hours: sessionElapsedHours,
              description: fixDescription,
              updated_at: now.toISOString()
            })
            .eq('id', session.id)

          if (updateSessionError) {
            console.error(`❌ [FIX] Error updating session ${session.id}:`, updateSessionError)
          } else {
            console.log(`✅ [FIX] Session ${session.id} fixed successfully`)
            fixedSessionsCount++
            
            fixedSessions.push({
              sessionId: session.id,
              taskId: session.task_id,
              sessionElapsedHours: sessionElapsedHours,
              fixDescription: fixDescription
            })
          }
        }
      } catch (sessionError) {
        console.error(`❌ [FIX] Error processing session ${session.id}:`, sessionError)
        continue
      }
    }

    console.log(`🎯 [FIX] Fixed ${fixedSessionsCount} hanging sessions`)

    return NextResponse.json({
      message: `Fixed ${fixedSessionsCount} hanging sessions`,
      fixedSessions: fixedSessionsCount,
      fixedDetails: fixedSessions,
      timestamp: new Date().toISOString(),
      note: 'Sessions from completed tasks have been properly closed'
    })

  } catch (error) {
    console.error('❌ [FIX] Error in fix-hanging-sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Fix hanging sessions endpoint - use POST to execute',
    timestamp: new Date().toISOString()
  })
}
