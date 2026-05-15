import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

interface InvoiceItem {
  product_name: string
  quantity: number
  price_per_kg: number
  total_weight: number
  total_amount: number
}

interface InvoicePrintProps {
  data: {
    id: number
    date: string
    buyer_name: string
    buyer_phone?: string
    items: InvoiceItem[]
    total_weight: number
    total_amount: number
    payment_method: string
    notes?: string
  }
}

export default function InvoicePrint({ data }: InvoicePrintProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `فاتورة_${data.id}`
  })

  return (
    <>
      <button
        onClick={handlePrint}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-bold"
      >
        طباعة الفاتورة
      </button>

      <div ref={componentRef} className="hidden print:block">
        <div className="bg-white text-black p-8 border-2 border-emerald-600">
          {/* Header */}
          <div className="text-center border-b-2 border-emerald-600 pb-4 mb-6">
            <h1 className="text-2xl font-black">مصنع التمور</h1>
            <p className="text-lg">فاتورة مبيعات</p>
            <p className="text-sm text-gray-600">رقم: {data.id}</p>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">اسم المشتري</p>
              <p className="font-bold text-lg">{data.buyer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">التاريخ</p>
              <p className="font-bold text-lg">{data.date}</p>
            </div>
            {data.buyer_phone && (
              <div>
                <p className="text-sm text-gray-600">الهاتف</p>
                <p className="font-bold text-lg">{data.buyer_phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">طريقة الدفع</p>
              <p className="font-bold text-lg">{data.payment_method}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="border border-emerald-700 px-4 py-2 text-right">م</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">المنتج</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">الوزن (كجم)</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">السعر/كجم</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.product_name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {item.total_weight.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {item.price_per_kg.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-bold">
                    {item.total_amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100">
                <td colSpan={2} className="border border-gray-300 px-4 py-3 text-left font-bold">
                  الإجمالي
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                  {data.total_weight.toFixed(2)} كجم
                </td>
                <td></td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-emerald-600 text-xl">
                  {data.total_amount.toFixed(2)} ج.م
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Notes */}
          {data.notes && (
            <div className="border-t pt-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">ملاحظات</p>
              <p className="text-sm">{data.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-8">
            <div className="text-center">
              <div className="border-b border-dotted border-gray-400 mb-2 h-12"></div>
              <p className="text-sm text-gray-600">توقيع الكاشير</p>
            </div>
            <div className="text-center">
              <div className="border-b border-dotted border-gray-400 mb-2 h-12"></div>
              <p className="text-sm text-gray-600">توقيع المسؤول</p>
            </div>
            <div className="text-center">
              <div className="border-b border-dotted border-gray-400 mb-2 h-12"></div>
              <p className="text-sm text-gray-600">توقيع المشتري</p>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            <p>تم الطباعة في: {new Date().toLocaleString('ar-EG')}</p>
          </div>
        </div>
      </div>
    </>
  )
}
