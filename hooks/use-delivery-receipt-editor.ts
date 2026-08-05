'use client'

import { useCallback, useState } from 'react'
import { DEFAULT_DELIVERY_CONDITIONS } from '@/lib/constants'
import type { DeliveryReceiptWithItems, DeliveryReceiptItem } from './use-delivery-receipt'
import type { DeliveryReceiptType, DeliveryReceiptStatus } from './use-delivery-receipts'
import type { Client } from './use-clients-prisma'

export type EditorItemType = 'standard_module' | 'custom_module' | 'service'

export interface EditorItemAdditional {
  material_id?: string
  name: string
  quantity: number
}

export interface EditorItemAttachment {
  filename: string
  original_name: string
  mime_type: string
  size: number
  url: string
  storage_path: string
}

export interface EditorItem {
  id?: string
  type: EditorItemType
  standard_module_id?: string
  name: string
  description: string
  quantity: number
  is_optional: boolean
  sort_order: number
  module_description: { section: string; description: string }[]
  additionals: EditorItemAdditional[]
  attachments: EditorItemAttachment[]
}

export interface EditorState {
  type: DeliveryReceiptType
  status: DeliveryReceiptStatus | null
  number: string
  client_id: string | null
  client_name: string
  client_company: string
  client_phone: string
  client_email: string
  delivery_address: string
  delivery_date: string
  notes: string
  delivery_conditions: string[]
  notes_list: string[]
  items: EditorItem[]
}

function emptyState(): EditorState {
  return {
    type: 'sale',
    status: null,
    number: '',
    client_id: null,
    client_name: '',
    client_company: '',
    client_phone: '',
    client_email: '',
    delivery_address: '',
    delivery_date: '',
    notes: '',
    delivery_conditions: [...DEFAULT_DELIVERY_CONDITIONS],
    notes_list: [],
    items: [],
  }
}

function normalizeNote(note: unknown): string | null {
  if (typeof note === 'string') return note.trim() || null
  if (note && typeof note === 'object' && 'content' in note && typeof (note as any).content === 'string') {
    return (note as any).content.trim() || null
  }
  return null
}

function mapDbItemToEditor(item: DeliveryReceiptItem): EditorItem {
  return {
    id: item.id,
    type: item.type,
    standard_module_id: item.standard_module_id ?? undefined,
    name: item.name,
    description: item.description ?? '',
    quantity: item.quantity,
    is_optional: item.is_optional ?? false,
    sort_order: item.sort_order,
    module_description: Array.isArray(item.module_description) ? item.module_description : [],
    additionals:
      item.additionals?.map((a) => ({
        material_id: a.material_id ?? undefined,
        name: a.name,
        quantity: a.quantity,
      })) ?? [],
    attachments:
      item.attachments?.map((a) => ({
        filename: a.filename,
        original_name: a.original_name,
        mime_type: a.mime_type,
        size: a.size,
        url: a.url,
        storage_path: a.storage_path,
      })) ?? [],
  }
}

export function useDeliveryReceiptEditor() {
  const [state, setState] = useState<EditorState>(emptyState())

  const reset = useCallback((receipt?: DeliveryReceiptWithItems | null) => {
    if (!receipt) {
      setState(emptyState())
      return
    }

    setState({
      type: receipt.type ?? 'sale',
      status: receipt.status ?? 'draft',
      number: receipt.number ?? '',
      client_id: receipt.client_id ?? null,
      client_name: receipt.client_name ?? '',
      client_company: receipt.client_company ?? '',
      client_phone: receipt.client_phone ?? '',
      client_email: receipt.client_email ?? '',
      delivery_address: receipt.delivery_address ?? '',
      delivery_date: receipt.delivery_date ? receipt.delivery_date.split('T')[0] : '',
      notes: receipt.notes ?? '',
      delivery_conditions: Array.isArray(receipt.delivery_conditions) && receipt.delivery_conditions.length > 0
        ? (receipt.delivery_conditions.map(normalizeNote).filter(Boolean) as string[])
        : [...DEFAULT_DELIVERY_CONDITIONS],
      notes_list: Array.isArray(receipt.notes_list)
        ? (receipt.notes_list.map(normalizeNote).filter(Boolean) as string[])
        : [],
      items: receipt.items?.map(mapDbItemToEditor) ?? [],
    })
  }, [])

  const setType = useCallback((type: DeliveryReceiptType) => {
    setState((s) => ({ ...s, type }))
  }, [])

  const setClient = useCallback((client: Client | null) => {
    setState((s) => ({
      ...s,
      client_id: client?.id ?? null,
      client_name: client?.companyName ?? '',
      client_company: client?.companyName ?? '',
      client_phone: client?.phone ?? '',
      client_email: client?.email ?? '',
    }))
  }, [])

  const setField = useCallback(<K extends keyof EditorState>(field: K, value: EditorState[K]) => {
    setState((s) => ({ ...s, [field]: value }))
  }, [])

  const addNote = useCallback((note: string) => {
    const trimmed = note.trim()
    if (!trimmed) return
    setState((s) => ({ ...s, notes_list: [...s.notes_list, trimmed] }))
  }, [])

  const removeNote = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      notes_list: s.notes_list.filter((_, i) => i !== index),
    }))
  }, [])

  const addDeliveryCondition = useCallback((condition: string) => {
    const trimmed = condition.trim()
    if (!trimmed) return
    setState((s) => ({ ...s, delivery_conditions: [...s.delivery_conditions, trimmed] }))
  }, [])

  const updateDeliveryCondition = useCallback((index: number, value: string) => {
    setState((s) => ({
      ...s,
      delivery_conditions: s.delivery_conditions.map((c, i) => (i === index ? value : c)),
    }))
  }, [])

  const removeDeliveryCondition = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      delivery_conditions: s.delivery_conditions.filter((_, i) => i !== index),
    }))
  }, [])

  const addItem = useCallback((item: EditorItem) => {
    setState((s) => {
      const next = { ...item, sort_order: s.items.length }
      return { ...s, items: [...s.items, next] }
    })
  }, [])

  const updateItem = useCallback((index: number, patch: Partial<EditorItem>) => {
    setState((s) => {
      if (index < 0 || index >= s.items.length) return s
      const items = [...s.items]
      items[index] = { ...items[index], ...patch }
      return { ...s, items }
    })
  }, [])

  const removeItem = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      items: s.items
        .filter((_, i) => i !== index)
        .map((it, i) => ({ ...it, sort_order: i })),
    }))
  }, [])

  const moveItem = useCallback((index: number, direction: -1 | 1) => {
    setState((s) => {
      const target = index + direction
      if (target < 0 || target >= s.items.length) return s
      const items = [...s.items]
      const temp = items[index]
      items[index] = items[target]
      items[target] = temp
      return { ...s, items: items.map((it, i) => ({ ...it, sort_order: i })) }
    })
  }, [])

  const addAttachment = useCallback((itemIndex: number, attachment: EditorItemAttachment) => {
    setState((s) => {
      const item = s.items[itemIndex]
      if (!item) return s
      const items = [...s.items]
      items[itemIndex] = { ...item, attachments: [...item.attachments, attachment] }
      return { ...s, items }
    })
  }, [])

  const removeAttachment = useCallback((itemIndex: number, attachmentIndex: number) => {
    setState((s) => {
      const item = s.items[itemIndex]
      if (!item) return s
      const items = [...s.items]
      items[itemIndex] = {
        ...item,
        attachments: item.attachments.filter((_, i) => i !== attachmentIndex),
      }
      return { ...s, items }
    })
  }, [])

  const addCustomSection = useCallback((itemIndex: number) => {
    setState((s) => {
      const item = s.items[itemIndex]
      if (!item) return s
      const items = [...s.items]
      items[itemIndex] = {
        ...item,
        module_description: [...item.module_description, { section: '', description: '' }],
      }
      return { ...s, items }
    })
  }, [])

  const updateCustomSection = useCallback(
    (itemIndex: number, sectionIndex: number, patch: Partial<{ section: string; description: string }>) => {
      setState((s) => {
        const item = s.items[itemIndex]
        if (!item) return s
        const items = [...s.items]
        items[itemIndex] = {
          ...item,
          module_description: item.module_description.map((sec, i) =>
            i === sectionIndex ? { ...sec, ...patch } : sec
          ),
        }
        return { ...s, items }
      })
    },
    []
  )

  const removeCustomSection = useCallback((itemIndex: number, sectionIndex: number) => {
    setState((s) => {
      const item = s.items[itemIndex]
      if (!item) return s
      const items = [...s.items]
      items[itemIndex] = {
        ...item,
        module_description: item.module_description.filter((_, i) => i !== sectionIndex),
      }
      return { ...s, items }
    })
  }, [])

  const toBody = useCallback(
    (createdBy: string): Record<string, unknown> => ({
      type: state.type,
      client_id: state.client_id,
      client_name: state.client_name.trim() || 'Cliente',
      client_company: state.client_company || undefined,
      client_phone: state.client_phone || undefined,
      client_email: state.client_email || undefined,
      delivery_address: state.delivery_address || undefined,
      delivery_date: state.delivery_date || undefined,
      notes: state.notes || undefined,
      delivery_conditions: state.delivery_conditions.length > 0 ? state.delivery_conditions : undefined,
      notes_list: state.notes_list.length > 0 ? state.notes_list : undefined,
      created_by: createdBy,
      items: state.items.map((item, i) => ({
        type: item.type,
        standard_module_id: item.standard_module_id,
        name: item.name.trim(),
        description: item.description || undefined,
        quantity: item.quantity,
        is_optional: item.is_optional,
        sort_order: i,
        module_description: item.module_description.length > 0 ? item.module_description : null,
        additionals: item.additionals.length > 0 ? item.additionals : undefined,
        attachments: item.attachments.length > 0 ? item.attachments : undefined,
      })),
    }),
    [state]
  )

  const isReadOnly = state.status === 'issued'

  return {
    state,
    isReadOnly,
    reset,
    setType,
    setClient,
    setField,
    addNote,
    removeNote,
    addDeliveryCondition,
    updateDeliveryCondition,
    removeDeliveryCondition,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    addAttachment,
    removeAttachment,
    addCustomSection,
    updateCustomSection,
    removeCustomSection,
    toBody,
  }
}
