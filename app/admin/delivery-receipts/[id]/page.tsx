'use client'

import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useDeliveryReceipt } from '@/hooks/use-delivery-receipt'
import { DeliveryReceiptEditor } from '@/components/delivery-receipts/delivery-receipt-editor'
import { Button } from '@/components/ui/button'

export default function EditDeliveryReceiptPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''

  const { userProfile, isLoading: authLoading } = useAuth()
  const { receipt, loading, error, reload } = useDeliveryReceipt(id)

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive text-center">
          {error || 'No se encontró el remito.'}
        </p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  return (
    <DeliveryReceiptEditor
      mode="edit"
      receiptId={id}
      initialReceipt={receipt}
      userId={userProfile.id}
      onSaved={() => reload()}
    />
  )
}
