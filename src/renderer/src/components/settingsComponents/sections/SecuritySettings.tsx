import { useState } from 'react'
import { Card } from '../../ui/Card'
import Shield from 'lucide-react/dist/esm/icons/shield'
import Save from 'lucide-react/dist/esm/icons/save'
import Lock from 'lucide-react/dist/esm/icons/lock'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import X from 'lucide-react/dist/esm/icons/x'

interface SecuritySettingsProps {
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>
  onDeleteAllData: (password: string) => Promise<void>
}

export function SecuritySettings({ onChangePassword, onDeleteAllData }: SecuritySettingsProps) {
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      const { toast } = await import('react-toastify')
      toast.error('كلمة المرور الجديدة غير متطابقة')
      return
    }
    await onChangePassword(passwords.old, passwords.new)
    setPasswords({ old: '', new: '', confirm: '' })
    setShowPasswordChange(false)
  }

  const handleDeleteAllDataClick = async () => {
    const confirmed = window.confirm(
      'تحذير نهائي: سيتم حذف كافة البيانات (الموازين، الصناديق، الحسابات، العملاء) بالإضافة إلى:\n\n' +
        '- جميع البيانات المخزنة محلياً (Local Storage)\n' +
        '- ذاكرة التخزين المؤقت (Cache)\n' +
        '- ملفات تعريف الكعك (Cookies)\n' +
        '- قاعدة بيانات IndexedDB\n' +
        '- الملفات المؤقتة والسجلات\n' +
        '- جميع بيانات الجلسة\n\n' +
        'لا يمكن التراجع عن هذه العملية. هل تريد الاستمرار؟'
    )
    if (confirmed) {
      setShowDeletePasswordModal(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletePassword || deletePassword.trim() === '') {
      const { toast } = await import('react-toastify')
      toast.error('يرجى إدخال كلمة المرور')
      return
    }
    await onDeleteAllData(deletePassword)
    setShowDeletePasswordModal(false)
    setDeletePassword('')
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-red-600">
        <Shield size={20} />
        <h3 className="font-bold">الأمان والصلاحيات</h3>
      </div>

      <div className="space-y-4">
        {showPasswordChange ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2">
              <Lock size={18} />
              <span className="font-bold">تغيير كلمة المرور</span>
            </div>
            <input
              type="password"
              placeholder="كلمة المرور الحالية"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
              value={passwords.old}
              onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
            />
            <input
              type="password"
              placeholder="كلمة المرور الجديدة"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            />
            <input
              type="password"
              placeholder="تأكيد كلمة المرور الجديدة"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 text-sm"
              >
                حفظ كلمة المرور
              </button>
              <button
                onClick={() => setShowPasswordChange(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPasswordChange(true)}
            className="w-full text-right p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex justify-between items-center group"
          >
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              <span className="text-sm font-bold">تغيير كلمة مرور المشرف</span>
            </div>
            <Save size={16} className="text-slate-300 group-hover:text-emerald-500" />
          </button>
        )}

        <button
          onClick={handleDeleteAllDataClick}
          className="w-full text-right p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex justify-between items-center group text-red-500 border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
        >
          <div className="flex items-center gap-2">
            <Trash2 size={16} />
            <span className="text-sm font-bold">حذف كافة البيانات (تصفير المصنع)</span>
          </div>
          <Shield size={16} className="text-red-300 group-hover:text-red-500" />
        </button>
      </div>

      {/* Delete Password Modal */}
      {showDeletePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <Shield size={24} />
                <h3 className="text-xl font-bold">تأكيد حذف كافة البيانات</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeletePasswordModal(false)
                  setDeletePassword('')
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 text-slate-600 dark:text-slate-300">
              <p className="mb-2">سيتم حذف كافة البيانات التالية:</p>
              <ul className="space-y-1 text-sm mr-4 list-disc">
                <li>جميع البيانات في قاعدة البيانات (الموازين، الصناديق، الحسابات، العملاء)</li>
                <li>جميع البيانات المخزنة محلياً (Local Storage)</li>
                <li>ذاكرة التخزين المؤقت (Cache)</li>
                <li>ملفات تعريف الكعك (Cookies)</li>
                <li>قاعدة بيانات IndexedDB</li>
                <li>الملفات المؤقتة والسجلات</li>
                <li>جميع بيانات الجلسة</li>
              </ul>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="كلمة مرور المشرف"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-red-500"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmDelete()
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmDelete}
                  disabled={!deletePassword || deletePassword.trim() === ''}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  حذف كافة البيانات
                </button>
                <button
                  onClick={() => {
                    setShowDeletePasswordModal(false)
                    setDeletePassword('')
                  }}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
