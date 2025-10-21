import { NextRequest, NextResponse } from 'next/server'

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

    console.log('🔍 [CRON] Checking for overdue tasks...')
    
    // Por ahora, solo devolver un mensaje de prueba
    return NextResponse.json({
      message: 'Cron job endpoint working - Supabase integration pending',
      timestamp: new Date().toISOString(),
      note: 'This is a simplified version without Supabase dependencies'
    })

  } catch (error) {
    console.error('❌ [CRON] Error in check-limit-exceeded:', error)
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