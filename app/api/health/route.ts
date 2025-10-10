// Health Check endpoint para producción
// app/api/health/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    responseTime: '0ms',
    error: undefined as string | undefined,
    checks: {} as Record<string, any>
  };

  try {
    // Verificar conexión a Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      health.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: Date.now() - startTime,
        error: error?.message
      };
    } else {
      health.checks.database = {
        status: 'skipped',
        message: 'Database credentials not configured'
      };
    }

    // Verificar memoria
    const memUsage = process.memoryUsage();
    const memoryUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
    
    health.checks.memory = {
      status: memoryUsagePercent < 0.9 ? 'healthy' : 'warning',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      usagePercent: Math.round(memoryUsagePercent * 100) + '%'
    };

    // Verificar variables de entorno críticas
    health.checks.environment = {
      status: 'healthy',
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      alertRecipients: !!process.env.ALERT_EMAIL_RECIPIENTS
    };

    // Determinar estado general
    const unhealthyChecks = Object.values(health.checks).filter(
      (check: any) => check.status === 'unhealthy'
    );
    
    if (unhealthyChecks.length > 0) {
      health.status = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    health.responseTime = responseTime + 'ms';

    // En producción, también enviar métricas a servicios de monitoreo
    if (process.env.NODE_ENV === 'production') {
      // Aquí podrías enviar métricas a Sentry, DataDog, etc.
      console.log('📊 Health check metrics:', {
        status: health.status,
        responseTime,
        memoryUsage: health.checks.memory.usagePercent,
        databaseStatus: health.checks.database.status
      });
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    health.status = 'unhealthy';
    health.error = error instanceof Error ? error.message : 'Unknown error';
    health.responseTime = Date.now() - startTime + 'ms';
    
    return NextResponse.json(health, { status: 503 });
  }
}