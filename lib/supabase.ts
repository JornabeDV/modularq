import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

// Tipos de la base de datos
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'supervisor' | 'operario'
          skills: string[]
          total_hours: number
          efficiency: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'supervisor' | 'operario'
          skills?: string[]
          total_hours?: number
          efficiency?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'supervisor' | 'operario'
          skills?: string[]
          total_hours?: number
          efficiency?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'planning' | 'active' | 'paused' | 'completed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          start_date: string
          end_date: string | null
          progress: number
          supervisor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status: 'planning' | 'active' | 'paused' | 'completed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          start_date: string
          end_date?: string | null
          progress?: number
          supervisor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'planning' | 'active' | 'paused' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          start_date?: string
          end_date?: string | null
          progress?: number
          supervisor_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: 'pending' | 'in-progress' | 'completed' | 'blocked'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assigned_to: string | null
          estimated_hours: number
          actual_hours: number
          start_date: string | null
          end_date: string | null
          dependencies: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status: 'pending' | 'in-progress' | 'completed' | 'blocked'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
          estimated_hours: number
          actual_hours?: number
          start_date?: string | null
          end_date?: string | null
          dependencies?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in-progress' | 'completed' | 'blocked'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
          estimated_hours?: number
          actual_hours?: number
          start_date?: string | null
          end_date?: string | null
          dependencies?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          task_id: string
          project_id: string
          start_time: string
          end_time: string | null
          hours: number
          description: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          project_id: string
          start_time: string
          end_time?: string | null
          hours?: number
          description?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          project_id?: string
          start_time?: string
          end_time?: string | null
          hours?: number
          description?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          user_name: string
          action: string
          entity_type: 'project' | 'task' | 'operario' | 'time-entry'
          entity_id: string
          entity_name: string
          changes?: any | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_name?: string
          action?: string
          entity_type?: 'project' | 'task' | 'operario' | 'time-entry'
          entity_id?: string
          entity_name?: string
          changes?: any | null
          ip_address?: string | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          name: string
          type: 'productivity' | 'time-tracking' | 'project-status' | 'operario-performance'
          description: string | null
          generated_by: string
          parameters: any | null
          data: any | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'productivity' | 'time-tracking' | 'project-status' | 'operario-performance'
          description?: string | null
          generated_by: string
          parameters?: any | null
          data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'productivity' | 'time-tracking' | 'project-status' | 'operario-performance'
          description?: string | null
          generated_by?: string
          parameters?: any | null
          data?: any | null
          created_at?: string
        }
      }
      project_operarios: {
        Row: {
          id: string
          project_id: string
          user_id: string
          assigned_at: string
          assigned_by: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          assigned_at?: string
          assigned_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          assigned_at?: string
          assigned_by?: string | null
        }
      }
    }
  }
}
