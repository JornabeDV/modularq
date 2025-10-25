// Middleware para monitoreo en Vercel
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname } = request.nextUrl;

  // Crear response
  const response = NextResponse.next();

  // Agregar headers de monitoreo
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);
  response.headers.set('X-Path', pathname);
  response.headers.set('X-Timestamp', new Date().toISOString());

  // Log de métricas para Vercel Analytics
  if (process.env.NODE_ENV === 'production') {
  }

  // Monitorear rutas críticas
  const criticalPaths = ['/api/', '/admin/', '/dashboard'];
  const isCriticalPath = criticalPaths.some(path => pathname.startsWith(path));

  if (isCriticalPath) {
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};