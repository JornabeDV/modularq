// Health check endpoint para ModularQ
// Verifica el estado de la aplicación y sus dependencias

const { createClient } = require('@supabase/supabase-js')

const healthCheck = async (req, res) => {
  const startTime = Date.now()
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    checks: {}
  }

  try {
    // Verificar conexión a Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      health.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: Date.now() - startTime,
        error: error?.message
      }
    } else {
      health.checks.database = {
        status: 'skipped',
        message: 'Database credentials not configured'
      }
    }

    // Verificar memoria
    const memUsage = process.memoryUsage()
    health.checks.memory = {
      status: memUsage.heapUsed / memUsage.heapTotal < 0.9 ? 'healthy' : 'warning',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
    }

    // Verificar CPU
    const cpuUsage = process.cpuUsage()
    health.checks.cpu = {
      status: 'healthy',
      user: cpuUsage.user,
      system: cpuUsage.system
    }

    // Determinar estado general
    const unhealthyChecks = Object.values(health.checks).filter(check => check.status === 'unhealthy')
    if (unhealthyChecks.length > 0) {
      health.status = 'unhealthy'
    }

    const responseTime = Date.now() - startTime
    health.responseTime = responseTime + 'ms'

    res.status(health.status === 'healthy' ? 200 : 503).json(health)

  } catch (error) {
    health.status = 'unhealthy'
    health.error = error.message
    health.responseTime = Date.now() - startTime + 'ms'
    
    res.status(503).json(health)
  }
}

module.exports = healthCheck