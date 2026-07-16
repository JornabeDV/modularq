'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DeliveryReceiptEditor } from '@/components/delivery-receipts/delivery-receipt-editor'

export default function NewDeliveryReceiptPage() {
  const router = useRouter()
  const { userProfile, isLoading } = useAuth()

  if (isLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <DeliveryReceiptEditor
      mode="create"
      userId={userProfile.id}
      onSaved={(id) => {
        if (id) {
          router.push(`/admin/delivery-receipts/${id}`)
        } else {
          router.push('/admin/delivery-receipts')
        }
      }}
    />
  )
}
