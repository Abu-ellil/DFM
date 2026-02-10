import { useState } from 'react'
import { Card } from '../../ui/Card'
import Calculator from 'lucide-react/dist/esm/icons/calculator'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle'
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw'
import X from 'lucide-react/dist/esm/icons/x'

interface MaintenanceSettingsProps {
  isProcessing: boolean
  settings: any
  onValidate: () => Promise<void>
  onRecalculateAll: () => Promise<void>
  onRecalculateSingle: (id: number) => Promise<void>
}

export function MaintenanceSettings({
  isProcessing,
  settings,
  onValidate: _onValidate,
  onRecalculateAll: _onRecalculateAll,
  onRecalculateSingle: _onRecalculateSingle
}: MaintenanceSettingsProps) {
  const [validationResults, setValidationResults] = useState<any>(null)
  const [showErrors, setShowErrors] = useState(false)

  const handleValidate = async () => {
    try {
      const result = await (window as any).api.weighbridge.validateCalculations()
      setValidationResults(result)
      if (result.success) {
        const { toast } = await import('react-toastify')
        toast.success(`تم التحقق: ${result.valid}/${result.total} عملية صحيحة`)
        if (result.errors > 0) {
          toast.warn(`وجدنا ${result.errors} عملية بأخطاء حسابية`)
        }
      } else {
        const { toast } = await import('react-toastify')
        toast.error(result.error || 'فشل التحقق من الحسابات')
      }
    } catch (error) {
      console.error('Validate error:', error)
      const { toast } = await import('react-toastify')
      toast.error('فشل التحقق من الحسابات')
    }
  }

  const handleRecalculateAllInternal = async () => {
    const confirmed = window.confirm(
      '⚠️ تحذير: سيتم إعادة حساب جميع عمليات الميزان بناءً على الإعدادات الحالية.\n\n' +
        `وزن الصندوق: ${settings.crate_weight} كجم\n` +
        `وزن القنطار: ${settings.qantar_weight} كجم\n\n` +
        'سيتم إنشاء نسخة احتياطية تلقائياً قبل البدء.\n\n' +
        'هل تريد الاستمرار؟'
    )

    if (!confirmed) return

    try {
      const result = await (window as any).api.weighbridge.recalculateAll()
      if (result.success) {
        const { toast } = await import('react-toastify')
        toast.success(result.message || 'تم إعادة حساب العمليات بنجاح')
        if (result.backupPath) {
          toast.info(`تم إنشاء نسخة احتياطية:\n${result.backupPath}`)
        }
        setValidationResults(null)
        const { useWeighbridgeStore } = require('../../../store/useWeighbridgeStore')
        const { useCustomerAccountStore } = require('../../../store/useCustomerAccountStore')
        useWeighbridgeStore.getState().fetchTransactions()
        useCustomerAccountStore.getState().fetchAllSummaries()
      } else {
        const { toast } = await import('react-toastify')
        toast.error(result.message || 'فشل إعادة حساب العمليات')
      }
    } catch (error) {
      console.error('Recalculate error:', error)
      const { toast } = await import('react-toastify')
      toast.error('فشل إعادة حساب العمليات')
    }
  }

  const handleRecalculateSingleInternal = async (id: number) => {
    try {
      const result = await (window as any).api.weighbridge.recalculateSingle(id)
      if (result.success) {
        const { toast } = await import('react-toastify')
        toast.success(result.message)
        handleValidate()
        const { useWeighbridgeStore } = require('../../../store/useWeighbridgeStore')
        const { useCustomerAccountStore } = require('../../../store/useCustomerAccountStore')
        useWeighbridgeStore.getState().fetchTransactions()
        useCustomerAccountStore.getState().fetchAllSummaries()
      } else {
        const { toast } = await import('react-toastify')
        toast.error(result.message || 'فشل إعادة حساب العملية')
      }
    } catch (error) {
      console.error('Recalculate single error:', error)
      const { toast } = await import('react-toastify')
      toast.error('فشل إعادة حساب العملية')
    }
  }

  return (
    <>
      <Card className="space-y-4">
        <div className="flex items-center gap-2 mb-4 text-indigo-600">
          <Calculator size={20} />
          <h3 className="font-bold">الصيانة والتحقق من الحسابات</h3>
        </div>

        <div className="space-y-4">
          {!validationResults ? (
            <button
              onClick={handleValidate}
              disabled={isProcessing}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle size={18} />
              {isProcessing ? 'جاري التحقق...' : 'تحقق من صحة الحسابات'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <div className="text-2xl font-black text-slate-800 dark:text-white">
                    {validationResults.total}
                  </div>
                  <div className="text-xs text-slate-500 font-bold">إجمالي العمليات</div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                  <div className="text-2xl font-black text-emerald-600">
                    {validationResults.valid}
                  </div>
                  <div className="text-xs text-slate-500 font-bold">عمليات صحيحة</div>
                </div>
                <div
                  className={`p-3 ${validationResults.errors > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'} rounded-lg text-center`}
                >
                  <div
                    className={`text-2xl font-black ${validationResults.errors > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                  >
                    {validationResults.errors}
                  </div>
                  <div className="text-xs text-slate-500 font-bold">عمليات بها أخطاء</div>
                </div>
              </div>

              {validationResults.errors > 0 && (
                <>
                  <button
                    onClick={() => setShowErrors(true)}
                    className="w-full bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={18} />
                    عرض العمليات الخاطئة ({validationResults.errors})
                  </button>

                  <button
                    onClick={handleRecalculateAllInternal}
                    disabled={isProcessing}
                    className="w-full bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={18} />
                    {isProcessing ? 'جاري إعادة الحساب...' : 'إعادة حساب جميع العمليات'}
                  </button>
                </>
              )}

              <button
                onClick={() => setValidationResults(null)}
                className="w-full text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
              >
                إعادة التحقق
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Validation Errors Modal */}
      {showErrors && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-rose-600" size={24} />
                عمليات بها أخطاء حسابية ({validationResults.details.length})
              </h3>
              <button
                onClick={() => setShowErrors(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {validationResults.details.map((error: any) => (
                <div
                  key={error.id}
                  className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white">
                        العميل: {error.customer_name}
                      </div>
                      <div className="text-sm text-slate-500">
                        التاريخ: {error.date} | المعرف: #{error.id}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRecalculateSingleInternal(error.id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors text-sm font-bold"
                    >
                      إصلاح
                    </button>
                  </div>

                  <div className="space-y-2">
                    {error.net_weight_error && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-700">خطأ في الوزن الصافي:</div>
                          <div className="text-slate-500">
                            الحالي: {error.net_weight_error.current} كجم | المتوقع:{' '}
                            {error.net_weight_error.expected} كجم | الفرق:{' '}
                            <span className="font-bold text-rose-600">
                              {error.net_weight_error.diff} كجم
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {error.total_error && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-700">خطأ في الإجمالي:</div>
                          <div className="text-slate-500">
                            الحالي: {error.total_error.current} ريال | المتوقع:{' '}
                            {error.total_error.expected} ريال | الفرق:{' '}
                            <span className="font-bold text-rose-600">
                              {error.total_error.diff} ريال
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <button
                onClick={handleRecalculateAllInternal}
                disabled={isProcessing}
                className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-bold disabled:opacity-50"
              >
                إصلاح الكل ({validationResults.details.length})
              </button>
              <button
                onClick={() => setShowErrors(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold"
              >
                إغلاق
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
