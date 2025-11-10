"use client"

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { FileMetadata } from '@/lib/supabase-storage'
import { SupabaseFileStorage } from '@/lib/supabase-storage'

interface ExcelViewerProps {
  file: FileMetadata | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SheetData {
  name: string
  data: any[][]
}

export function ExcelViewer({ file, open, onOpenChange }: ExcelViewerProps) {
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadExcelFile = useCallback(async () => {
    if (!file) return

    try {
      setLoading(true)
      setError(null)

      // Obtener URL firmada del archivo
      const url = await SupabaseFileStorage.getSignedUrl(file.storage_path)
      
      // Descargar el archivo
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Error al obtener el archivo')
      }

      const arrayBuffer = await response.arrayBuffer()
      
      // Parsear el archivo Excel
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Convertir cada hoja a datos
      const sheetData: SheetData[] = workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        return {
          name: sheetName,
          data: jsonData as any[][]
        }
      })

      setSheets(sheetData)
    } catch (err) {
      console.error('Error loading Excel file:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el archivo Excel')
    } finally {
      setLoading(false)
    }
  }, [file])

  useEffect(() => {
    if (open && file && file.file_type === 'excel') {
      loadExcelFile()
    } else {
      setSheets([])
      setError(null)
    }
  }, [open, file, loadExcelFile])

  const renderCell = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const calculateColumnWidth = (sheet: SheetData, colIndex: number): number => {
    if (!sheet.data || sheet.data.length === 0) return 120
    
    let maxLength = 0
    // Revisar todas las filas de esta columna
    for (let rowIndex = 0; rowIndex < sheet.data.length; rowIndex++) {
      const cellValue = renderCell(sheet.data[rowIndex]?.[colIndex])
      const length = cellValue.length
      if (length > maxLength) {
        maxLength = length
      }
    }
    
    // Calcular ancho basado en el contenido (aproximadamente 8px por carácter)
    // Mínimo 120px, máximo 400px
    const calculatedWidth = Math.max(120, Math.min(400, maxLength * 8 + 24))
    return calculatedWidth
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[90vw] w-full h-[90vh] p-6 flex flex-col"
      >
        <DialogHeader className="pb-4 shrink-0">
          <DialogTitle>{file?.file_name || 'Visualizador de Excel'}</DialogTitle>
          <DialogDescription>
            Visualización del contenido del archivo Excel
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-sm text-muted-foreground">Cargando archivo Excel...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : sheets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
            </div>
          ) : (
            <Tabs defaultValue={sheets[0]?.name} className="w-full h-full flex flex-col">
              <TabsList className="grid w-full shrink-0" style={{ gridTemplateColumns: `repeat(${Math.min(sheets.length, 5)}, 1fr)` }}>
                {sheets.map((sheet) => (
                  <TabsTrigger key={sheet.name} value={sheet.name} className="truncate">
                    {sheet.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {sheets.map((sheet) => {
                // Calcular el ancho total de la tabla
                const totalWidth = sheet.data[0]?.reduce((sum, _, colIndex) => {
                  return sum + calculateColumnWidth(sheet, colIndex)
                }, 0) || 0
                
                return (
                  <TabsContent key={sheet.name} value={sheet.name} className="mt-4 flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="w-full h-full border rounded-md overflow-auto">
                      <table className="border-collapse" style={{ width: `${Math.max(totalWidth, 800)}px` }}>
                        <thead className="bg-muted/50 sticky top-0 z-10">
                          {sheet.data.length > 0 && (
                            <tr>
                              {sheet.data[0].map((_, colIndex) => {
                                const colWidth = calculateColumnWidth(sheet, colIndex)
                                return (
                                  <th 
                                    key={colIndex} 
                                    className="border border-border px-3 py-2 text-left text-sm font-medium text-foreground"
                                    style={{ minWidth: `${colWidth}px`, width: `${colWidth}px` }}
                                  >
                                    <div className="truncate" title={renderCell(sheet.data[0][colIndex]) || `Columna ${colIndex + 1}`}>
                                      {renderCell(sheet.data[0][colIndex]) || `Columna ${colIndex + 1}`}
                                    </div>
                                  </th>
                                )
                              })}
                            </tr>
                          )}
                        </thead>
                        <tbody>
                          {sheet.data.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-muted/50">
                              {sheet.data[0].map((_, colIndex) => {
                                const colWidth = calculateColumnWidth(sheet, colIndex)
                                return (
                                  <td 
                                    key={colIndex} 
                                    className="border border-border px-3 py-2 text-sm text-foreground"
                                    style={{ minWidth: `${colWidth}px`, width: `${colWidth}px` }}
                                  >
                                    <div className="break-words max-h-20 overflow-y-auto" title={renderCell(row[colIndex])}>
                                      {renderCell(row[colIndex])}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sheet.data.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          No hay datos en esta hoja
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}