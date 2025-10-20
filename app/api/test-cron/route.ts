import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [CRON] Test endpoint called')
    
    return NextResponse.json({
      message: 'Test endpoint working',
      timestamp: new Date().toISOString(),
      success: true
    })
  } catch (error) {
    console.error('❌ [CRON] Error in test endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint - GET method',
    timestamp: new Date().toISOString()
  })
}
