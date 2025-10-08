// Configuración de alertas para ModularQ
// Define las reglas de monitoreo y notificaciones

const alertConfig = {
  // Alertas de rendimiento
  performance: {
    responseTime: {
      threshold: 5000, // 5 segundos
      severity: 'warning',
      message: 'Response time is above threshold'
    },
    memoryUsage: {
      threshold: 0.9, // 90% de memoria
      severity: 'critical',
      message: 'Memory usage is critically high'
    },
    cpuUsage: {
      threshold: 0.8, // 80% de CPU
      severity: 'warning',
      message: 'CPU usage is high'
    }
  },

  // Alertas de base de datos
  database: {
    connectionFailure: {
      severity: 'critical',
      message: 'Database connection failed',
      action: 'Check database status and credentials'
    },
    slowQueries: {
      threshold: 2000, // 2 segundos
      severity: 'warning',
      message: 'Slow database queries detected'
    },
    connectionPool: {
      threshold: 0.8, // 80% de conexiones
      severity: 'warning',
      message: 'Database connection pool is near capacity'
    }
  },

  // Alertas de aplicación
  application: {
    errorRate: {
      threshold: 0.05, // 5% de errores
      severity: 'critical',
      message: 'High error rate detected'
    },
    uptime: {
      threshold: 0.99, // 99% de uptime
      severity: 'warning',
      message: 'Uptime below threshold'
    },
    buildFailure: {
      severity: 'critical',
      message: 'Build process failed',
      action: 'Check build logs and fix issues'
    }
  },

  // Alertas de seguridad
  security: {
    failedLogins: {
      threshold: 10, // 10 intentos fallidos
      timeWindow: 300000, // 5 minutos
      severity: 'warning',
      message: 'Multiple failed login attempts detected'
    },
    suspiciousActivity: {
      severity: 'critical',
      message: 'Suspicious activity detected',
      action: 'Review security logs immediately'
    },
    dataBreach: {
      severity: 'critical',
      message: 'Potential data breach detected',
      action: 'Immediate security review required'
    }
  },

  // Configuración de notificaciones
  notifications: {
    channels: {
      email: {
        enabled: true,
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || []
      },
      slack: {
        enabled: process.env.SLACK_WEBHOOK_URL ? true : false,
        webhook: process.env.SLACK_WEBHOOK_URL
      },
      discord: {
        enabled: process.env.DISCORD_WEBHOOK_URL ? true : false,
        webhook: process.env.DISCORD_WEBHOOK_URL
      }
    },
    escalation: {
      levels: [
        { severity: 'info', delay: 0 },
        { severity: 'warning', delay: 300000 }, // 5 minutos
        { severity: 'critical', delay: 60000 }  // 1 minuto
      ]
    }
  }
}

module.exports = alertConfig