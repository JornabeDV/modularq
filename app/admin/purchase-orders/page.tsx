"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PurchaseOrdersRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/purchase-management?tab=orders")
  }, [router])

  return null
}
