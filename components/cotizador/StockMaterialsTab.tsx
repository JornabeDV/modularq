"use client";

import { useState, useMemo } from "react";
import { Package, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StockMaterial } from "@/hooks/use-stock-materials";
import type { ExchangeRate } from "@/lib/exchange-rate";
import { DataPagination } from "@/components/ui/data-pagination";

interface StockMaterialsTabProps {
  materials: StockMaterial[];
  loading: boolean;
  onAddMaterial: (material: StockMaterial, quantity: number) => void;
  exchangeRate: ExchangeRate | null;
  currency: "ARS" | "USD";
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatARS(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatPrice(amount: number, curr: "ARS" | "USD"): string {
  return curr === "ARS" ? formatARS(amount) : formatUSD(amount);
}

export function StockMaterialsTab({
  materials,
  loading,
  onAddMaterial,
  exchangeRate,
  currency,
}: StockMaterialsTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const categories = useMemo(() => {
    const seen: Record<string, string> = {};
    for (const m of materials) {
      if (!seen[m.category]) {
        seen[m.category] = m.categoryName || m.category;
      }
    }
    return Object.entries(seen)
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [materials]);

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchesCategory =
        categoryFilter === "all" || m.category === categoryFilter;
      const matchesSearch =
        m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [materials, categoryFilter, searchTerm]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = useMemo(() => {
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, startIndex]);

  function getMaterialPriceARS(material: StockMaterial): number {
    if (material.precioVenta != null && material.precioVenta > 0) {
      if (material.currency === "USD") {
        const rate = material.exchangeRate ?? 0;
        return rate > 0 ? material.precioVenta * rate : 0;
      }
      return material.precioVenta;
    }
    if (material.currency === "USD") {
      if (material.unitPriceARS != null && material.unitPriceARS > 0) {
        return material.unitPriceARS;
      }
      const rate = material.exchangeRate ?? 0;
      return rate > 0 && material.unitPrice
        ? material.unitPrice * rate
        : 0;
    }
    return material.unitPrice ?? 0;
  }

  function getDisplayPrice(material: StockMaterial): number {
    const priceARS = getMaterialPriceARS(material);
    if (currency === "USD" && exchangeRate && exchangeRate.venta > 0) {
      return priceARS / exchangeRate.venta;
    }
    if (currency === "ARS" && exchangeRate && exchangeRate.venta > 0) {
      return priceARS;
    }
    return priceARS;
  }

  function renderPrice(material: StockMaterial) {
    const display = getDisplayPrice(material);
    const priceARS = getMaterialPriceARS(material);

    if (currency === "USD") {
      if (exchangeRate) {
        return (
          <>
            <span className="text-sm font-semibold tabular-nums">
              {formatUSD(display)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums block">
              {formatARS(priceARS)}
            </span>
          </>
        );
      }
      return (
        <span className="text-sm font-semibold tabular-nums">
          {formatUSD(display)}
        </span>
      );
    }

    if (exchangeRate) {
      return (
        <>
          <span className="text-sm font-semibold tabular-nums">
            {formatARS(display)}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums block">
            {formatUSD(display / exchangeRate.venta)}
          </span>
        </>
      );
    }
    return (
      <span className="text-sm font-semibold tabular-nums">
        {formatARS(display)}
      </span>
    );
  }

  function handleAdd(material: StockMaterial) {
    const qty = Math.min(Number(quantities[material.id]) || 1, maxStock(material));
    if (qty < 1) return;
    onAddMaterial(material, qty);
  }

  function maxStock(material: StockMaterial) {
    return Math.max(1, Math.floor(material.stockQuantity));
  }

  function handleQuantityChange(materialId: string, value: string) {
    setQuantities((prev) => ({ ...prev, [materialId]: value }));
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando materiales...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 text-sm"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-sm w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {paginated.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {searchTerm || categoryFilter !== "all"
              ? "No se encontraron materiales con ese criterio."
              : "No hay materiales con stock disponible."}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-background">
                  <TableHead className="min-w-[200px]">Material</TableHead>
                  <TableHead className="min-w-[80px]">Stock</TableHead>
                  <TableHead className="min-w-[120px] text-right">Precio Unit.</TableHead>
                  <TableHead className="min-w-[120px] text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((material) => {
                  const displayPrice = getDisplayPrice(material);
                  const qty = Number(quantities[material.id]) || 1;
                  const maxQty = maxStock(material);
                  const isLowStock = material.stockQuantity <= material.minStock;

                  return (
                    <>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{material.name}</p>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 shrink-0"
                            >
                              {material.code}
                            </Badge>
                            {material.brand && (
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                {material.brand}
                              </span>
                            )}
                            {isLowStock && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                                <AlertCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Stock bajo</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {Math.floor(material.stockQuantity)}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          {renderPrice(material)}
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatPrice(displayPrice * qty, currency)}
                          </span>
                        </TableCell>
                      </TableRow>

                      <TableRow className="hover:bg-muted/50">
                        <TableCell colSpan={4} className="bg-muted/20">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground shrink-0">
                              Cantidad:
                            </span>
                            <Input
                              type="number"
                              min={1}
                              max={maxQty}
                              value={quantities[material.id] ?? "1"}
                              onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                              className="w-20 h-8 text-sm text-center tabular-nums"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              className="h-8 px-4 cursor-pointer"
                              disabled={qty < 1 || qty > maxQty}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdd(material);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Agregar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filtered.length > ITEMS_PER_PAGE && (
            <DataPagination
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              showItemsPerPageSelector={false}
            />
          )}
        </>
      )}
    </div>
  );
}
