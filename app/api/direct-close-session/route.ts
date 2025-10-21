import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización del cron job
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ [DIRECT-FIX] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 [DIRECT-FIX] Starting to close specific hanging session...')
    
    // ID específico de la sesión problemática
    const problemSessionId = '923d4c78-cf3a-452d-940a-de3bfcef1b67'
    
    // Obtener la sesión específica
    const { data: session, error: sessionError } = await supabase
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
      .eq('id', problemSessionId)
      .single()

    if (sessionError) {
      console.error('Error fetching specific session:', sessionError)
      return NextResponse.json({ error: 'Error fetching specific session' }, { status: 500 })
    }

    if (!session) {
      console.log('❌ [DIRECT-FIX] Session not found')
      return NextResponse.json({ 
        message: 'Session not found', 
        sessionId: problemSessionId,
        timestamp: new Date().toISOString()
      })
    }

    if (session.end_time) {
      console.log('✅ [DIRECT-FIX] Session already closed')
      return NextResponse.json({ 
        message: 'Session already closed', 
        sessionId: problemSessionId,
        endTime: session.end_time,
        timestamp: new Date().toISOString()
      })
    }

    // Calcular horas trabajadas
    const startTime = new Date(session.start_time)
    const now = new Date()
    const sessionElapsedMs = now.getTime() - startTime.getTime()
    const sessionElapsedHours = sessionElapsedMs / (1000 * 60 * 60)
    
    const fixDescription = `Sesión cerrada directamente: Sesión problemática de ${sessionElapsedHours.toFixed(2)}h cerrada manualmente.`
    
    // Cerrar la sesión
    const { error: updateSessionError } = await supabase
      .from('time_entries')
      .update({
        end_time: now.toISOString(),
        hours: sessionElapsedHours,
        description: fixDescription,
        updated_at: now.toISOString()
      })
      .eq('id', problemSessionId)

    if (updateSessionError) {
      console.error(`❌ [DIRECT-FIX] Error updating session ${problemSessionId}:`, updateSessionError)
      return NextResponse.json({ 
        error: 'Error updating session',
        details: updateSessionError,
        timestamp: new Date().toISOString()
      })
    }

    console.log(`✅ [DIRECT-FIX] Session ${problemSessionId} closed successfully`)

    return NextResponse.json({
      message: `Session ${problemSessionId} closed successfully`,
      sessionId: problemSessionId,
      sessionElapsedHours: sessionElapsedHours,
      fixDescription: fixDescription,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [DIRECT-FIX] Error in direct-close-session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Direct close specific session endpoint - use POST to execute',
    targetSessionId: '923d4c78-cf3a-452d-940a-de3bfcef1b67',
    timestamp: new Date().toISOString()
  })
}
