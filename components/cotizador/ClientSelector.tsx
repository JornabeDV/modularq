"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Client } from "@/hooks/use-clients-prisma";

interface ClientSelectorProps {
  clients: Client[];
  selected: Client | null;
  onSelect: (client: Client | null) => void;
  onCreateNew: () => void;
}

export function ClientSelector({
  clients,
  selected,
  onSelect,
  onCreateNew,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected ? selected.companyName : "Buscar cliente..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por empresa o CUIT..." className="h-9" />
          <CommandList>
            <CommandEmpty>
              <div className="py-3 px-2 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No se encontró el cliente.</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => { setOpen(false); onCreateNew(); }}>
                  <UserPlus className="w-3.5 h-3.5 mr-2" />
                  Crear nuevo cliente
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.companyName} ${client.cuit}`}
                  onSelect={() => {
                    onSelect(selected?.id === client.id ? null : client);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      selected?.id === client.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.companyName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{client.cuit}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <div className="border-t p-1">
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={() => { setOpen(false); onCreateNew(); }}
              >
                <UserPlus className="w-3.5 h-3.5 mr-2" />
                Crear nuevo cliente
              </Button>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
