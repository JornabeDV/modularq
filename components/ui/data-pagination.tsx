"use client"

import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

export interface DataPaginationProps {
  /** Total de items a paginar */
  totalItems: number
  /** Items por página */
  itemsPerPage: number
  /** Página actual (1-indexed) */
  currentPage: number
  /** Callback cuando cambia la página */
  onPageChange: (page: number) => void
  /** Callback cuando cambia el número de items por página */
  onItemsPerPageChange?: (itemsPerPage: number) => void
  /** Opciones de items por página */
  itemsPerPageOptions?: number[]
  /** Mostrar selector de items por página */
  showItemsPerPageSelector?: boolean
  /** Clase adicional para el contenedor */
  className?: string
  /** Texto personalizado para "Mostrando" */
  showingText?: string
  /** Texto personalizado para "de" */
  ofText?: string
  /** Texto personalizado para "items" */
  itemsText?: string
}

export function DataPagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  showItemsPerPageSelector = true,
  className,
  showingText = "Mostrando",
  ofText = "de",
  itemsText = "items",
}: DataPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generar números de página a mostrar
  const getPageNumbers = (isMobile: boolean = false) => {
    const pages: (number | 'ellipsis')[] = []
    // En móviles mostrar menos páginas
    const maxVisible = isMobile ? 3 : 7

    if (totalPages <= maxVisible) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (isMobile) {
        // En móviles: mostrar solo página actual y adyacentes
        if (currentPage === 1) {
          pages.push(1, 2)
          if (totalPages > 2) pages.push('ellipsis')
        } else if (currentPage === totalPages) {
          if (totalPages > 2) pages.push('ellipsis')
          pages.push(totalPages - 1, totalPages)
        } else {
          pages.push('ellipsis')
          pages.push(currentPage - 1, currentPage, currentPage + 1)
          pages.push('ellipsis')
        }
      } else {
        // Desktop: lógica completa
        pages.push(1)

        if (currentPage <= 3) {
          // Cerca del inicio
          for (let i = 2; i <= 4; i++) {
            pages.push(i)
          }
          pages.push('ellipsis')
          pages.push(totalPages)
        } else if (currentPage >= totalPages - 2) {
          // Cerca del final
          pages.push('ellipsis')
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i)
          }
        } else {
          // En el medio
          pages.push('ellipsis')
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i)
          }
          pages.push('ellipsis')
          pages.push(totalPages)
        }
      }
    }

    return pages
  }

  // Detectar si es móvil (usando hook o media query)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const pageNumbers = getPageNumbers(isMobile)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10)
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage)
      // Ajustar la página actual si es necesario
      const newTotalPages = Math.ceil(totalItems / newItemsPerPage)
      if (currentPage > newTotalPages) {
        onPageChange(newTotalPages)
      }
    }
  }

  if (totalItems === 0) {
    return null
  }

  return (
    <div className={cn("flex flex-col gap-3 sm:gap-4", className)}>
      {/* Información de paginación - más compacta en móvil */}
      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        {showingText} <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> {ofText} <span className="font-medium">{totalItems}</span> {itemsText}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Selector de items por página */}
        {showItemsPerPageSelector && onItemsPerPageChange && (
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">
              Por página:
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap sm:hidden">
              Por pág:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="h-8 w-[60px] sm:w-[70px] text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Controles de paginación */}
        <div className="w-full sm:w-auto order-1 sm:order-2">
          <Pagination>
            <PaginationContent className="flex-wrap justify-center gap-1 sm:gap-1">
              {/* Primera página - oculto en móvil */}
              <PaginationItem className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-8 sm:w-8"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  aria-label="Primera página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>

              {/* Página anterior */}
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-8 sm:w-8"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>

              {/* Números de página */}
              {pageNumbers.map((page, index) => {
                if (page === 'ellipsis') {
                  return (
                    <PaginationItem key={`ellipsis-${index}`} className="hidden sm:block">
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(page)
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer h-9 w-9 sm:h-8 sm:w-8 text-sm"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {/* Página siguiente */}
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-8 sm:w-8"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>

              {/* Última página - oculto en móvil */}
              <PaginationItem className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-8 sm:w-8"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}

