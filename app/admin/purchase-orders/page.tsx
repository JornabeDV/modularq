"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { useSuppliers } from "@/hooks/use-suppliers"
import { PurchaseOrderStatusBadge } from "@/components/purchase-orders/PurchaseOrderStatusBadge"
import { MainLayout } from "@/components/layout/main-layout"
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  Loader2,
} from "lucide-react"

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "draft", label: "Borrador" },
  { value: "pending", label: "Pendiente" },
  { value: "approved", label: "Aprobada" },
  { value: "received", label: "Recibida" },
  { value: "cancelled", label: "Cancelada" },
]

const NEXT_STATUS: Record<string, { status: string; label: string; icon: React.ReactNode }> = {
  draft: { status: "pending", label: "Enviar", icon: <Clock className="h-3.5 w-3.5" /> },
  pending: { status: "approved", label: "Aprobar", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  approved: { status: "received", label: "Recibir", icon: <Package className="h-3.5 w-3.5" /> },
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { purchaseOrders, loading, fetchPurchaseOrders, deletePurchaseOrder, updatePurchaseOrderStatus } =
    usePurchaseOrders()
  const { suppliers } = useSuppliers()

  const [statusFilter, setStatusFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)

  const filteredOrders = purchaseOrders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false
    if (supplierFilter !== "all" && order.supplier_id !== supplierFilter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        order.order_number.toLowerCase().includes(term) ||
        order.supplier?.name?.toLowerCase().includes(term)
      )
    }
    return true
  })

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deletePurchaseOrder(deleteId)
      toast({ title: "Orden eliminada", description: "La orden de compra fue eliminada exitosamente." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    setProcessingStatus(id)
    try {
      await updatePurchaseOrderStatus(id, newStatus)
      toast({ title: "Estado actualizado", description: `La orden pasó a estado: ${newStatus}` })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar estado",
        variant: "destructive",
      })
    } finally {
      setProcessingStatus(null)
    }
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
          <Button onClick={() => router.push("/admin/purchase-orders/new")}>
            <Plus className="h-4 w-4 mr-2" /> Nueva Orden
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filteredOrders.length} orden{filteredOrders.length !== 1 ? "es" : ""} encontrada
              {filteredOrders.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No se encontraron órdenes de compra.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.supplier?.name || "—"}</TableCell>
                          <TableCell>
                            <PurchaseOrderStatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${order.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(order.created_at).toLocaleDateString("es-AR")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => router.push(`/admin/purchase-orders/${order.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => router.push(`/admin/purchase-orders/${order.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {NEXT_STATUS[order.status] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1 text-xs"
                                  onClick={() =>
                                    handleStatusChange(order.id, NEXT_STATUS[order.status].status)
                                  }
                                  disabled={processingStatus === order.id}
                                >
                                  {processingStatus === order.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    NEXT_STATUS[order.status].icon
                                  )}
                                  {NEXT_STATUS[order.status].label}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeleteId(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog eliminar */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la orden y todos sus ítems.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
