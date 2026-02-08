import { create } from 'zustand'

interface SalesProduct {
  id: number
  name: string
  unit_type: string
  weight_per_unit: number
  created_at: string
}

interface SalesProductsStore {
  products: SalesProduct[]
  isLoading: boolean
  fetchProducts: () => Promise<void>
  addProduct: (data: { name: string; unit_type: string; weight_per_unit: number }) => Promise<{ success: boolean; message?: string }>
  updateProduct: (id: number, data: { name: string; unit_type: string; weight_per_unit: number }) => Promise<{ success: boolean; message?: string }>
  deleteProduct: (id: number) => Promise<{ success: boolean; message?: string }>
}

export const useSalesProductsStore = create<SalesProductsStore>((set) => ({
  products: [],
  isLoading: false,
  fetchProducts: async () => {
    set({ isLoading: true })
    try {
      const products = await window.api.salesProducts.getAll()
      set({ products, isLoading: false })
    } catch (error) {
      console.error('Fetch products error:', error)
      set({ isLoading: false })
    }
  },
  addProduct: async (data) => {
    try {
      const result = await window.api.salesProducts.create(data)
      if (result.success) {
        const products = await window.api.salesProducts.getAll()
        set({ products })
      }
      return result
    } catch (error) {
      console.error('Add product error:', error)
      return { success: false, message: 'خطأ في الاتصال بالقاعدة - يرجى المحاولة مرة أخرى' }
    }
  },
  updateProduct: async (id, data) => {
    try {
      const result = await window.api.salesProducts.update(id, data)
      if (result.success) {
        const products = await window.api.salesProducts.getAll()
        set({ products })
      }
      return result
    } catch (error) {
      console.error('Update product error:', error)
      return { success: false, message: 'خطأ في الاتصال بالقاعدة - يرجى المحاولة مرة أخرى' }
    }
  },
  deleteProduct: async (id) => {
    try {
      const result = await window.api.salesProducts.delete(id)
      if (result.success) {
        const products = await window.api.salesProducts.getAll()
        set({ products })
      }
      return result
    } catch (error) {
      console.error('Delete product error:', error)
      return { success: false, message: 'خطأ في الاتصال بالقاعدة - يرجى المحاولة مرة أخرى' }
    }
  }
}))
