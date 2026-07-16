"use client"

import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Download,
  Copy,
  Pencil,
  Trash2,
  Eye,
  FileX,
  Send,
  FileText,
} from "lucide-react"
import Link from "next/link"
import type { DeliveryReceipt } from "@/hooks/use-delivery-receipts"

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  issued: "Emitido",
}

const STATUS_VARIANTS: Record<
  string,
  "secondary" | "default" | "outline" | "destructive"
> = {
  draft: "secondary",
  issued: "default",
}

interface DeliveryReceiptRowProps {
  receipt: DeliveryReceipt
  onIssue: (id: string) => Promise<void>
  onDuplicate: (id: string) => Promise<string>
  onDeleteClick: (receipt: DeliveryReceipt) => void
  role: string
  userId: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function DeliveryReceiptRow({
  receipt,
  onIssue,
  onDuplicate,
  onDeleteClick,
  role,
  userId,
}: DeliveryReceiptRowProps) {
  const canEdit = receipt.status === "draft"
  const canDelete =
    role === "admin" ||
    role === "supervisor" ||
    (receipt.created_by === userId && receipt.status === "draft")

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium tabular-nums">{receipt.number}</TableCell>
      <TableCell>
        <Badge
          variant={receipt.type === "rental" ? "secondary" : "outline"}
          className="text-xs"
        >
          {receipt.type === "rental" ? "Alquiler" : "Venta"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{receipt.client_name}</span>
          {receipt.client_company && (
            <span className="text-xs text-muted-foreground">
              {receipt.client_company}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANTS[receipt.status]} className="text-xs">
          {STATUS_LABELS[receipt.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDate(receipt.issue_date)}
      </TableCell>
      <TableCell className="text-right">
        <TooltipProvider>
          <div className="flex justify-end gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer"
                  asChild
                >
                  <Link href={`/admin/delivery-receipts/${receipt.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver / {canEdit ? "Editar" : "Detalle"}</p>
              </TooltipContent>
            </Tooltip>

            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    asChild
                  >
                    <Link href={`/admin/delivery-receipts/${receipt.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar</p>
                </TooltipContent>
              </Tooltip>
            )}

            {receipt.status === "draft" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={() => onIssue(receipt.id)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Emitir remito</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer"
                  onClick={() => onDuplicate(receipt.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicar</p>
              </TooltipContent>
            </Tooltip>

            {receipt.pdf_url ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0 cursor-pointer"
                      asChild
                    >
                      <a
                        href={receipt.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver PDF</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0 cursor-pointer"
                      asChild
                    >
                      <a
                        href={receipt.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Descargar PDF</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-not-allowed opacity-50"
                    disabled
                  >
                    <FileX className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sin PDF generado</p>
                </TooltipContent>
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={() => onDeleteClick(receipt)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Eliminar</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  )
}
