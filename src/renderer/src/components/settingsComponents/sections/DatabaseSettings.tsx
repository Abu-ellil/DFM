import { Card } from '../../ui/Card'
import Database from 'lucide-react/dist/esm/icons/database'
import Upload from 'lucide-react/dist/esm/icons/upload'
import FileSpreadsheet from 'lucide-react/dist/esm/icons/file-spreadsheet'

interface DatabaseSettingsProps {
  isProcessing: boolean
  onSync: () => Promise<void>
  onImportDb: () => Promise<void>
  onImportExcel: () => Promise<void>
}

export function DatabaseSettings({
  isProcessing,
  onSync,
  onImportDb,
  onImportExcel
}: DatabaseSettingsProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-purple-600">
        <Database size={20} />
        <h3 className="font-bold">قاعدة البيانات والمزامنة</h3>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-4">
        <p className="text-sm text-slate-500 text-center">
          إدارة البيانات: استيراد، تصدير، ونسخ احتياطي
        </p>

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={onSync}
            disabled={isProcessing}
            className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Database size={18} />
            {isProcessing ? 'جاري المعالجة...' : 'تصدير نسخة احتياطية (.sqlite)'}
          </button>

          <button
            onClick={onImportDb}
            disabled={isProcessing}
            className="w-full bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload size={18} />
            {isProcessing ? 'جاري المعالجة...' : 'استيراد قاعدة بيانات (.sqlite)'}
          </button>

          <button
            onClick={onImportExcel}
            disabled={isProcessing}
            className="w-full bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
            {isProcessing ? 'جاري المعالجة...' : 'استيراد عملاء من Excel'}
          </button>
        </div>
      </div>
    </Card>
  )
}
