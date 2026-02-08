import { useEffect, useState } from 'react'
import { useSalesProductsStore } from '../store/useSalesProductsStore'
import { useSalesInvoicesStore } from '../store/useSalesInvoicesStore'
import { Card } from './ui/Card'
import { Table } from './ui/Table'
import Search from 'lucide-react/dist/esm/icons/search'
import Package from 'lucide-react/dist/esm/icons/package'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import Plus from 'lucide-react/dist/esm/icons/plus'
import X from 'lucide-react/dist/esm/icons/x'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down'
import { toast } from 'react-toastify'
import { formatNumber } from '../utils/format'

type ActiveView = 'products' | 'invoices' | 'summary' | 'loss_analysis' | 'newInvoice'

interface InvoiceItem {
  product_id: number
  quantity: number
  price_per_kg: number
  total_weight: number
  total_amount: number
}

export default function Sales() {
  const { products, addProduct, deleteProduct, fetchProducts } = useSalesProductsStore()
  const {
    invoices,
    items,
    summary,
    fetchInvoices,
    fetchSummary,
    addInvoice,
    deleteInvoice,
    fetchItems
  } = useSalesInvoicesStore()

  const [activeView, setActiveView] = useState<ActiveView>('summary')
  const [searchTerm, setSearchTerm] = useState('')
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<InvoiceItem[]>([])
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false)

  const [newProduct, setNewProduct] = useState({
    name: '',
    unit_type: 'box',
    weight_per_unit: 0
  })

  const [newInvoice, setNewInvoice] = useState({
    date: new Date().toISOString().split('T')[0],
    buyer_name: '',
    buyer_phone: '',
    payment_method: 'نقدا',
    notes: ''
  })

  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    product_id: 0,
    quantity: 0,
    price_per_kg: 0,
    total_weight: 0,
    total_amount: 0
  })

  useEffect(() => {
    fetchProducts()
    fetchInvoices()
    fetchSummary()
  }, [])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProduct.name || newProduct.weight_per_unit <= 0) {
      toast.error('يرجى ملء جميع الحقول بشكل صحيح')
      return
    }

    const result = await addProduct(newProduct)
    if (result.success) {
      toast.success('تم إضافة المنتج بنجاح')
      setIsProductModalOpen(false)
      setNewProduct({ name: '', unit_type: 'box', weight_per_unit: 0 })
    } else {
      toast.error(result.message || 'حدث خطأ ما')
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      const result = await deleteProduct(id)
      if (result.success) {
        toast.success('تم حذف المنتج بنجاح')
      } else {
        toast.error(result.message || 'حدث خطأ ما')
      }
    }
  }

  const handleAddInvoiceItem = () => {
    if (!currentItem.product_id || currentItem.quantity <= 0 || currentItem.price_per_kg <= 0) {
      toast.error('يرجى ملء جميع الحقول')
      return
    }

    const product = products.find((p) => p.id === currentItem.product_id)
    if (!product) return

    const totalWeight = currentItem.quantity * product.weight_per_unit
    const totalAmount = totalWeight * currentItem.price_per_kg

    setSelectedInvoiceItems([
      ...selectedInvoiceItems,
      {
        ...currentItem,
        total_weight: totalWeight,
        total_amount: totalAmount
      }
    ])

    setCurrentItem({
      product_id: 0,
      quantity: 0,
      price_per_kg: 0,
      total_weight: 0,
      total_amount: 0
    })
  }

  const handleRemoveInvoiceItem = (index: number) => {
    setSelectedInvoiceItems(selectedInvoiceItems.filter((_, i) => i !== index))
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newInvoice.buyer_name) {
      toast.error('يرجى إدخال اسم المشتري')
      return
    }

    if (selectedInvoiceItems.length === 0) {
      toast.error('يرجى إضافة صنف واحد على الأقل')
      return
    }

    const totalWeight = selectedInvoiceItems.reduce((sum, item) => sum + item.total_weight, 0)
    const totalAmount = selectedInvoiceItems.reduce((sum, item) => sum + item.total_amount, 0)

    const result = await addInvoice({
      ...newInvoice,
      total_weight: totalWeight,
      total_amount: totalAmount,
      items: selectedInvoiceItems
    })

    if (result.success) {
      toast.success('تم إنشاء الفاتورة بنجاح')
      setIsInvoiceModalOpen(false)
      setNewInvoice({
        date: new Date().toISOString().split('T')[0],
        buyer_name: '',
        buyer_phone: '',
        payment_method: 'نقدا',
        notes: ''
      })
      setSelectedInvoiceItems([])
    } else {
      toast.error(result.message || 'حدث خطأ ما')
    }
  }

  const handleDeleteInvoice = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      const result = await deleteInvoice(id)
      if (result.success) {
        toast.success('تم حذف الفاتورة بنجاح')
      } else {
        toast.error(result.message || 'حدث خطأ ما')
      }
    }
  }

  const handleViewInvoice = async (invoiceId: number) => {
    await fetchItems(invoiceId)
    setShowInvoiceDetails(true)
  }

  const getUnitTypeName = (unitType: string) => {
    const types: Record<string, string> = {
      box: 'علبة',
      carton: 'كرتون',
      loose: 'فرط'
    }
    return types[unitType] || unitType
  }

  const filteredProducts = products.filter((p) => p.name.includes(searchTerm))
  const filteredInvoices = invoices.filter(
    (i) => i.buyer_name.includes(searchTerm) || i.date.includes(searchTerm)
  )

  const productColumns = [
    { header: 'الاسم', accessor: 'name' as const },
    {
      header: 'النوع',
      accessor: (p: any) => getUnitTypeName(p.unit_type)
    },
    {
      header: 'وزن الوحدة (كجم)',
      accessor: (p: any) => formatNumber(p.weight_per_unit)
    },
    {
      header: 'إجراءات',
      accessor: (p: any) => (
        <button
          onClick={() => handleDeleteProduct(p.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  const invoiceColumns = [
    { header: 'التاريخ', accessor: (i: any) => new Date(i.date).toLocaleDateString('ar-EG') },
    { header: 'المشتري', accessor: 'buyer_name' as const },
    {
      header: 'الوزن الكلي (كجم)',
      accessor: (i: any) => formatNumber(i.total_weight)
    },
    {
      header: 'المبلغ الكلي',
      accessor: (i: any) => formatNumber(i.total_amount)
    },
    { header: 'طريقة الدفع', accessor: 'payment_method' as const },
    {
      header: 'إجراءات',
      accessor: (i: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewInvoice(i.id)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="عرض التفاصيل"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => handleDeleteInvoice(i.id)}
            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
            title="حذف الفاتورة"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  const invoiceItemColumns = [
    { header: 'الصنف', accessor: 'product_name' as const },
    {
      header: 'النوع',
      accessor: (item: any) => getUnitTypeName(item.unit_type)
    },
    {
      header: 'الكمية',
      accessor: (item: any) => formatNumber(item.quantity)
    },
    {
      header: 'وزن الوحدة (كجم)',
      accessor: (item: any) => formatNumber(item.weight_per_unit)
    },
    {
      header: 'الوزن الكلي (كجم)',
      accessor: (item: any) => formatNumber(item.total_weight)
    },
    {
      header: 'سعر الكيلو',
      accessor: (item: any) => formatNumber(item.price_per_kg)
    },
    {
      header: 'الإجمالي',
      accessor: (item: any) => formatNumber(item.total_amount)
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة المبيعات</h2>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('summary')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              activeView === 'summary'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600'
                : 'text-slate-500'
            }`}
          >
            <Package size={18} />
            الملخص
          </button>
          <button
            onClick={() => setActiveView('loss_analysis')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              activeView === 'loss_analysis'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600'
                : 'text-slate-500'
            }`}
          >
            <TrendingDown size={18} />
            تحليل الفقد
          </button>
          <button
            onClick={() => setActiveView('invoices')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              activeView === 'invoices'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600'
                : 'text-slate-500'
            }`}
          >
            <FileText size={18} />
            الفواتير
          </button>
          <button
            onClick={() => setActiveView('products')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              activeView === 'products'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600'
                : 'text-slate-500'
            }`}
          >
            <Package size={18} />
            المنتجات
          </button>
        </div>
      </div>

      {activeView === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
            <div className="p-6">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                إجمالي الوارد (كجم)
              </p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatNumber(summary.total_incoming)}
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-200 dark:border-rose-800">
            <div className="p-6">
              <p className="text-sm text-rose-600 dark:text-rose-400 font-bold mb-2">
                إجمالي الصادر (كجم)
              </p>
              <p className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                {formatNumber(summary.total_outgoing)}
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="p-6">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-2">
                المخزون الحالي (كجم)
              </p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {formatNumber(summary.current_stock)}
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
            <div className="p-6">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-bold mb-2">
                إجمالي المبيعات
              </p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                {formatNumber(summary.total_sales)}
              </p>
            </div>
          </Card>
        </div>
      )}

      {activeView === 'loss_analysis' &&
        (() => {
          const getLossInfo = () => {
            const { total_incoming, total_outgoing, loss_percentage } = summary

            if (total_outgoing === 0) {
              return {
                title: 'لم يبدأ البيع بعد',
                description: 'لم يتم بيع أي كمية بعد، لا يمكن حساب نسبة الفقد',
                status: 'waiting',
                percentage: 0
              }
            }

            const salesRatio = (total_outgoing / total_incoming) * 100

            if (salesRatio < 5) {
              return {
                title: 'بيانات غير كافية',
                description: 'تم بيع أقل من 5% من الوارد، النسبة المحسوبة ليست دقيقة بعد',
                status: 'insufficient',
                percentage: loss_percentage
              }
            }

            if (loss_percentage < 0) {
              return {
                title: 'تحذير: تم بيع أكثر من المخزون',
                description: `تم بيع ${formatNumber(total_outgoing - total_incoming)} كجم أكثر من المخزون الموجود`,
                status: 'warning',
                percentage: loss_percentage
              }
            }

            if (loss_percentage < 10) {
              return {
                title: 'نسبة الفقد منخفضة',
                description: 'نسبة الفقد ضمن المعدل الطبيعي (< 10%)',
                status: 'good',
                percentage: loss_percentage
              }
            }

            if (loss_percentage < 20) {
              return {
                title: 'نسبة الفقد متوسطة',
                description: 'نسبة الفقد أعلى من المعدل الطبيعي، يُنصح بمراجعة ظروف التخزين',
                status: 'medium',
                percentage: loss_percentage
              }
            }

            return {
              title: 'نسبة الفقد مرتفعة',
              description: 'نسبة الفقد أعلى بكثير من المعدل الطبيعي، يجب فحص ظروف التخزين فوراً',
              status: 'high',
              percentage: loss_percentage
            }
          }

          const lossInfo = getLossInfo()

          const statusColors = {
            waiting: {
              bg: 'from-slate-50 to-slate-100',
              border: 'border-slate-200',
              text: 'text-slate-600',
              darkBg: 'dark:from-slate-900/20',
              darkBorder: 'dark:border-slate-800',
              darkText: 'dark:text-slate-400'
            },
            insufficient: {
              bg: 'from-amber-50 to-amber-100',
              border: 'border-amber-200',
              text: 'text-amber-600',
              darkBg: 'dark:from-amber-900/20',
              darkBorder: 'dark:border-amber-800',
              darkText: 'dark:text-amber-400'
            },
            warning: {
              bg: 'from-red-50 to-red-100',
              border: 'border-red-200',
              text: 'text-red-600',
              darkBg: 'dark:from-red-900/20',
              darkBorder: 'dark:border-red-800',
              darkText: 'dark:text-red-400'
            },
            good: {
              bg: 'from-emerald-50 to-emerald-100',
              border: 'border-emerald-200',
              text: 'text-emerald-600',
              darkBg: 'dark:from-emerald-900/20',
              darkBorder: 'dark:border-emerald-800',
              darkText: 'dark:text-emerald-400'
            },
            medium: {
              bg: 'from-orange-50 to-orange-100',
              border: 'border-orange-200',
              text: 'text-orange-600',
              darkBg: 'dark:from-orange-900/20',
              darkBorder: 'dark:border-orange-800',
              darkText: 'dark:text-orange-400'
            },
            high: {
              bg: 'from-rose-50 to-rose-100',
              border: 'border-rose-200',
              text: 'text-rose-600',
              darkBg: 'dark:from-rose-900/20',
              darkBorder: 'dark:border-rose-800',
              darkText: 'dark:text-rose-400'
            }
          }

          const colors = statusColors[lossInfo.status as keyof typeof statusColors]

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className={`bg-gradient-to-br ${colors.bg} ${colors.darkBg} ${colors.border} ${colors.darkBorder}`}
                >
                  <div className="p-6">
                    <p className={`text-sm ${colors.text} ${colors.darkText} font-bold mb-2`}>
                      {lossInfo.title}
                    </p>
                    <p className={`text-3xl font-bold ${colors.text} ${colors.darkText}`}>
                      {formatNumber(lossInfo.percentage, 1)}%
                    </p>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                  <div className="p-6">
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-bold mb-2">
                      الفقد المطلق (كجم)
                    </p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                      {formatNumber(summary.current_stock)}
                    </p>
                    <p className="text-sm text-purple-500 dark:text-purple-400 mt-2">
                      الوارد - الصادر
                    </p>
                  </div>
                </Card>
              </div>

              <Card
                className={`${colors.bg} ${colors.darkBg} ${colors.border} ${colors.darkBorder}`}
              >
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">
                    تفاصيل الحالة
                  </h3>
                  <p className={`text-lg ${colors.text} ${colors.darkText}`}>
                    {lossInfo.description}
                  </p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mb-1">
                        إجمالي الوارد
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {formatNumber(summary.total_incoming)} كجم
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mb-1">
                        إجمالي الصادر
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {formatNumber(summary.total_outgoing)} كجم
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mb-1">
                        نسبة المبيعات
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {summary.total_incoming > 0
                          ? formatNumber((summary.total_outgoing / summary.total_incoming) * 100, 1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )
        })()}

      {activeView === 'products' && (
        <Card>
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="بحث عن منتج..."
                className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold"
            >
              <Plus size={20} />
              إضافة منتج
            </button>
          </div>
          <Table columns={productColumns} data={filteredProducts} />
        </Card>
      )}

      {activeView === 'invoices' && (
        <Card>
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="بحث عن فاتورة..."
                className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold"
            >
              <Plus size={20} />
              إنشاء فاتورة
            </button>
          </div>
          <Table columns={invoiceColumns} data={filteredInvoices} />
        </Card>
      )}

      {showInvoiceDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">تفاصيل الفاتورة</h3>
              <button
                onClick={() => setShowInvoiceDetails(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <Table columns={invoiceItemColumns} data={items} />
          </Card>
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">إضافة منتج جديد</h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">نوع الوحدة</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                  value={newProduct.unit_type}
                  onChange={(e) => setNewProduct({ ...newProduct, unit_type: e.target.value })}
                >
                  <option value="box">علبة</option>
                  <option value="carton">كرتون</option>
                  <option value="loose">فرط</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">
                  وزن الوحدة (كجم)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                  value={newProduct.weight_per_unit}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      weight_per_unit: parseFloat(e.target.value) || 0
                    })
                  }
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                حفظ المنتج
              </button>
            </form>
          </Card>
        </div>
      )}

      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">إنشاء فاتورة جديدة</h3>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">التاريخ</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                    value={newInvoice.date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">اسم المشتري</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                    value={newInvoice.buyer_name}
                    onChange={(e) => setNewInvoice({ ...newInvoice, buyer_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                    value={newInvoice.buyer_phone}
                    onChange={(e) => setNewInvoice({ ...newInvoice, buyer_phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">طريقة الدفع</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                    value={newInvoice.payment_method}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, payment_method: e.target.value })
                    }
                  >
                    <option value="نقدا">نقداً</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="text-lg font-bold mb-4">إضافة أصناف</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">المنتج</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                      value={currentItem.product_id}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, product_id: parseInt(e.target.value) })
                      }
                    >
                      <option value="">اختر المنتج</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({getUnitTypeName(p.unit_type)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">الكمية</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      سعر الكيلو
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                      value={currentItem.price_per_kg}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          price_per_kg: parseFloat(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">&nbsp;</label>
                    <button
                      type="button"
                      onClick={handleAddInvoiceItem}
                      className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      إضافة للفاتورة
                    </button>
                  </div>
                </div>

                {selectedInvoiceItems.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-right pb-2">الصنف</th>
                          <th className="text-right pb-2">الكمية</th>
                          <th className="text-right pb-2">الوزن الكلي (كجم)</th>
                          <th className="text-right pb-2">الإجمالي</th>
                          <th className="text-right pb-2">حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoiceItems.map((item, index) => {
                          const product = products.find((p) => p.id === item.product_id)
                          return (
                            <tr
                              key={index}
                              className="border-b border-slate-100 dark:border-slate-700"
                            >
                              <td className="py-2">{product?.name || ''}</td>
                              <td className="py-2">{formatNumber(item.quantity)}</td>
                              <td className="py-2">{formatNumber(item.total_weight)}</td>
                              <td className="py-2">{formatNumber(item.total_amount)}</td>
                              <td className="py-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInvoiceItem(index)}
                                  className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        <tr className="font-bold bg-emerald-50 dark:bg-emerald-900/20">
                          <td className="py-2" colSpan={2}>
                            الإجمالي الكلي:
                          </td>
                          <td className="py-2">
                            {formatNumber(
                              selectedInvoiceItems.reduce((sum, item) => sum + item.total_weight, 0)
                            )}
                          </td>
                          <td className="py-2 text-emerald-600">
                            {formatNumber(
                              selectedInvoiceItems.reduce((sum, item) => sum + item.total_amount, 0)
                            )}
                          </td>
                          <td className="py-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">ملاحظات</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 h-20"
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={selectedInvoiceItems.length === 0}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                حفظ الفاتورة
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
