import React, { useState } from 'react'
import { Card } from '../ui/Card'
import X from 'lucide-react/dist/esm/icons/x'
import Printer from 'lucide-react/dist/esm/icons/printer'
import Eye from 'lucide-react/dist/esm/icons/eye'
import ZoomIn from 'lucide-react/dist/esm/icons/zoom-in'
import ZoomOut from 'lucide-react/dist/esm/icons/zoom-out'

interface PrintPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: React.ReactNode
  onPrint: () => void
}

interface PrintSettings {
  fontSize: 'small' | 'normal' | 'large'
  showSignatures: boolean
  showLogo: boolean
  orientation: 'portrait' | 'landscape'
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  onPrint
}) => {
  const [settings, setSettings] = useState<PrintSettings>({
    fontSize: 'normal',
    showSignatures: true,
    showLogo: true,
    orientation: 'portrait'
  })
  const [zoom, setZoom] = useState(100)

  const fontSizeClasses = {
    small: 'text-xs',
    normal: 'text-base',
    large: 'text-lg'
  }

  const handlePrint = () => {
    // Apply settings to document before printing
    const style = document.createElement('style')
    style.id = 'print-temp-settings'
    style.textContent = `
      @page {
        size: ${settings.orientation === 'landscape' ? 'landscape' : 'portrait'};
      }
      body {
        font-size: ${settings.fontSize === 'small' ? '10pt' : settings.fontSize === 'large' ? '14pt' : '12pt'} !important;
      }
    `
    document.head.appendChild(style)
    
    onPrint()
    
    // Remove temporary styles after print dialog closes
    setTimeout(() => {
      const tempStyle = document.getElementById('print-temp-settings')
      if (tempStyle) tempStyle.remove()
    }, 1000)
  }

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(50, Math.min(200, prev + delta)))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-7xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Eye className="text-emerald-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              معاينة الطباعة: {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Settings Bar */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300">
              حجم الخط:
            </label>
            <select
              value={settings.fontSize}
              onChange={(e) =>
                setSettings({ ...settings, fontSize: e.target.value as PrintSettings['fontSize'] })
              }
              className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-bold"
            >
              <option value="small">صغير</option>
              <option value="normal">عادي</option>
              <option value="large">كبير</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300">
              اتجاه الورق:
            </label>
            <select
              value={settings.orientation}
              onChange={(e) =>
                setSettings({ ...settings, orientation: e.target.value as PrintSettings['orientation'] })
              }
              className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-bold"
            >
              <option value="portrait">طولي</option>
              <option value="landscape">عرضي</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showSignatures"
              checked={settings.showSignatures}
              onChange={(e) => setSettings({ ...settings, showSignatures: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="showSignatures" className="text-sm font-bold text-slate-600 dark:text-slate-300">
              إظهار التوقيعات
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showLogo"
              checked={settings.showLogo}
              onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="showLogo" className="text-sm font-bold text-slate-600 dark:text-slate-300">
              إظهار الشعار
            </label>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => handleZoom(-10)}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="تصغير"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 min-w-[50px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => handleZoom(10)}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="تكبير"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 p-8">
          <div
            className={`mx-auto bg-white shadow-2xl transition-all duration-200 ${
              settings.orientation === 'landscape' ? 'w-[90vh] h-[70vh]' : 'w-[70vh] h-[90vh]'
            }`}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center'
            }}
          >
            <div
              className={`p-8 ${fontSizeClasses[settings.fontSize]} ${
                !settings.showSignatures ? 'pb-8' : ''
              }`}
            >
              {/* Apply settings filters */}
              <div className={`${!settings.showLogo ? 'print-logo-hidden' : ''}`}>
                {React.cloneElement(content as React.ReactElement, {
                  'data-show-signatures': settings.showSignatures
                } as any)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Printer size={20} />
            طباعة
          </button>
        </div>
      </Card>

      {/* Add style for hiding logo */}
      <style>{`
        .print-logo-hidden img[alt="Logo"],
        .print-logo-hidden [src*="logo"] {
          display: none !important;
        }
      `}</style>
    </div>
  )
}