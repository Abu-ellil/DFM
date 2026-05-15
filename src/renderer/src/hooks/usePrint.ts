import { useState, useCallback } from 'react'

export const usePrint = () => {
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
  const [printContent, setPrintContent] = useState<React.ReactNode>(null)
  const [printTitle, setPrintTitle] = useState('')

  const openPrintPreview = useCallback((title: string, content: React.ReactNode) => {
    setPrintTitle(title)
    setPrintContent(content)
    setIsPrintPreviewOpen(true)
  }, [])

  const closePrintPreview = useCallback(() => {
    setIsPrintPreviewOpen(false)
    setPrintContent(null)
    setPrintTitle('')
  }, [])

  const handlePrint = useCallback(() => {
    // Close preview before printing
    closePrintPreview()
    // Small delay to ensure modal is closed before print dialog
    setTimeout(() => {
      window.print()
    }, 300)
  }, [closePrintPreview])

  const quickPrint = useCallback(() => {
    window.print()
  }, [])

  return {
    isPrintPreviewOpen,
    printContent,
    printTitle,
    openPrintPreview,
    closePrintPreview,
    handlePrint,
    quickPrint
  }
}