import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [FORCE-FIX] Starting to force close old sessions...')
    
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
      console.log('✅ No active sessions found')
      return NextResponse.json({ 
        message: 'No active sessions found', 
        fixedSessions: 0,
        timestamp: new Date().toISOString()
      })
    }

    console.log(`📊 Found ${activeSessions.length} active sessions`)

    let fixedSessionsCount = 0
    const fixedSessions = []

    for (const session of activeSessions) {
      try {
        const startTime = new Date(session.start_time)
        const now = new Date()
        const sessionElapsedMs = now.getTime() - startTime.getTime()
        const sessionElapsedHours = sessionElapsedMs / (1000 * 60 * 60)
        
        // Cerrar sesiones que tengan más de 10 horas (sesiones muy viejas)
        if (sessionElapsedHours > 10) {
          const fixDescription = `Sesión cerrada forzadamente: Sesión muy antigua (${sessionElapsedHours.toFixed(2)}h). Cerrada automáticamente por seguridad.`
          
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
            console.error(`❌ [FORCE-FIX] Error updating session ${session.id}:`, updateSessionError)
          } else {
            console.log(`✅ [FORCE-FIX] Session ${session.id} force-closed successfully`)
            fixedSessionsCount++
            
            fixedSessions.push({
              sessionId: session.id,
              taskId: session.task_id,
              sessionElapsedHours: sessionElapsedHours,
              fixDescription: fixDescription
            })
          }
        } else {
          console.log(`⏰ [FORCE-FIX] Session ${session.id} is only ${sessionElapsedHours.toFixed(2)}h old, skipping`)
        }
      } catch (sessionError) {
        console.error(`❌ [FORCE-FIX] Error processing session ${session.id}:`, sessionError)
        continue
      }
    }

    console.log(`🎯 [FORCE-FIX] Force-closed ${fixedSessionsCount} old sessions`)

    return NextResponse.json({
      message: `Force-closed ${fixedSessionsCount} old sessions`,
      fixedSessions: fixedSessionsCount,
      fixedDetails: fixedSessions,
      timestamp: new Date().toISOString(),
      note: 'Sessions older than 10 hours have been force-closed'
    })

  } catch (error) {
    console.error('❌ [FORCE-FIX] Error in force-close-sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Force close old sessions endpoint - use POST to execute',
    timestamp: new Date().toISOString()
  })
}
