import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 [DETAILED-DEBUG] Starting detailed diagnosis...')
    
    // Deshabilitar cache para obtener datos frescos
    const headers = new Headers()
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    
    // 1. Obtener TODAS las sesiones (activas e inactivas)
    const { data: allSessions, error: allSessionsError } = await supabase
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
      .order('start_time', { ascending: false })
      .limit(10)

    if (allSessionsError) {
      console.error('Error fetching all sessions:', allSessionsError)
      return NextResponse.json({ error: 'Error fetching all sessions' }, { status: 500 })
    }

    // 2. Obtener solo sesiones activas (sin end_time)
    const { data: activeSessions, error: activeSessionsError } = await supabase
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

    if (activeSessionsError) {
      console.error('Error fetching active sessions:', activeSessionsError)
      return NextResponse.json({ error: 'Error fetching active sessions' }, { status: 500 })
    }

    // 3. Calcular detalles de sesiones activas
    const activeSessionsDetails = activeSessions?.map((session: any) => {
      const startTime = new Date(session.start_time)
      const now = new Date()
      const sessionElapsedMs = now.getTime() - startTime.getTime()
      const sessionElapsedHours = sessionElapsedMs / (1000 * 60 * 60)
      
      return {
        sessionId: session.id,
        taskId: session.task_id,
        startTime: session.start_time,
        sessionElapsedHours: sessionElapsedHours,
        isOldSession: sessionElapsedHours > 10,
        userId: session.user_id,
        projectId: session.project_id
      }
    }) || []

    // 4. Contar sesiones por estado
    const oldSessionsCount = activeSessionsDetails.filter(s => s.isOldSession).length
    const totalActiveCount = activeSessionsDetails.length

    return NextResponse.json({
      message: 'Detailed diagnosis of time_entries',
      summary: {
        totalSessionsInDB: allSessions?.length || 0,
        activeSessionsCount: totalActiveCount,
        oldSessionsCount: oldSessionsCount,
        sessionsOlderThan10Hours: oldSessionsCount
      },
      recentSessions: allSessions?.slice(0, 5) || [],
      activeSessionsDetails: activeSessionsDetails,
      timestamp: new Date().toISOString()
    }, { headers })

  } catch (error) {
    console.error('❌ [DETAILED-DEBUG] Error in detailed diagnosis:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
