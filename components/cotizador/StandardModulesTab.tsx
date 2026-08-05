"use client";

import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StandardModule } from "@/hooks/use-standard-modules";
import { ExchangeRate } from "@/lib/exchange-rate";

interface StandardModulesTabProps {
  modules: StandardModule[];
  loading: boolean;
  onAddModule: (mod: StandardModule) => void;
  exchangeRate: ExchangeRate | null;
  currency: 'ARS' | 'USD';
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
    minimumFractionDigits: 0,
  }).format(amount);
}

export function StandardModulesTab({ modules, loading, onAddModule, exchangeRate, currency }: StandardModulesTabProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando módulos...</p>;
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No hay módulos disponibles.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {modules.map((mod) => (
        <Card
          key={mod.id}
          className="cursor-pointer hover:shadow-md transition-shadow md:py-4"
          onClick={() => onAddModule(mod)}
        >
          <CardContent className="py-3 px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{mod.name}</p>
                {mod.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                    {mod.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-end">
                  {exchangeRate ? (
                    <>
                      <span className="text-sm font-semibold tabular-nums">
                        {currency === 'USD'
                          ? formatUSD(mod.base_price)
                          : formatARS(mod.base_price * exchangeRate.venta)}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {currency === 'USD'
                          ? formatARS(mod.base_price * exchangeRate.venta)
                          : formatUSD(mod.base_price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold tabular-nums">
                      {formatUSD(mod.base_price)}
                    </span>
                  )}
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 cursor-pointer">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
