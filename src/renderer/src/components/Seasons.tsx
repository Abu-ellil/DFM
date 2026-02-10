import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Card } from './ui/Card'
import Plus from 'lucide-react/dist/esm/icons/plus'
import Edit from 'lucide-react/dist/esm/icons/edit'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import Check from 'lucide-react/dist/esm/icons/check'

interface Season {
  id: number
  name: string
  start_date: string
  end_date: string
  is_active: number
  notes?: string
}

export default function Seasons() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    notes: '',
    is_active: false
  })

  const fetchSeasons = async () => {
    try {
      const result = await window.api.seasons?.getAll()
      if (result) {
        setSeasons(result)
      }
    } catch (error) {
      console.error('Failed to fetch seasons:', error)
      toast.error('فشل تحميل المواسم')
    }
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  const handleCreate = async () => {
    try {
      const result = await window.api.seasons?.create(formData)
      if (result?.success) {
        toast.success('تم إضافة الموسم بنجاح')
        setIsModalOpen(false)
        setFormData({
          name: '',
          start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          notes: '',
          is_active: false
        })
        fetchSeasons()
      } else {
        toast.error(result?.message || 'فشل إضافة الموسم')
      }
    } catch (error) {
      console.error('Create season error:', error)
      toast.error('حدث خطأ أثناء إضافة الموسم')
    }
  }

  const handleUpdate = async () => {
    if (!editingSeason) return

    try {
      const result = await window.api.seasons?.update(editingSeason.id, formData)
      if (result?.success) {
        toast.success('تم تحديث الموسم بنجاح')
        setIsModalOpen(false)
        setEditingSeason(null)
        setFormData({
          name: '',
          start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          notes: '',
          is_active: false
        })
        fetchSeasons()
      } else {
        toast.error(result?.message || 'فشل تحديث الموسم')
      }
    } catch (error) {
      console.error('Update season error:', error)
      toast.error('حدث خطأ أثناء تحديث الموسم')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموسم؟')) return

    try {
      const result = await window.api.seasons?.delete(id)
      if (result?.success) {
        toast.success('تم حذف الموسم بنجاح')
        fetchSeasons()
      } else {
        toast.error(result?.message || 'فشل حذف الموسم')
      }
    } catch (error) {
      console.error('Delete season error:', error)
      toast.error('حدث خطأ أثناء حذف الموسم')
    }
  }

  const handleSetActive = async (id: number) => {
    try {
      const result = await window.api.seasons?.setActive(id)
      if (result?.success) {
        toast.success('تم تفعيل الموسم بنجاح')
        fetchSeasons()
      } else {
        toast.error(result?.message || 'فشل تفعيل الموسم')
      }
    } catch (error) {
      console.error('Set active season error:', error)
      toast.error('حدث خطأ أثناء تفعيل الموسم')
    }
  }

  const openCreateModal = () => {
    setEditingSeason(null)
    setFormData({
      name: '',
      start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      notes: '',
      is_active: false
    })
    setIsModalOpen(true)
  }

  const openEditModal = (season: Season) => {
    setEditingSeason(season)
    setFormData({
      name: season.name,
      start_date: season.start_date,
      end_date: season.end_date,
      notes: season.notes || '',
      is_active: season.is_active === 1
    })
    setIsModalOpen(true)
  }

  const handleSubmit = () => {
    if (editingSeason) {
      handleUpdate()
    } else {
      handleCreate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة المواسم</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-bold"
        >
          <Plus size={20} />
          إضافة موسم جديد
        </button>
      </div>

      {seasons.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500 text-lg">لا توجد مواسم حالياً</p>
          <p className="text-slate-400 mt-2">اضغط على "إضافة موسم جديد" للبدء</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasons.map((season) => (
            <Card
              key={season.id}
              className={`relative ${season.is_active === 1 ? 'border-emerald-500 border-2' : ''}`}
            >
              {season.is_active === 1 && (
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Check size={12} />
                  مفعل
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {season.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    من {new Date(season.start_date).toLocaleDateString('ar-EG')} إلى{' '}
                    {new Date(season.end_date).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                {season.notes && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    {season.notes}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  {season.is_active !== 1 && (
                    <button
                      onClick={() => handleSetActive(season.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold"
                    >
                      <Check size={16} />
                      تفعيل
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(season)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
                  >
                    <Edit size={16} />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(season.id)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-bold"
                  >
                    <Trash2 size={16} />
                    حذف
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
              {editingSeason ? 'تعديل الموسم' : 'إضافة موسم جديد'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2">اسم الموسم</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: موسم 2024"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">تاريخ البدء</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2">ملاحظات</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-500">
                  تفعيل الموسم تلقائياً
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.start_date || !formData.end_date}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingSeason ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
