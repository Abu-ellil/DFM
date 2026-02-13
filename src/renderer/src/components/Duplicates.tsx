import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Card } from './ui/Card'
import { Table } from './ui/Table'
import Copy from 'lucide-react/dist/esm/icons/copy'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw'
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle'
import Scale from 'lucide-react/dist/esm/icons/scale'
import Wallet from 'lucide-react/dist/esm/icons/wallet'
import Package from 'lucide-react/dist/esm/icons/package'
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart'
import Users from 'lucide-react/dist/esm/icons/users'
import UserCheck from 'lucide-react/dist/esm/icons/user-check'
import Calendar from 'lucide-react/dist/esm/icons/calendar'
import Tag from 'lucide-react/dist/esm/icons/tag'
import Send from 'lucide-react/dist/esm/icons/send'
import { formatCurrency, formatNumber } from '../utils/format'
import { useAppStore } from '../store/useAppStore'

type DuplicateData = {
  weighbridge: any[]
  crates: any[]
  finance: any[]
  sales_invoices: any[]
  sales_items: any[]
  sales_products: any[]
  customers: any[]
  date_types: any[]
  crate_types: any[]
  daily_prices: any[]
  supervisors: any[]
  seasons: any[]
  users: any[]
  user_roles: any[]
  telegram_users: any[]
  telegram_registrations: any[]
  summary: {
    total: number
    byTable: {
      weighbridge: number
      crates: number
      finance: number
      sales_invoices: number
      sales_items: number
      sales_products: number
      customers: number
      date_types: number
      crate_types: number
      daily_prices: number
      supervisors: number
      seasons: number
      users: number
      user_roles: number
      telegram_users: number
      telegram_registrations: number
    }
  }
}

type TableTab =
  | 'weighbridge'
  | 'crates'
  | 'finance'
  | 'sales_invoices'
  | 'sales_items'
  | 'sales_products'
  | 'customers'
  | 'date_types'
  | 'crate_types'
  | 'daily_prices'
  | 'supervisors'
  | 'seasons'
  | 'users'
  | 'user_roles'
  | 'telegram_users'
  | 'telegram_registrations'

const tableConfig: Record<TableTab, { label: string; icon: any; color: string }> = {
  weighbridge: { label: 'الميزان المكرر', icon: <Scale size={20} />, color: 'blue' },
  crates: { label: 'الصناديق المكررة', icon: <Package size={20} />, color: 'orange' },
  finance: { label: 'المالية المكررة', icon: <Wallet size={20} />, color: 'emerald' },
  sales_invoices: { label: 'فواتير المبيعات', icon: <ShoppingCart size={20} />, color: 'purple' },
  sales_items: { label: 'عناصر الفواتير', icon: <Package size={20} />, color: 'indigo' },
  sales_products: { label: 'منتجات المبيعات', icon: <Tag size={20} />, color: 'pink' },
  customers: { label: 'العملاء المكررين', icon: <Users size={20} />, color: 'cyan' },
  date_types: { label: 'أنواع التمور', icon: <Tag size={20} />, color: 'teal' },
  crate_types: { label: 'أنواع الصناديق', icon: <Package size={20} />, color: 'amber' },
  daily_prices: { label: 'الأسعار اليومية', icon: <Wallet size={20} />, color: 'lime' },
  supervisors: { label: 'المشرفين المكررين', icon: <UserCheck size={20} />, color: 'rose' },
  seasons: { label: 'المواسم المكررة', icon: <Calendar size={20} />, color: 'violet' },
  users: { label: 'المستخدمين المكررين', icon: <Users size={20} />, color: 'fuchsia' },
  user_roles: { label: 'أدوار المستخدمين', icon: <UserCheck size={20} />, color: 'sky' },
  telegram_users: { label: 'مستخدمي تيليجرام', icon: <Send size={20} />, color: 'blue-500' },
  telegram_registrations: {
    label: 'تسجيلات تيليجرام',
    icon: <Send size={20} />,
    color: 'indigo-500'
  }
}

export default function Duplicates() {
  const [data, setData] = useState<DuplicateData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TableTab>('weighbridge')
  const { navigateToCustomer } = useAppStore()

  const fetchDuplicates = async () => {
    setIsLoading(true)
    try {
      const result = await window.api.duplicates.getAll()
      setData(result)
    } catch (error) {
      console.error('Error fetching duplicates:', error)
      toast.error('حدث خطأ أثناء تحميل البيانات المكررة')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDuplicates()
  }, [])

  const handleDelete = async (table: string, id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return

    try {
      const result = await window.api.duplicates.delete({ table, id })
      if (result.success) {
        toast.success('تم حذف السجل بنجاح')
        fetchDuplicates()
      } else {
        toast.error(result.message || 'فشل حذف السجل')
      }
    } catch (error) {
      console.error('Error deleting duplicate:', error)
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  const handleAutoClean = async () => {
    if (
      !confirm(
        'سيتم حذف جميع السجلات المكررة والإبقاء على نسخة واحدة فقط من كل عملية. هل تريد الاستمرار؟'
      )
    )
      return

    try {
      const result = await window.api.duplicates.autoClean()
      if (result.success) {
        toast.success(`تم تنظيف ${result.count} سجل مكرر بنجاح`)
        fetchDuplicates()
      } else {
        toast.error(result.message || 'فشل تنظيف البيانات')
      }
    } catch (error) {
      console.error('Error auto-cleaning duplicates:', error)
      toast.error('حدث خطأ أثناء التنظيف')
    }
  }

  // Weighbridge columns
  const weighbridgeColumns = [
    { header: 'التاريخ', accessor: (t: any) => new Date(t.date).toLocaleDateString('ar-EG') },
    {
      header: 'العميل',
      accessor: (t: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigateToCustomer(t.customer_id)
          }}
          className="text-emerald-600 hover:underline font-medium text-right"
        >
          {t.customer_name}
        </button>
      )
    },
    { header: 'الوزن القائم', accessor: 'gross_weight' as const },
    {
      header: 'الوزن الصافي',
      accessor: (t: any) => formatNumber(t.net_weight),
      className: 'font-bold text-emerald-600'
    },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('weighbridge', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Crates columns
  const cratesColumns = [
    { header: 'التاريخ', accessor: (t: any) => new Date(t.date).toLocaleDateString('ar-EG') },
    {
      header: 'العميل',
      accessor: (t: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigateToCustomer(t.customer_id)
          }}
          className="text-emerald-600 hover:underline font-medium text-right"
        >
          {t.customer_name}
        </button>
      )
    },
    { header: 'خارج', accessor: 'crates_out' as const, className: 'text-red-500 font-bold' },
    {
      header: 'عائد',
      accessor: 'crates_returned' as const,
      className: 'text-emerald-500 font-bold'
    },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('crates', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Finance columns
  const financeColumns = [
    { header: 'التاريخ', accessor: (t: any) => new Date(t.date).toLocaleDateString('ar-EG') },
    {
      header: 'العميل',
      accessor: (t: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigateToCustomer(t.customer_id)
          }}
          className="text-emerald-600 hover:underline font-medium text-right"
        >
          {t.customer_name}
        </button>
      )
    },
    { header: 'النوع', accessor: 'transaction_type' as const },
    {
      header: 'مقبوض',
      accessor: (t: any) => (t.amount_paid > 0 ? formatCurrency(t.amount_paid) : '-')
    },
    {
      header: 'مدفوع',
      accessor: (t: any) => (t.amount_received > 0 ? formatCurrency(t.amount_received) : '-')
    },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('finance', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Sales Invoices columns
  const salesInvoicesColumns = [
    { header: 'التاريخ', accessor: (t: any) => new Date(t.date).toLocaleDateString('ar-EG') },
    { header: 'المشتري', accessor: 'buyer_name' as const },
    { header: 'رقم الهاتف', accessor: 'buyer_phone' as const },
    { header: 'الوزن الكلي', accessor: (t: any) => formatNumber(t.total_weight) },
    { header: 'المبلغ الكلي', accessor: (t: any) => formatCurrency(t.total_amount) },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('sales_invoices', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Sales Items columns
  const salesItemsColumns = [
    {
      header: 'التاريخ',
      accessor: (t: any) => new Date(t.invoice_date).toLocaleDateString('ar-EG')
    },
    { header: 'المشتري', accessor: 'buyer_name' as const },
    { header: 'المنتج', accessor: 'product_name' as const },
    { header: 'الكمية', accessor: 'quantity' as const },
    { header: 'السعر/كجم', accessor: (t: any) => formatCurrency(t.price_per_kg) },
    { header: 'الوزن الكلي', accessor: (t: any) => formatNumber(t.total_weight) },
    { header: 'المبلغ الكلي', accessor: (t: any) => formatCurrency(t.total_amount) },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('sales_items', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Sales Products columns
  const salesProductsColumns = [
    { header: 'اسم المنتج', accessor: 'name' as const },
    { header: 'نوع الوحدة', accessor: 'unit_type' as const },
    { header: 'الوزن لكل وحدة', accessor: (t: any) => formatNumber(t.weight_per_unit) },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('sales_products', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Customers columns
  const customersColumns = [
    { header: 'اسم العميل', accessor: 'name' as const },
    { header: 'النوع', accessor: 'type' as const },
    { header: 'رقم الهاتف', accessor: 'phone' as const },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('customers', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Date Types columns
  const dateTypesColumns = [
    { header: 'اسم النوع', accessor: 'name' as const },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('date_types', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Crate Types columns
  const crateTypesColumns = [
    { header: 'اسم الصندوق', accessor: 'name' as const },
    { header: 'الوزن', accessor: (t: any) => formatNumber(t.weight) },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('crate_types', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Daily Prices columns
  const dailyPricesColumns = [
    { header: 'التاريخ', accessor: (t: any) => new Date(t.date).toLocaleDateString('ar-EG') },
    { header: 'السعر للقنطار', accessor: (t: any) => formatCurrency(t.price_per_qantar) },
    { header: 'وزن القنطار', accessor: (t: any) => formatNumber(t.qantar_weight) },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('daily_prices', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Supervisors columns
  const supervisorsColumns = [
    { header: 'اسم المشرف', accessor: 'name' as const },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('supervisors', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Seasons columns
  const seasonsColumns = [
    { header: 'اسم الموسم', accessor: 'name' as const },
    {
      header: 'تاريخ البداية',
      accessor: (t: any) => new Date(t.start_date).toLocaleDateString('ar-EG')
    },
    {
      header: 'تاريخ النهاية',
      accessor: (t: any) => new Date(t.end_date).toLocaleDateString('ar-EG')
    },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('seasons', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Users columns
  const usersColumns = [
    { header: 'اسم المستخدم', accessor: 'username' as const },
    { header: 'الاسم الكامل', accessor: 'full_name' as const },
    { header: 'رقم الهاتف', accessor: 'phone' as const },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('users', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // User Roles columns
  const userRolesColumns = [
    { header: 'معرف المستخدم', accessor: 'user_id' as const },
    { header: 'الدور', accessor: 'role' as const },
    { header: 'تم التعيين بواسطة', accessor: 'assigned_by' as const },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('user_roles', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Telegram Users columns
  const telegramUsersColumns = [
    { header: 'معرف تيليجرام', accessor: 'telegram_id' as const },
    { header: 'اسم المستخدم', accessor: 'username' as const },
    { header: 'رقم الهاتف', accessor: 'phone' as const },
    {
      header: 'تاريخ التسجيل',
      accessor: (t: any) => new Date(t.registration_date).toLocaleDateString('ar-EG')
    },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('telegram_users', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  // Telegram Registrations columns
  const telegramRegistrationsColumns = [
    { header: 'معرف تيليجرام', accessor: 'telegram_id' as const },
    { header: 'الاسم الكامل', accessor: 'full_name' as const },
    { header: 'رقم الهاتف', accessor: 'phone' as const },
    { header: 'الدور المطلوب', accessor: 'requested_role' as const },
    {
      header: 'تاريخ الطلب',
      accessor: (t: any) => new Date(t.requested_at).toLocaleDateString('ar-EG')
    },
    {
      header: 'تكرار',
      accessor: (t: any) => (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {t.duplicate_count}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: (t: any) => (
        <button
          onClick={() => handleDelete('telegram_registrations', t.id)}
          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ]

  const getColumns = () => {
    switch (activeTab) {
      case 'weighbridge':
        return weighbridgeColumns
      case 'crates':
        return cratesColumns
      case 'finance':
        return financeColumns
      case 'sales_invoices':
        return salesInvoicesColumns
      case 'sales_items':
        return salesItemsColumns
      case 'sales_products':
        return salesProductsColumns
      case 'customers':
        return customersColumns
      case 'date_types':
        return dateTypesColumns
      case 'crate_types':
        return crateTypesColumns
      case 'daily_prices':
        return dailyPricesColumns
      case 'supervisors':
        return supervisorsColumns
      case 'seasons':
        return seasonsColumns
      case 'users':
        return usersColumns
      case 'user_roles':
        return userRolesColumns
      case 'telegram_users':
        return telegramUsersColumns
      case 'telegram_registrations':
        return telegramRegistrationsColumns
      default:
        return weighbridgeColumns
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">جاري تحميل البيانات المكررة...</div>
    )
  }

  const hasDuplicates = data && data.summary.total > 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Copy size={24} className="text-emerald-600" />
            التحقق من العمليات المكررة
          </h2>
          <p className="text-slate-500 mt-1">
            البحث عن العمليات التي قد تكون تم تسجيلها مرتين بالخطأ
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchDuplicates}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="تحديث"
          >
            <RefreshCw size={20} />
          </button>
          {hasDuplicates && (
            <button
              onClick={handleAutoClean}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 size={20} />
              تنظيف تلقائي
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards Grid - 4 columns for better layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Object.entries(tableConfig).map(([tab, config]) => (
          <StatCard
            key={tab}
            label={config.label}
            value={data?.summary.byTable[tab as keyof typeof data.summary.byTable] || 0}
            icon={config.icon}
            color={config.color}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab as TableTab)}
          />
        ))}
      </div>

      <Card>
        {!hasDuplicates ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CheckCircle2 size={64} className="text-emerald-500 mb-4 opacity-20" />
            <p className="text-xl font-medium">لا توجد عمليات مكررة حالياً</p>
            <p className="text-sm mt-2">قاعدة البيانات تبدو نظيفة تماماً</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <AlertTriangle size={20} />
              <p className="text-sm font-medium">
                تم العثور على {data.summary.total} عملية مكررة. يرجى مراجعتها بعناية قبل الحذف.
              </p>
            </div>

            <Table columns={getColumns()} data={data[activeTab]} />
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon, color, active, onClick }: any) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    orange:
      'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30',
    emerald:
      'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
    purple:
      'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30',
    indigo:
      'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30',
    pink: 'bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-900/30',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-900/30',
    teal: 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30',
    amber:
      'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
    lime: 'bg-lime-50 text-lime-600 border-lime-100 dark:bg-lime-900/20 dark:text-lime-400 dark:border-lime-900/30',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30',
    violet:
      'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-900/30',
    fuchsia:
      'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 dark:border-fuchsia-900/30',
    sky: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-900/30',
    'blue-500':
      'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    'indigo-500':
      'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30'
  }

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all text-right w-full flex flex-col gap-2 ${
        active
          ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
          : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color as keyof typeof colors]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
        <p className="text-3xl font-black text-slate-800 dark:text-white">{value}</p>
      </div>
    </button>
  )
}
