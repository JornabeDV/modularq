import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  entity_type: 'project' | 'task' | 'operario' | 'time-entry'
  entity_id: string
  entity_name: string
  changes: any | null
  ip_address: string | null
  created_at: string
}

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar logs de auditoría desde la base de datos
  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100) // Limitar a los últimos 100 registros para mejor rendimiento

      if (fetchError) throw fetchError
      setAuditLogs(data || [])
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar logs de auditoría')
    } finally {
      setLoading(false)
    }
  }

  // Cargar logs al montar el componente
  useEffect(() => {
    fetchAuditLogs()
  }, [])

  return {
    auditLogs,
    loading,
    error,
    fetchAuditLogs
  }
}


