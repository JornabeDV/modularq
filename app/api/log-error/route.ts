// Error logging endpoint para producción
// app/api/log-error/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, stack, url, timestamp, userId, userAgent } = body;

    // Log del error en el servidor
    console.error('🚨 ERROR LOGGED:', {
      error,
      stack,
      url,
      timestamp,
      userId,
      userAgent,
      ip: request.ip || request.headers.get('x-forwarded-for')
    });

    // En producción, enviar a servicio de monitoreo
    if (process.env.NODE_ENV === 'production') {
      // Aquí podrías integrar con Sentry, LogRocket, etc.
      
      // Ejemplo: Enviar alerta si es un error crítico
      if (error.includes('Database') || error.includes('Connection')) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test-alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alertType: 'Application Error',
            severity: 'critical',
            message: `Critical error detected: ${error}`,
            details: { url, userId, timestamp }
          })
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error logging failed:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}