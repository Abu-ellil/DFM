import { Card } from '../../ui/Card'
import Plus from 'lucide-react/dist/esm/icons/plus'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'

interface DataTypesSettingsProps {
  dateTypes: any[]
  crateTypes: any[]
  supervisors: any[]
  newName: {
    dateType: string
    crateType: string
    crateWeight: string
    supervisor: string
  }
  setNewName: (data: any) => void
  onAddDateType: () => Promise<void>
  onDeleteDateType: (id: number) => Promise<void>
  onAddCrateType: () => Promise<void>
  onDeleteCrateType: (id: number) => Promise<void>
  onAddSupervisor: () => Promise<void>
  onDeleteSupervisor: (id: number) => Promise<void>
}

export function DataTypesSettings({
  dateTypes,
  crateTypes,
  supervisors,
  newName,
  setNewName,
  onAddDateType,
  onDeleteDateType,
  onAddCrateType,
  onDeleteCrateType,
  onAddSupervisor,
  onDeleteSupervisor
}: DataTypesSettingsProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-amber-600">
        <Plus size={20} />
        <h3 className="font-bold">إدارة أنواع البيانات</h3>
      </div>

      <div className="space-y-6">
        {/* Date Types */}
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">أنواع التمور</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="نوع جديد..."
              className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              value={newName.dateType}
              onChange={(e) => setNewName({ ...newName, dateType: e.target.value })}
            />
            <button
              onClick={onAddDateType}
              className="bg-amber-600 text-white p-1.5 rounded-lg hover:bg-amber-700 transition-colors shrink-0"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {dateTypes.map((type) => (
              <span
                key={type.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md text-xs font-bold border border-amber-100 dark:border-amber-800"
              >
                {type.name}
                <button onClick={() => onDeleteDateType(type.id)} className="hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Crate Types */}
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">أنواع الصناديق</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <input
              type="text"
              placeholder="اسم الصندوق..."
              className="w-full min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              value={newName.crateType}
              onChange={(e) => setNewName({ ...newName, crateType: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="الوزن..."
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                value={newName.crateWeight}
                onChange={(e) => setNewName({ ...newName, crateWeight: e.target.value })}
              />
              <button
                onClick={onAddCrateType}
                className="bg-amber-600 text-white p-1.5 rounded-lg hover:bg-amber-700 transition-colors shrink-0"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {crateTypes.map((type) => (
              <span
                key={type.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700"
              >
                {type.name} ({type.weight}كجم)
                <button onClick={() => onDeleteCrateType(type.id)} className="hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Supervisors */}
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">المشرفين</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="اسم المشرف..."
              className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              value={newName.supervisor}
              onChange={(e) => setNewName({ ...newName, supervisor: e.target.value })}
            />
            <button
              onClick={onAddSupervisor}
              className="bg-amber-600 text-white p-1.5 rounded-lg hover:bg-amber-700 transition-colors shrink-0"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {supervisors.map((sv) => (
              <span
                key={sv.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-bold border border-emerald-100 dark:border-emerald-800"
              >
                {sv.name}
                <button onClick={() => onDeleteSupervisor(sv.id)} className="hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
