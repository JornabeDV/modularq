"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PurchaseRequestManagement } from "./purchase-request-management"
import { PurchaseOrderManagement } from "./purchase-order-management"
import { ClipboardList, ShoppingCart } from "lucide-react"

export function PurchaseManagementTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam === "orders" ? "orders" : "requests")

  useEffect(() => {
    if (tabParam === "orders" || tabParam === "requests") {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.replace(`/admin/purchase-management?tab=${value}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Compra</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Pedidos de materiales, presupuestos y órdenes de compra
          </p>
        </div>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="requests" className="gap-2 cursor-pointer px-2">
            <ClipboardList className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline truncate">Pedidos de Materiales</span>
            <span className="sm:hidden truncate">Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2 cursor-pointer px-2">
            <ShoppingCart className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline truncate">Órdenes de Compra</span>
            <span className="sm:hidden truncate">Órdenes</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="requests" className="space-y-6 mt-0">
        <PurchaseRequestManagement />
      </TabsContent>

      <TabsContent value="orders" className="space-y-6 mt-0">
        <PurchaseOrderManagement />
      </TabsContent>
    </Tabs>
  )
}
