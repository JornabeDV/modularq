import { PrismaClient } from './generated/prisma'
import fs from 'fs'
import path from 'path'

let prismaInstance: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured. Please set NEXT_PUBLIC_SUPABASE_URL or DATABASE_URL')
  }

  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
  if (!projectRef) {
    throw new Error('Could not extract project reference from Supabase URL')
  }

  const dbPassword = process.env.DATABASE_PASSWORD ||
                    process.env.SUPABASE_DB_PASSWORD ||
                    process.env.SUPABASE_SERVICE_ROLE_KEY?.split('.')[1]
  if (!dbPassword) {
    throw new Error('Database password not found. Please set DATABASE_PASSWORD environment variable')
  }

  // Usar connection pooling con SSL
  return `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:6543/postgres?sslmode=require&connect_timeout=60&pgbouncer=true`
}

// Crear cliente Prisma con configuración personalizada
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || getDatabaseUrl()
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
  })
}

// Obtener instancia del cliente Prisma
export function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    if (!prismaInstance) {
      prismaInstance = createPrismaClient()
    }
    return prismaInstance
  } else {
    if (!global.__prisma) {
      global.__prisma = createPrismaClient()
    }
    return global.__prisma
  }
}

export const prismaClient = getPrismaClient()

export async function disconnectPrisma(): Promise<void> {
  await prismaClient.$disconnect()
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prismaClient.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}