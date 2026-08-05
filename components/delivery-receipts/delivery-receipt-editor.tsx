'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarIcon,
  FileText,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

import { ClientSelector } from '@/components/cotizador/ClientSelector'
import { QuickCreateClientDialog } from '@/components/cotizador/QuickCreateClientDialog'
import { useClientsPrisma, type Client } from '@/hooks/use-clients-prisma'
import { useStandardModules, type StandardModule } from '@/hooks/use-standard-modules'
import type { ServiceCatalogItem } from '@/components/cotizador/ServicesTab'
import {
  useDeliveryReceiptEditor,
  type EditorItem,
  type EditorItemAttachment,
} from '@/hooks/use-delivery-receipt-editor'
import type { DeliveryReceiptWithItems } from '@/hooks/use-delivery-receipt'
import { DeliveryReceiptPdfButton } from './delivery-receipt-pdf-button'

interface DeliveryReceiptEditorProps {
  mode: 'create' | 'edit'
  receiptId?: string
  initialReceipt?: DeliveryReceiptWithItems | null
  userId: string
  onSaved?: (id?: string) => void
}

function formatIsoDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function displayDate(value: string | undefined): string {
  if (!value) return '-'
  const d = parseLocalDate(value)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function typeLabel(type: EditorItem['type']): string {
  switch (type) {
    case 'standard_module':
      return 'Módulo estándar'
    case 'custom_module':
      return 'Módulo personalizado'
    case 'service':
      return 'Servicio'
  }
}

function statusLabel(status: string | null): string {
  switch (status) {
    case 'issued':
      return 'Emitido'
    case 'draft':
    default:
      return 'Borrador'
  }
}

async function uploadAttachmentFile(file: File): Promise<EditorItemAttachment> {
  if (!supabase) throw new Error('Supabase no está inicializado')

  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100)
  const folder = `delivery-receipts-attachments/${crypto.randomUUID()}`
  const path = `${folder}/${Date.now()}_${sanitized}`

  const { data, error } = await supabase.storage.from('project-files').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error || !data) {
    throw new Error(error?.message ?? 'Error al subir archivo')
  }

  const { data: publicUrlData } = supabase.storage.from('project-files').getPublicUrl(data.path)

  return {
    filename: file.name,
    original_name: file.name,
    mime_type: file.type,
    size: file.size,
    url: publicUrlData.publicUrl,
    storage_path: data.path,
  }
}

export function DeliveryReceiptEditor({
  mode,
  receiptId,
  initialReceipt,
  userId,
  onSaved,
}: DeliveryReceiptEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const editor = useDeliveryReceiptEditor()

  const { clients, loading: clientsLoading, refetch: refetchClients } = useClientsPrisma()
  const { modules: standardModules, loading: modulesLoading } = useStandardModules(true)

  const [services, setServices] = useState<ServiceCatalogItem[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)

  const [activeTab, setActiveTab] = useState('standard')
  const [moduleSearch, setModuleSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')

  const [customForm, setCustomForm] = useState({
    name: '',
    description: '',
    sections: [{ section: '', description: '' }],
  })

  const [newNote, setNewNote] = useState('')
  const [newCondition, setNewCondition] = useState('')
  const [createClientOpen, setCreateClientOpen] = useState(false)

  const [saving, setSaving] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const [displayReceipt, setDisplayReceipt] = useState<DeliveryReceiptWithItems | null>(
    initialReceipt ?? null
  )

  const resetEditor = editor.reset
  useEffect(() => {
    setDisplayReceipt(initialReceipt ?? null)
    resetEditor(initialReceipt ?? null)
  }, [initialReceipt, resetEditor])

  const updateDisplayReceipt = useCallback((receipt: DeliveryReceiptWithItems | null) => {
    setDisplayReceipt(receipt)
    resetEditor(receipt)
  }, [resetEditor])

  useEffect(() => {
    let cancelled = false
    setServicesLoading(true)
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setServices(data.services ?? [])
      })
      .catch((err) => {
        console.error('Error loading services:', err)
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === editor.state.client_id) ?? null,
    [clients, editor.state.client_id]
  )

  const filteredModules = useMemo(() => {
    const term = moduleSearch.trim().toLowerCase()
    if (!term) return standardModules
    return standardModules.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.description ?? '').toLowerCase().includes(term)
    )
  }, [standardModules, moduleSearch])

  const filteredServices = useMemo(() => {
    const term = serviceSearch.trim().toLowerCase()
    if (!term) return services
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.description ?? '').toLowerCase().includes(term)
    )
  }, [services, serviceSearch])

  const handleClientSelect = (client: Client | null) => {
    editor.setClient(client)
  }

  const handleCreateClient = (client: Client) => {
    editor.setClient(client)
    refetchClients()
  }

  const handleSave = async () => {
    if (!editor.state.client_name.trim()) {
      toast({
        title: 'Cliente requerido',
        description: 'Ingresá al menos el nombre del cliente.',
        variant: 'destructive',
      })
      return
    }
    if (editor.state.items.length === 0) {
      toast({
        title: 'Ítems requeridos',
        description: 'Agregá al menos un ítem al remito.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const body = editor.toBody(userId)
      const url = mode === 'create' ? '/api/delivery-receipts' : `/api/delivery-receipts/${receiptId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      toast({ title: mode === 'create' ? 'Remito creado' : 'Borrador guardado' })
      onSaved?.(data.id)
    } catch (error) {
      toast({
        title: 'Error al guardar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleIssue = async () => {
    if (!editor.state.client_name.trim()) {
      toast({
        title: 'Cliente requerido',
        description: 'Ingresá al menos el nombre del cliente.',
        variant: 'destructive',
      })
      return
    }
    if (editor.state.items.length === 0) {
      toast({
        title: 'Ítems requeridos',
        description: 'Agregá al menos un ítem al remito.',
        variant: 'destructive',
      })
      return
    }

    setIssuing(true)
    try {
      let currentId = receiptId

      if (mode === 'create' || !currentId) {
        const body = editor.toBody(userId)
        const res = await fetch('/api/delivery-receipts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al guardar')
        currentId = data.id
      } else {
        const body = editor.toBody(userId)
        const res = await fetch(`/api/delivery-receipts/${currentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al guardar')
      }

      const issueRes = await fetch(`/api/delivery-receipts/${currentId}/issue`, {
        method: 'PATCH',
      })
      const issueData = await issueRes.json().catch(() => ({}))
      if (!issueRes.ok) throw new Error(issueData.error || 'Error al emitir')

      const issuedReceipt: DeliveryReceiptWithItems | null = issueData.receipt ?? null
      if (issuedReceipt) {
        updateDisplayReceipt(issuedReceipt)
      }

      toast({ title: 'Remito emitido' })

      if (mode === 'create') {
        router.push(`/admin/delivery-receipts/${currentId}`)
      }
    } catch (error) {
      toast({
        title: 'Error al emitir',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setIssuing(false)
    }
  }

  const handleDuplicate = async () => {
    if (!receiptId) return
    setDuplicating(true)
    try {
      const res = await fetch(`/api/delivery-receipts/${receiptId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ created_by: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al duplicar')

      toast({ title: 'Remito duplicado' })
      router.push(`/admin/delivery-receipts/${data.id}`)
    } catch (error) {
      toast({
        title: 'Error al duplicar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setDuplicating(false)
    }
  }

  const handleAddStandardModule = (module: StandardModule) => {
    const item: EditorItem = {
      type: 'standard_module',
      standard_module_id: module.id,
      name: module.name,
      description: module.description ?? '',
      quantity: 1,
      is_optional: false,
      sort_order: editor.state.items.length,
      module_description: Array.isArray(module.module_description) ? module.module_description : [],
      additionals: (module.materials ?? []).map((m) => ({
        material_id: m.material_id,
        name: m.material.name,
        quantity: m.quantity,
      })),
      attachments: [],
    }
    editor.addItem(item)
  }

  const handleAddService = (service: ServiceCatalogItem) => {
    const item: EditorItem = {
      type: 'service',
      name: service.name,
      description: service.description ?? '',
      quantity: 1,
      is_optional: false,
      sort_order: editor.state.items.length,
      module_description: [],
      additionals: [],
      attachments: [],
    }
    editor.addItem(item)
  }

  const handleAddCustomModule = () => {
    const name = customForm.name.trim()
    if (!name) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresá un nombre para el módulo personalizado.',
        variant: 'destructive',
      })
      return
    }
    const item: EditorItem = {
      type: 'custom_module',
      name,
      description: customForm.description.trim(),
      quantity: 1,
      is_optional: false,
      sort_order: editor.state.items.length,
      module_description: customForm.sections.filter(
        (s) => s.section.trim() || s.description.trim()
      ),
      additionals: [],
      attachments: [],
    }
    editor.addItem(item)
    setCustomForm({ name: '', description: '', sections: [{ section: '', description: '' }] })
  }

  const handleAttachmentUpload = async (itemIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadingIndex(itemIndex)
    try {
      for (const file of Array.from(files)) {
        const attachment = await uploadAttachmentFile(file)
        editor.addAttachment(itemIndex, attachment)
      }
    } catch (error) {
      toast({
        title: 'Error al subir archivo',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setUploadingIndex(null)
      const input = fileInputRefs.current[itemIndex]
      if (input) input.value = ''
    }
  }

  const handleAttachmentAreaClick = (itemIndex: number) => {
    fileInputRefs.current[itemIndex]?.click()
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/delivery-receipts')}
            className="w-fit cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold">
                {mode === 'create'
                  ? 'Nuevo remito de entrega'
                  : `Remito ${editor.state.number}`}
              </h1>
              {mode !== 'create' && (
                <Badge variant="outline" className="text-xs">
                  {statusLabel(editor.state.status)}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {editor.isReadOnly ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDuplicate}
                    disabled={duplicating}
                  >
                    {duplicating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Duplicar
                  </Button>
                  {displayReceipt && (
                    <DeliveryReceiptPdfButton receipt={displayReceipt} onUploaded={() => onSaved?.()} />
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar borrador
                  </Button>
                  <Button onClick={handleIssue} disabled={issuing}>
                    {issuing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Emitir remito
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cliente y entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliente y entrega</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-1">
              <Label>Cliente</Label>
              <ClientSelector
                clients={clients}
                selected={selectedClient}
                onSelect={handleClientSelect}
                onCreateNew={() => setCreateClientOpen(true)}
              />
              {clientsLoading && (
                <p className="text-xs text-muted-foreground">Cargando clientes...</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Nombre / Razón social</Label>
              <Input
                id="client_name"
                value={editor.state.client_name}
                onChange={(e) => editor.setField('client_name', e.target.value)}
                disabled={editor.isReadOnly}
                placeholder="Nombre del cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_company">Empresa</Label>
              <Input
                id="client_company"
                value={editor.state.client_company}
                onChange={(e) => editor.setField('client_company', e.target.value)}
                disabled={editor.isReadOnly}
                placeholder="Empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_phone">Teléfono</Label>
              <Input
                id="client_phone"
                value={editor.state.client_phone}
                onChange={(e) => editor.setField('client_phone', e.target.value)}
                disabled={editor.isReadOnly}
                placeholder="Teléfono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email">Email</Label>
              <Input
                id="client_email"
                type="email"
                value={editor.state.client_email}
                onChange={(e) => editor.setField('client_email', e.target.value)}
                disabled={editor.isReadOnly}
                placeholder="Email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_address">Dirección de entrega</Label>
              <Input
                id="delivery_address"
                value={editor.state.delivery_address}
                onChange={(e) => editor.setField('delivery_address', e.target.value)}
                disabled={editor.isReadOnly}
                placeholder="Dirección de entrega"
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={editor.isReadOnly}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !editor.state.delivery_date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editor.state.delivery_date
                      ? displayDate(editor.state.delivery_date)
                      : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                {!editor.isReadOnly && (
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        editor.state.delivery_date
                          ? parseLocalDate(editor.state.delivery_date)
                          : undefined
                      }
                      onSelect={(date) =>
                        editor.setField('delivery_date', date ? formatIsoDate(date) : '')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                )}
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Tabs
                value={editor.state.type}
                onValueChange={(value) =>
                  editor.setType(value as 'sale' | 'rental')
                }
              >
                <TabsList className="w-full">
                  <TabsTrigger value="sale" className="flex-1" disabled={editor.isReadOnly}>
                    Venta
                  </TabsTrigger>
                  <TabsTrigger value="rental" className="flex-1" disabled={editor.isReadOnly}>
                    Alquiler
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={editor.state.notes}
              onChange={(e) => editor.setField('notes', e.target.value)}
              disabled={editor.isReadOnly}
              placeholder="Notas libres..."
              rows={3}
            />
            {!editor.isReadOnly && (
              <div className="flex gap-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Agregar nota a la lista"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      editor.addNote(newNote)
                      setNewNote('')
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    editor.addNote(newNote)
                    setNewNote('')
                  }}
                  disabled={!newNote.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            {editor.state.notes_list.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editor.state.notes_list.map((note, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {note}
                    {!editor.isReadOnly && (
                      <button
                        type="button"
                        onClick={() => editor.removeNote(idx)}
                        className="ml-1 rounded-full hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Condiciones de entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Condiciones de entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!editor.isReadOnly && (
              <div className="flex gap-2">
                <Input
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Agregar condición de entrega"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      editor.addDeliveryCondition(newCondition)
                      setNewCondition('')
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    editor.addDeliveryCondition(newCondition)
                    setNewCondition('')
                  }}
                  disabled={!newCondition.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            {editor.state.delivery_conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay condiciones de entrega cargadas.</p>
            ) : (
              <ol className="space-y-2 list-decimal list-inside">
                {editor.state.delivery_conditions.map((condition, idx) => (
                  <li key={idx} className="text-sm">
                    {editor.isReadOnly ? (
                      <span>{condition}</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          value={condition}
                          onChange={(e) => editor.updateDeliveryCondition(idx, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => editor.removeDeliveryCondition(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Agregar ítems */}
        {!editor.isReadOnly && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agregar ítems</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="standard" className="flex-1 cursor-pointer">
                    Módulos estándar
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1 cursor-pointer">
                    Personalizados
                  </TabsTrigger>
                  <TabsTrigger value="services" className="flex-1 cursor-pointer">
                    Servicios
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="standard" className="space-y-3 pt-2">
                  <Input
                    placeholder="Buscar módulo..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                  />
                  {modulesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando módulos...
                    </div>
                  ) : filteredModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No se encontraron módulos.</p>
                  ) : (
                    <div className="grid gap-2 max-h-80 overflow-y-auto">
                      {filteredModules.map((module) => (
                        <div
                          key={module.id}
                          className="flex items-start justify-between gap-3 border rounded-md p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{module.name}</p>
                            {module.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {module.description}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddStandardModule(module)}
                          >
                            Agregar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="custom" className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="custom_name">Nombre</Label>
                    <Input
                      id="custom_name"
                      value={customForm.name}
                      onChange={(e) =>
                        setCustomForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Nombre del módulo personalizado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom_description">Descripción general</Label>
                    <Textarea
                      id="custom_description"
                      value={customForm.description}
                      onChange={(e) =>
                        setCustomForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Descripción"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secciones de descripción</Label>
                    {customForm.sections.map((sec, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                        <Input
                          value={sec.section}
                          onChange={(e) =>
                            setCustomForm((f) => ({
                              ...f,
                              sections: f.sections.map((s, i) =>
                                i === idx ? { ...s, section: e.target.value } : s
                              ),
                            }))
                          }
                          placeholder="Sección"
                        />
                        <div className="flex gap-2">
                          <Textarea
                            value={sec.description}
                            onChange={(e) =>
                              setCustomForm((f) => ({
                                ...f,
                                sections: f.sections.map((s, i) =>
                                  i === idx ? { ...s, description: e.target.value } : s
                                ),
                              }))
                            }
                            placeholder="Descripción"
                            rows={1}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setCustomForm((f) => ({
                                ...f,
                                sections: f.sections.filter((_, i) => i !== idx),
                              }))
                            }
                            disabled={customForm.sections.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCustomForm((f) => ({
                          ...f,
                          sections: [...f.sections, { section: '', description: '' }],
                        }))
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar sección
                    </Button>
                  </div>
                  <Button type="button" onClick={handleAddCustomModule}>
                    Agregar módulo personalizado
                  </Button>
                </TabsContent>

                <TabsContent value="services" className="space-y-3 pt-2">
                  <Input
                    placeholder="Buscar servicio..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                  />
                  {servicesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando servicios...
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No se encontraron servicios.</p>
                  ) : (
                    <div className="grid gap-2 max-h-80 overflow-y-auto">
                      {filteredServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-start justify-between gap-3 border rounded-md p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddService(service)}
                          >
                            Agregar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Lista de ítems */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Ítems del remito</h2>
          {editor.state.items.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No hay ítems agregados.
              </CardContent>
            </Card>
          ) : (
            editor.state.items.map((item, index) => (
              <Card key={`${item.type}-${index}`}>
                <CardHeader>
                  <Badge variant="outline" className="w-fit">
                    {typeLabel(item.type)}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nombre</Label>
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            editor.updateItem(index, { name: e.target.value })
                          }
                          disabled={editor.isReadOnly}
                          placeholder="Nombre"
                          className="flex-1 min-w-[200px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Descripción general</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) =>
                            editor.updateItem(index, { description: e.target.value })
                          }
                          disabled={editor.isReadOnly}
                          placeholder="Descripción"
                          rows={2}
                        />
                      </div>

                      {item.type === 'service' && (
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`optional-${index}`}
                            checked={item.is_optional}
                            onCheckedChange={(checked) =>
                              editor.updateItem(index, { is_optional: checked })
                            }
                            disabled={editor.isReadOnly}
                          />
                          <Label htmlFor={`optional-${index}`}>Servicio opcional</Label>
                        </div>
                      )}

                      {item.type === 'custom_module' && (
                        <div className="space-y-2">
                          <Label>Secciones</Label>
                          {item.module_description.map((sec, si) => (
                            <div
                              key={si}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start"
                            >
                              <Input
                                value={sec.section}
                                onChange={(e) =>
                                  editor.updateCustomSection(index, si, {
                                    section: e.target.value,
                                  })
                                }
                                disabled={editor.isReadOnly}
                                placeholder="Sección"
                              />
                              <div className="flex gap-2">
                                <Textarea
                                  value={sec.description}
                                  onChange={(e) =>
                                    editor.updateCustomSection(index, si, {
                                      description: e.target.value,
                                    })
                                  }
                                  disabled={editor.isReadOnly}
                                  placeholder="Descripción"
                                  rows={1}
                                />
                                {!editor.isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      editor.removeCustomSection(index, si)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {!editor.isReadOnly && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => editor.addCustomSection(index)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar sección
                            </Button>
                          )}
                        </div>
                      )}

                      {item.additionals.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Adicionales
                          </p>
                          <ul className="text-sm space-y-1">
                            {item.additionals.map((ad, ai) => (
                              <li key={ai} className="text-muted-foreground">
                                • {ad.name} x {ad.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>

                    <div className="flex flex-row sm:flex-col items-start gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs whitespace-nowrap">Cantidad</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={item.quantity}
                            onChange={(e) =>
                              editor.updateItem(index, {
                                quantity: Number(e.target.value) || 1,
                              })
                            }
                            disabled={editor.isReadOnly}
                            className="w-20"
                          />
                          {!editor.isReadOnly && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => editor.removeItem(index)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t">
                    <Label className="text-xs">Archivos adjuntos (PDFs)</Label>
                    {item.attachments.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {item.attachments.map((att, ai) => (
                          <div
                            key={att.storage_path}
                            className="flex items-center gap-2 p-2 bg-muted/40 rounded-md text-xs border"
                          >
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 truncate hover:underline text-primary"
                            >
                              {att.original_name}
                            </a>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {(att.size / 1024).toFixed(0)} KB
                            </span>
                            {!editor.isReadOnly && (
                              <button
                                type="button"
                                onClick={() => editor.removeAttachment(index, ai)}
                                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-1"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {!editor.isReadOnly && (
                      <div
                        className="border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer hover:bg-muted/30"
                        onClick={() => handleAttachmentAreaClick(index)}
                      >
                        <input
                          ref={(el) => {
                            fileInputRefs.current[index] = el
                          }}
                          type="file"
                          accept="application/pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => handleAttachmentUpload(index, e.target.files)}
                          disabled={uploadingIndex === index}
                        />
                        {uploadingIndex === index ? (
                          <p className="text-xs sm:text-sm text-muted-foreground">Subiendo...</p>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Hacé clic para subir un PDF
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <QuickCreateClientDialog
        open={createClientOpen}
        onClose={() => setCreateClientOpen(false)}
        onCreate={handleCreateClient}
      />
    </MainLayout>
  )
}
