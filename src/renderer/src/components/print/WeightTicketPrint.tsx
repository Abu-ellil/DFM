import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

interface WeightTicketProps {
  data: {
    id: number
    date: string
    customer_name: string
    customer_type: string
    date_type_name: string
    gross_weight: number
    net_weight: number
    price_per_qantar: number
    total: number
    crates_count: number
    commission: number
    notes?: string
  }
}

export default function WeightTicketPrint({ data }: WeightTicketProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `تذكرة_وزن_${data.id}`
  })

  return (
    <>
      <button
        onClick={handlePrint}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-bold"
      >
        طباعة تذكرة الوزن
      </button>

      <div ref={componentRef} className="hidden print:block">
        <div className="bg-white text-black p-8 border-2 border-emerald-600">
          {/* Header */}
          <div className="text-center border-b-2 border-emerald-600 pb-4 mb-6">
            <h1 className="text-2xl font-black">مصنع التمور</h1>
            <p className="text-lg">تذكرة وزن</p>
            <p className="text-sm text-gray-600">رقم: {data.id}</p>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">اسم العميل</p>
              <p className="font-bold text-lg">{data.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">نوع العميل</p>
              <p className="font-bold text-lg">{data.customer_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">نوع التمر</p>
              <p className="font-bold text-lg">{data.date_type_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">التاريخ</p>
              <p className="font-bold text-lg">{data.date}</p>
            </div>
          </div>

          {/* Weights Table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="border border-emerald-700 px-4 py-2 text-right">الوزن الإجمالي</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">الوزن الصافي</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">الصناديق</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                  {data.gross_weight.toFixed(2)} كجم
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                  {data.net_weight.toFixed(2)} كجم
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                  {data.crates_count}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">سعر القنطار</p>
              <p className="font-bold text-lg">{data.price_per_qantar} ج.م</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">الإجمالي</p>
              <p className="font-bold text-2xl text-emerald-600">{data.total.toFixed(2)} ج.م</p>
            </div>
          </div>

          {/* Commission */}
          {data.commission > 0 && (
            <div className="bg-gray-100 p-3 rounded mb-6">
              <p className="text-sm text-gray-600">العمولة</p>
              <p className="font-bold text-lg">{data.commission.toFixed(2)} ج.م</p>
            </div>
          )}

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
              <p className="text-sm text-gray-600">توقيع الموزن</p>
            </div>
            <div className="text-center">
              <div className="border-b border-dotted border-gray-400 mb-2 h-12"></div>
              <p className="text-sm text-gray-600">توقيع العميل</p>
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
