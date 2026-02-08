import { create } from 'zustand'

interface SalesInvoice {
  id: number
  date: string
  buyer_name: string
  buyer_phone?: string
  total_weight: number
  total_amount: number
  payment_method: string
  notes?: string
  created_at: string
  items_count?: number
}

interface SalesItem {
  id: number
  invoice_id: number
  product_id: number
  product_name: string
  unit_type: string
  weight_per_unit: number
  quantity: number
  price_per_kg: number
  total_weight: number
  total_amount: number
  created_at: string
}

interface SalesSummary {
  total_incoming: number
  total_outgoing: number
  current_stock: number
  total_sales: number
  loss_percentage: number
}

interface SalesInvoicesStore {
  invoices: SalesInvoice[]
  items: SalesItem[]
  summary: SalesSummary
  isLoading: boolean
  fetchInvoices: () => Promise<void>
  fetchItems: (invoiceId: number) => Promise<SalesItem[]>
  fetchSummary: () => Promise<void>
  addInvoice: (data: any) => Promise<{ success: boolean; message?: string; id?: number }>
  deleteInvoice: (id: number) => Promise<{ success: boolean; message?: string }>
}

export const useSalesInvoicesStore = create<SalesInvoicesStore>((set) => ({
  invoices: [],
  items: [],
  summary: {
    total_incoming: 0,
    total_outgoing: 0,
    current_stock: 0,
    total_sales: 0,
    loss_percentage: 0
  },
  isLoading: false,
  fetchInvoices: async () => {
    set({ isLoading: true })
    try {
      const invoices = await window.api.salesInvoices.getAll()
      set({ invoices, isLoading: false })
    } catch (error) {
      console.error('Fetch invoices error:', error)
      set({ isLoading: false })
    }
  },
  fetchItems: async (invoiceId) => {
    try {
      const items = await window.api.salesInvoices.getItems(invoiceId)
      set({ items })
      return items
    } catch (error) {
      console.error('Fetch items error:', error)
      return []
    }
  },
  fetchSummary: async () => {
    try {
      const summary = await window.api.salesInvoices.getSummary()
      set({ summary })
    } catch (error) {
      console.error('Fetch summary error:', error)
    }
  },
  addInvoice: async (data) => {
    try {
      const result = await window.api.salesInvoices.create(data)
      if (result.success) {
        const [invoices, summary] = await Promise.all([
          window.api.salesInvoices.getAll(),
          window.api.salesInvoices.getSummary()
        ])
        set({ invoices, summary })
      }
      return result
    } catch (error) {
      console.error('Add invoice error:', error)
      return { success: false, message: 'خطأ في الاتصال بالقاعدة' }
    }
  },
  deleteInvoice: async (id) => {
    try {
      const result = await window.api.salesInvoices.delete(id)
      if (result.success) {
        const [invoices, summary] = await Promise.all([
          window.api.salesInvoices.getAll(),
          window.api.salesInvoices.getSummary()
        ])
        set({ invoices, summary })
      }
      return result
    } catch (error) {
      console.error('Delete invoice error:', error)
      return { success: false, message: 'خطأ في الاتصال بالقاعدة' }
    }
  }
}))
