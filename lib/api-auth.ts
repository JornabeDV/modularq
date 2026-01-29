// Utility para verificar autenticación en API routes
// lib/api-auth.ts

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'supervisor' | 'operario' | 'subcontratista';
  name: string;
}

export async function verifyApiAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  error?: string;
}> {
  try {
    // Obtener token de autorización
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'No authorization token provided'
      };
    }

    // Crear cliente de Supabase con el token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Verificar el token y obtener el usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'Invalid or expired token'
      };
    }

    // Obtener perfil del usuario desde la base de datos
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'User profile not found'
      };
    }

    return {
      isAuthenticated: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        name: userProfile.name
      }
    };

  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
      error: 'Authentication verification failed'
    };
  }
}

export function requireAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'admin';
}

export function requireSupervisorOrAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function createUnauthorizedResponse(message: string = 'Unauthorized') {
  return Response.json(
    { error: message, code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

export function createForbiddenResponse(message: string = 'Forbidden') {
  return Response.json(
    { error: message, code: 'FORBIDDEN' },
    { status: 403 }
  );
}
