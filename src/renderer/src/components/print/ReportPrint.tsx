import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'

interface ReportData {
  title: string
  date_from: string
  date_to: string
  summary: {
    total_weight: number
    total_amount: number
    total_suppliers: number
    total_transactions: number
  }
  details: Array<{
    date: string
    supplier_name: string
    weight: number
    amount: number
  }>
}

export default function ReportPrint({ data }: { data: ReportData }) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `تقرير_${data.title}`
  })

  return (
    <>
      <button
        onClick={handlePrint}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-bold"
      >
        طباعة التقرير
      </button>

      <div ref={componentRef} className="hidden print:block">
        <div className="bg-white text-black p-8">
          {/* Header */}
          <div className="text-center border-b-2 border-emerald-600 pb-4 mb-6">
            <h1 className="text-2xl font-black">مصنع التمور</h1>
            <p className="text-xl font-bold">{data.title}</p>
            <p className="text-sm text-gray-600">
              من {data.date_from} إلى {data.date_to}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">إجمالي الوزن</p>
              <p className="text-2xl font-bold text-blue-600">{data.summary.total_weight.toFixed(2)} كجم</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">إجمالي القيمة</p>
              <p className="text-2xl font-bold text-emerald-600">{data.summary.total_amount.toFixed(2)} ج.م</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">عدد الموردين</p>
              <p className="text-2xl font-bold text-purple-600">{data.summary.total_suppliers}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">عدد العمليات</p>
              <p className="text-2xl font-bold text-orange-600">{data.summary.total_transactions}</p>
            </div>
          </div>

          {/* Details Table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="border border-emerald-700 px-4 py-2 text-right">م</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">التاريخ</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">المورد</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">الوزن (كجم)</th>
                <th className="border border-emerald-700 px-4 py-2 text-right">القيمة (ج.م)</th>
              </tr>
            </thead>
            <tbody>
              {data.details.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.date}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.supplier_name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {item.weight.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-bold">
                    {item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-8">
            <div className="text-center">
              <div className="border-b border-dotted border-gray-400 mb-2 h-12"></div>
              <p className="text-sm text-gray-600">توقيع المسؤول</p>
            </div>
            <div className="text-center">
              <div className="border-b border-dotted border-gray-400 mb-2 h-12"></div>
              <p className="text-sm text-gray-600">توقيع المحاسب</p>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            <p>تم الطباعة في: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          </div>
        </div>
      </div>
    </>
  )
}
