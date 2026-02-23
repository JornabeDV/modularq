import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string | Date): string {
  if (!dateString) return 'Sin fecha'
  
  const date = typeof dateString === 'string' 
    ? (dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00'))
    : dateString
  
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
