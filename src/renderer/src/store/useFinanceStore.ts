/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'

type PaymentMethod = 'نقدا' | 'تحويل بنكي' | 'مصروفات ومشتريات'

interface FinanceTransaction {
  id: number
  date: string
  customer_id: number
  customer_name: string
  transaction_type: string
  amount_paid: number
  amount_received: number
  notes: string
  payment_method: PaymentMethod
  receipt_file?: string
  receipt_reference?: string
  created_at: string
}

interface FinanceSummary {
  customer_id: number
  customer_name: string
  total_paid: number
  total_received: number
  total_weighbridge_debt: number
  net_balance: number
}

interface FinanceStore {
  transactions: FinanceTransaction[]
  summary: FinanceSummary[]
  isLoading: boolean
  fetchFinance: () => Promise<void>
  addTransaction: (data: any) => Promise<{ success: boolean; message?: string }>
  updateTransaction: (id: number, data: any) => Promise<{ success: boolean; message?: string }>
  deleteTransaction: (id: number) => Promise<{ success: boolean; message?: string }>
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transactions: [],
  summary: [],
  isLoading: false,
  fetchFinance: async () => {
    set({ isLoading: true })
    try {
      const [transactions, summary] = await Promise.all([
        window.api.finance.getAll(),
        window.api.finance.getSummary()
      ])
      set({ transactions, summary, isLoading: false })
    } catch (error) {
      console.error('Fetch finance error:', error)
      set({ isLoading: false })
    }
  },
  addTransaction: async (data) => {
    try {
      const result = await window.api.finance.create(data)
      if (result.success) {
        try {
          const [transactions, summary] = await Promise.all([
            window.api.finance.getAll(),
            window.api.finance.getSummary()
          ])
          set({ transactions, summary })
        } catch (fetchError) {
          console.error('Error fetching updated data:', fetchError)
        }

        // Trigger customer account refresh (separate try-catch to ensure it runs)
        try {
          const { useCustomerAccountStore } = require('./useCustomerAccountStore')
          useCustomerAccountStore
            .getState()
            .fetchAllSummaries()
            .catch((err) => {
              console.error('Error refreshing customer accounts:', err)
            })
        } catch (accountError) {
          console.error('Error accessing customer account store:', accountError)
        }
      }
      return result
    } catch (error) {
      console.error('Add transaction error:', error)
      return { success: false, message: 'خطأ في الاتصال بالقاعدة' }
    }
  },
  updateTransaction: async (id, data) => {
    try {
      const result = await window.api.finance.update(id, data)
      if (result.success) {
        try {
          const [transactions, summary] = await Promise.all([
            window.api.finance.getAll(),
            window.api.finance.getSummary()
          ])
          set({ transactions, summary })
        } catch (fetchError) {
          console.error('Error fetching updated data:', fetchError)
        }

        try {
          const { useCustomerAccountStore } = require('./useCustomerAccountStore')
          useCustomerAccountStore.getState().fetchAllSummaries().catch((err) => {
            console.error('Error refreshing customer accounts:', err)
          })
        } catch (accountError) {
          console.error('Error accessing customer account store:', accountError)
        }
      }
      return result
    } catch (error) {
      console.error('Update transaction error:', error)
      return { success: false, message: 'خطأ في الاتصال بالقاعدة' }
    }
  },
  deleteTransaction: async (id) => {
    try {
      const result = await window.api.finance.delete(id)
      if (result.success) {
        try {
          const [transactions, summary] = await Promise.all([
            window.api.finance.getAll(),
            window.api.finance.getSummary()
          ])
          set({ transactions, summary })
        } catch (fetchError) {
          console.error('Error fetching updated data:', fetchError)
        }

        try {
          const { useCustomerAccountStore } = require('./useCustomerAccountStore')
          useCustomerAccountStore
            .getState()
            .fetchAllSummaries()
            .catch((err) => {
              console.error('Error refreshing customer accounts:', err)
            })
        } catch (accountError) {
          console.error('Error accessing customer account store:', accountError)
        }
      }
      return result
    } catch (error) {
      console.error('Delete transaction error:', error)
      return { success: false, message: 'خطأ في الاتصال بالقاعدة' }
    }
  }
}))
