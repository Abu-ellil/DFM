import { Card } from '../../ui/Card'
import SettingsIcon from 'lucide-react/dist/esm/icons/settings'
import Save from 'lucide-react/dist/esm/icons/save'
import Upload from 'lucide-react/dist/esm/icons/upload'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'

interface GeneralSettingsProps {
  formData: any
  setFormData: (data: any) => void
  onSave: (key: string, value: string) => Promise<void>
}

export function GeneralSettings({ formData, setFormData, onSave }: GeneralSettingsProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-emerald-600">
        <SettingsIcon size={20} />
        <h3 className="font-bold">الإعدادات العامة</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
            اسم الشركة / المصنع
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
            <button
              onClick={() => onSave('company_name', formData.company_name)}
              className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors shrink-0"
              title="حفظ"
            >
              <Save size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
              العنوان
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.company_address}
                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
              />
              <button
                onClick={() => onSave('company_address', formData.company_address)}
                className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors shrink-0"
                title="حفظ"
              >
                <Save size={20} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
              رقم الهاتف
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.company_phone}
                onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
              />
              <button
                onClick={() => onSave('company_phone', formData.company_phone)}
                className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors shrink-0"
                title="حفظ"
              >
                <Save size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
              وزن الصندوق الافتراضي (كجم)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.crate_weight}
                onChange={(e) => setFormData({ ...formData, crate_weight: e.target.value })}
              />
              <button
                onClick={() => onSave('crate_weight', formData.crate_weight)}
                className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors shrink-0"
                title="حفظ"
              >
                <Save size={20} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
              وزن القنطار (كجم)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.qantar_weight}
                onChange={(e) => setFormData({ ...formData, qantar_weight: e.target.value })}
              />
              <button
                onClick={() => onSave('qantar_weight', formData.qantar_weight)}
                className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors shrink-0"
                title="حفظ"
              >
                <Save size={20} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
            شعار المصنع
          </label>
          <div className="flex items-center gap-4">
            {formData.company_logo && (
              <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-white flex items-center justify-center">
                <img
                  src={formData.company_logo}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  onClick={() => onSave('company_logo', '')}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600 transition-colors shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <div className="flex-1">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-bold">انقر لرفع شعار المصنع</p>
                  <p className="text-[10px] text-slate-400 mt-1">يفضل أن يكون بخلفية شفافة</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        const base64String = reader.result as string
                        onSave('company_logo', base64String)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
