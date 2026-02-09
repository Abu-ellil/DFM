import { Card } from '../../ui/Card'
import Key from 'lucide-react/dist/esm/icons/key'
import Info from 'lucide-react/dist/esm/icons/info'

interface LicenseSettingsProps {
  licenseInfo: any
  licenseKey: string
  setLicenseKey: (key: string) => void
  factoryName: string
  setFactoryName: (name: string) => void
  onActivate: () => Promise<void>
}

export function LicenseSettings({
  licenseInfo,
  licenseKey,
  setLicenseKey,
  factoryName: _factoryName,
  setFactoryName: _setFactoryName,
  onActivate
}: LicenseSettingsProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-emerald-600">
        <Key size={20} />
        <h3 className="font-bold">ترخيص البرنامج</h3>
      </div>

      <div className="space-y-4">
        {licenseInfo && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">حالة التفعيل:</span>
              <span
                className={`font-bold ${licenseInfo.activated ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {licenseInfo.activated ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
            {licenseInfo.factoryName && (
              <div className="flex justify-between">
                <span className="text-slate-500">اسم المصنع:</span>
                <span className="font-bold">{licenseInfo.factoryName}</span>
              </div>
            )}
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-500 shrink-0">معرف الجهاز:</span>
              <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-[10px] break-all select-all">
                {licenseInfo.machineId}
              </code>
            </div>
          </div>
        )}

        {!licenseInfo?.activated && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                مفتاح الترخيص
              </label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
              />
            </div>
            <button
              onClick={onActivate}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
            >
              تفعيل البرنامج الآن
            </button>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          <Info size={14} className="shrink-0 text-blue-500" />
          <p>
            لتفعيل البرنامج، يرجى تزويد الدعم الفني بمعرف الجهاز الخاص بك للحصول على مفتاح
            التفعيل.
          </p>
        </div>
      </div>
    </Card>
  )
}
