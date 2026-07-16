"use client";

import * as React from "react";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogFormProps extends React.ComponentProps<typeof DialogContent> {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

export function DialogForm({
  onSubmit,
  children,
  className,
  ...props
}: DialogFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit(e);
  };

  return (
    <DialogContent className={cn(className)} {...props}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-w-0 max-sm:h-full">
        {children}
      </form>
    </DialogContent>
  );
}
