import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Card } from './ui/Card'
import { Search, Plus, Pencil, Trash2, DollarSign, Package } from 'lucide-react'

interface Supplier {
  id: number
  name: string
  type: string
  phone: string
  commission_rate: number
  crates_on_hand: number
  balance: number
  is_active: boolean
  notes: string
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    type: 'مورد',
    phone: '',
    commission_rate: 0,
    crates_on_hand: 0,
    balance: 0,
    is_active: true,
    notes: ''
  })

  const fetchSuppliers = async () => {
    setIsLoading(true)
    try {
      const result = await window.api.suppliers?.getAll()
      setSuppliers(result || [])
    } catch (error) {
      toast.error('فشل في تحميل الموردين')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSupplier.name) {
      toast.error('يرجى إدخال اسم المورد')
      return
    }

    try {
      const result = await window.api.suppliers?.create(newSupplier)
      if (result.success) {
        toast.success('تم إضافة المورد بنجاح')
        setIsModalOpen(false)
        setNewSupplier({
          name: '',
          type: 'مورد',
          phone: '',
          commission_rate: 0,
          crates_on_hand: 0,
          balance: 0,
          is_active: true,
          notes: ''
        })
        fetchSuppliers()
      } else {
        toast.error(result.message || 'حدث خطأ ما')
      }
    } catch (error) {
      toast.error('فشل في إضافة المورد')
    }
  }

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSupplier || !editingSupplier.name) {
      toast.error('يرجى إدخال اسم المورد')
      return
    }

    try {
      const result = await window.api.suppliers?.update(editingSupplier.id, editingSupplier)
      if (result.success) {
        toast.success('تم تعديل المورد بنجاح')
        setIsEditModalOpen(false)
        setEditingSupplier(null)
        fetchSuppliers()
      } else {
        toast.error(result.message || 'حدث خطأ ما')
      }
    } catch (error) {
      toast.error('فشل في تعديل المورد')
    }
  }

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      return
    }

    try {
      const result = await window.api.suppliers?.delete(id)
      if (result.success) {
        toast.success('تم حذف المورد بنجاح')
        fetchSuppliers()
      } else {
        toast.error(result.message || 'حدث خطأ ما')
      }
    } catch (error) {
      toast.error('فشل في حذف المورد')
    }
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsEditModalOpen(true)
  }

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.includes(searchTerm) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      s.type.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الموردين</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">إدارة موردين المصنع</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>إضافة مورد</span>
          </button>
        </div>

        <div className="mt-6 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="بحث باسم المورد أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">لا يوجد موردين</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">الاسم</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">النوع</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">الهاتف</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">العمولة %</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">الصناديق</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">الرصيد</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">الحالة</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{supplier.name}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{supplier.type}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{supplier.phone || '-'}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{supplier.commission_rate}%</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{supplier.crates_on_hand}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 ${supplier.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      <DollarSign size={16} />
                      {Math.abs(supplier.balance).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${supplier.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {supplier.is_active ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">إضافة مورد جديد</h3>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المورد *</label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">النوع</label>
                <select
                  value={newSupplier.type}
                  onChange={(e) => setNewSupplier({ ...newSupplier, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="مورد">مورد</option>
                  <option value="مزارع">مزارع</option>
                  <option value="وسيط">وسيط</option>
                  <option value="شركة">شركة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف</label>
                <input
                  type="tel"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العمولة %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSupplier.commission_rate}
                    onChange={(e) => setNewSupplier({ ...newSupplier, commission_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصناديق</label>
                  <input
                    type="number"
                    value={newSupplier.crates_on_hand}
                    onChange={(e) => setNewSupplier({ ...newSupplier, crates_on_hand: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSupplier.is_active}
                    onChange={(e) => setNewSupplier({ ...newSupplier, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">نشط</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                <textarea
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">تعديل المورد</h3>
            </div>
            <form onSubmit={handleEditSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المورد *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">النوع</label>
                <select
                  value={editingSupplier.type}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="مورد">مورد</option>
                  <option value="مزارع">مزارع</option>
                  <option value="وسيط">وسيط</option>
                  <option value="شركة">شركة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف</label>
                <input
                  type="tel"
                  value={editingSupplier.phone}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العمولة %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSupplier.commission_rate}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, commission_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصناديق</label>
                  <input
                    type="number"
                    value={editingSupplier.crates_on_hand}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, crates_on_hand: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرصيد</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingSupplier.balance}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingSupplier.is_active}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">نشط</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                <textarea
                  value={editingSupplier.notes || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingSupplier(null)
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
