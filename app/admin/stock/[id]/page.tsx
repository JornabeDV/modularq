"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, History, SlidersHorizontal, Loader2 } from "lucide-react";
import { StockMovementList } from "@/components/admin/materials/stock-movement-list";
import { MaterialStockAdjustDialog } from "@/components/admin/materials/material-stock-adjust-dialog";
import { useStockMovements } from "@/hooks/use-stock-movements";
import { PrismaTypedService } from "@/lib/prisma-typed-service";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard";
import type { Material } from "@/hooks/use-materials-prisma";

const CATEGORY_LABELS: Record<string, string> = {
  estructura: "Estructura",
  paneles: "Paneles",
  herrajes: "Herrajes",
  aislacion: "Aislación",
  electricidad: "Electricidad",
  sanitarios: "Sanitarios",
  otros: "Otros",
  adicional: "Adicional",
};

const UNIT_LABELS: Record<string, string> = {
  unidad: "Unidad",
  metro: "m",
  metro_cuadrado: "m²",
  metro_cubico: "m³",
  kilogramo: "kg",
  litro: "L",
};

function formatMaterial(data: any): Material {
  return {
    id: data.id,
    code: data.code,
    name: data.name,
    description: data.description,
    category: data.category,
    unit: data.unit,
    stockQuantity: data.stock_quantity ?? 0,
    minStock: data.min_stock ?? 0,
    unitPrice: data.unit_price,
    supplier: data.supplier,
    brand: data.brand,
    createdAt:
      typeof data.created_at === "string"
        ? data.created_at
        : data.created_at.toISOString(),
    updatedAt:
      typeof data.updated_at === "string"
        ? data.updated_at
        : data.updated_at.toISOString(),
  };
}

function PageContent() {
  const params = useParams();
  const router = useRouter();
  const materialId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const { movements, loading: movementsLoading, refetch } = useStockMovements(
    materialId ?? null
  );

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);

  const loadMaterial = async () => {
    if (!materialId) {
      setError("ID de material no válido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await PrismaTypedService.getMaterialById(materialId);
      if (!data) {
        setError("Material no encontrado");
      } else {
        setMaterial(formatMaterial(data));
      }
    } catch (err) {
      console.error("Error loading material:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el material");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterial();
  }, [materialId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>{error || "Material no encontrado"}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/admin/stock")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al stock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLowStock = material.stockQuantity <= material.minStock;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/stock")}
          className="w-fit cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 flex-wrap">
              {material.name}
              <Badge variant="outline">{material.code}</Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              {CATEGORY_LABELS[material.category] || material.category} ·{" "}
              {isLowStock ? (
                <span className="text-destructive font-medium">
                  Stock bajo: {material.stockQuantity} {UNIT_LABELS[material.unit] || material.unit}
                </span>
              ) : (
                <span>
                  Stock: {material.stockQuantity} {UNIT_LABELS[material.unit] || material.unit}
                </span>
              )}
            </p>
          </div>

          <Button className="cursor-pointer" onClick={() => setShowAdjustDialog(true)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Ajustar stock
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="general" className="cursor-pointer">
            Información general
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1 cursor-pointer">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información general</CardTitle>
              <CardDescription>Detalles del material</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Categoría</p>
                  <p className="font-medium">
                    {CATEGORY_LABELS[material.category] || material.category}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unidad</p>
                  <p className="font-medium">
                    {UNIT_LABELS[material.unit] || material.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock actual</p>
                  <p className={`font-medium ${isLowStock ? "text-destructive" : ""}`}>
                    {material.stockQuantity} {UNIT_LABELS[material.unit] || material.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock mínimo</p>
                  <p className="font-medium">
                    {material.minStock} {UNIT_LABELS[material.unit] || material.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Precio unitario</p>
                  <p className="font-medium">
                    {material.unitPrice
                      ? `$ ${material.unitPrice.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Proveedor</p>
                  <p className="font-medium">{material.supplier || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Marca</p>
                  <p className="font-medium">{material.brand || "—"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Descripción</p>
                  <p className="font-medium">{material.description || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de movimientos</CardTitle>
              <CardDescription>
                Entradas, salidas y ajustes de stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockMovementList
                movements={movements}
                loading={movementsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MaterialStockAdjustDialog
        material={material}
        open={showAdjustDialog}
        onOpenChange={setShowAdjustDialog}
        onSuccess={() => {
          loadMaterial();
          refetch();
        }}
      />
    </div>
  );
}

export default function MaterialDetailPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <PageContent />
      </MainLayout>
    </AdminOrSupervisorOnly>
  );
}
