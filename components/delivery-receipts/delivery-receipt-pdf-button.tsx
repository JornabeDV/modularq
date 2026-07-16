'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { pdf } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import {
  DeliveryReceiptPDFDocument,
  type DeliveryReceiptPDFData,
} from '@/components/delivery-receipts/DeliveryReceiptPDFDocument'
import type { DeliveryReceiptWithItems } from '@/hooks/use-delivery-receipt'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface DeliveryReceiptPdfButtonProps {
  receipt: DeliveryReceiptWithItems
  label?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  onUploaded?: (url: string) => void
}

function toPdfData(receipt: DeliveryReceiptWithItems): DeliveryReceiptPDFData {
  return {
    number: receipt.number,
    type: receipt.type,
    status: receipt.status,
    client_name: receipt.client_name,
    client_company: receipt.client_company,
    client_cuit: receipt.client_cuit,
    client_phone: receipt.client_phone,
    client_email: receipt.client_email,
    delivery_address: receipt.delivery_address,
    issue_date: receipt.issue_date,
    delivery_date: receipt.delivery_date,
    notes: receipt.notes,
    delivery_conditions: receipt.delivery_conditions,
    notes_list: receipt.notes_list,
    items: receipt.items.map((item) => ({
      type: item.type,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      is_optional: item.is_optional,
      module_description: item.module_description,
      additionals: item.additionals?.map((a) => ({ name: a.name, quantity: a.quantity })),
    })),
  }
}

async function uploadReceiptPdf(
  receiptId: string,
  number: string,
  blob: Blob
): Promise<string> {
  if (!supabase) throw new Error('Supabase no está inicializado')

  const sanitized = number.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100)
  const path = `delivery-receipts/${receiptId}/${Date.now()}_${sanitized}.pdf`

  const { data, error } = await supabase.storage
    .from('project-files')
    .upload(path, blob, { contentType: 'application/pdf', upsert: false })

  if (error || !data) {
    throw new Error(error?.message ?? 'Error al subir PDF')
  }

  const { data: publicUrlData } = supabase.storage
    .from('project-files')
    .getPublicUrl(data.path)

  const { error: updateError } = await supabase
    .from('delivery_receipts')
    .update({ pdf_url: publicUrlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', receiptId)

  if (updateError) {
    console.error('Error updating pdf_url:', updateError)
  }

  return publicUrlData.publicUrl
}

export function DeliveryReceiptPdfButton({
  receipt,
  label = 'Descargar PDF',
  variant = 'outline',
  size = 'default',
  className,
  onUploaded,
}: DeliveryReceiptPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const blob = await pdf(<DeliveryReceiptPDFDocument receipt={toPdfData(receipt)} />).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${receipt.number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      if (receipt.id) {
        try {
          const publicUrl = await uploadReceiptPdf(receipt.id, receipt.number, blob)
          onUploaded?.(publicUrl)
        } catch (err) {
          console.error('Error uploading PDF to storage:', err)
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'Error al generar PDF',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  )
}
