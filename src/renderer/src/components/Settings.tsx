import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useCustomerAccountStore } from '../store/useCustomerAccountStore'
import {
  SettingsSidebar,
  GeneralSettings,
  DataTypesSettings,
  TelegramSettings,
  DatabaseSettings,
  CloudSettings,
  MaintenanceSettings,
  LicenseSettings,
  SecuritySettings,
  SupportSettings
} from './settingsComponents'
import { toast } from 'react-toastify'

export default function Settings() {
  const { settings, fetchSettings, updateSetting } = useSettingsStore()
  const [activeSection, setActiveSection] = useState('general')
  const [formData, setFormData] = useState(settings)
  const [isProcessing, setIsProcessing] = useState(false)

  // Data Management States
  const [dateTypes, setDateTypes] = useState<any[]>([])
  const [crateTypes, setCrateTypes] = useState<any[]>([])
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [newName, setNewName] = useState({
    dateType: '',
    crateType: '',
    crateWeight: '',
    supervisor: ''
  })

  // License States
  const [licenseInfo, setLicenseInfo] = useState<any>(null)
  const [licenseKey, setLicenseKey] = useState('')
  const [factoryName, setFactoryName] = useState('')

  // Telegram Bot Management States
  const [botStatus, setBotStatus] = useState<any>(null)
  const [botToken, setBotToken] = useState(formData.telegram_token || '')

  useEffect(() => {
    fetchSettings()
    fetchDataManagement()
    fetchLicenseInfo()
  }, [])

  useEffect(() => {
    setFormData(settings)
    if (settings.company_name) setFactoryName(settings.company_name)
    if (settings.telegram_token) setBotToken(settings.telegram_token)
  }, [settings])

  // Listen for bulk customer account updates (e.g., after Excel import)
  useEffect(() => {
    const handleBulkUpdate = ({ count }: { count: number }) => {
      toast.success(`تم استيراد ${count} عميل بنجاح`)
      fetchDataManagement()
      useCustomerAccountStore.getState().fetchAllSummaries()
    }

    window.api?.on?.('customerAccounts:bulkUpdate', handleBulkUpdate)
    return () => {
      window.api?.removeListener?.('customerAccounts:bulkUpdate', handleBulkUpdate)
    }
  }, [])

  const fetchDataManagement = async () => {
    const [dt, ct, sv] = await Promise.all([
      window.api.dateTypes.getAll(),
      window.api.crateTypes.getAll(),
      window.api.supervisors.getAll()
    ])
    setDateTypes(dt)
    setCrateTypes(ct)
    setSupervisors(sv)
  }

  const fetchLicenseInfo = async () => {
    const info = await window.api.license.getInfo()
    setLicenseInfo(info)
  }

  const handleSave = async (key: string, value: string) => {
    const result = await updateSetting(key as keyof typeof settings, value)
    if (result.success) {
      toast.success('تم حفظ التغييرات')
    } else {
      toast.error('فشل حفظ التغييرات')
    }
  }

  const handleAddDateType = async () => {
    if (!newName.dateType.trim()) return
    const result = await window.api.dateTypes.create(newName.dateType)
    if (result.success) {
      setNewName({ ...newName, dateType: '' })
      fetchDataManagement()
      toast.success('تم إضافة نوع التمر')
    }
  }

  const handleDeleteDateType = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا النوع؟')) return
    const result = await window.api.dateTypes.delete(id)
    if (result.success) {
      fetchDataManagement()
      toast.success('تم الحذف بنجاح')
    }
  }

  const handleAddCrateType = async () => {
    if (!newName.crateType.trim() || !newName.crateWeight) return
    const result = await window.api.crateTypes.create({
      name: newName.crateType,
      weight: parseFloat(newName.crateWeight)
    })
    if (result.success) {
      setNewName({ ...newName, crateType: '', crateWeight: '' })
      fetchDataManagement()
      toast.success('تم إضافة نوع الصندوق')
    }
  }

  const handleDeleteCrateType = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا النوع؟')) return
    const result = await window.api.crateTypes.delete(id)
    if (result.success) {
      fetchDataManagement()
      toast.success('تم الحذف بنجاح')
    }
  }

  const handleAddSupervisor = async () => {
    if (!newName.supervisor.trim()) return
    const result = await window.api.supervisors.create(newName.supervisor)
    if (result.success) {
      setNewName({ ...newName, supervisor: '' })
      fetchDataManagement()
      toast.success('تم إضافة المشرف')
    }
  }

  const handleDeleteSupervisor = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشرف؟')) return
    const result = await window.api.supervisors.delete(id)
    if (result.success) {
      fetchDataManagement()
      toast.success('تم الحذف بنجاح')
    }
  }

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      'تحذير نهائي: سيتم حذف كافة البيانات (الموازين، الصناديق، الحسابات، العملاء). لا يمكن التراجع عن هذه العملية. هل تريد الاستمرار؟'
    )
    if (confirmed) {
      const password = window.prompt('يرجى إدخال كلمة مرور المشرف للتأكيد:')
      if (password) {
        const result = await window.api.settings.deleteAllData()
        if (result.success) {
          toast.success(result.message)
          fetchSettings()
          fetchDataManagement()
        } else {
          toast.error(result.message)
        }
      }
    }
  }

  const handleActivate = async () => {
    if (!licenseKey.trim() || !factoryName.trim()) {
      toast.error('يرجى إدخال مفتاح الترخيص واسم المصنع')
      return
    }
    const result = await window.api.license.activate({ licenseKey: licenseKey, factoryName })
    if (result.success) {
      toast.success(result.message)
      fetchLicenseInfo()
    } else {
      toast.error(result.message)
    }
  }

  const handleSync = async () => {
    try {
      setIsProcessing(true)
      console.log('Starting sync...')
      const result = await window.api.settings.sync()
      console.log('Sync result:', result)
      if (result.success) {
        toast.success('تم إنشاء نسخة احتياطية بنجاح')
      } else if (result.message) {
        toast.error(result.message)
      } else {
        toast.error('تم إلغاء العملية أو فشل الحفظ')
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('حدث خطأ تقني أثناء التصدير')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImportDb = async () => {
    try {
      if (
        window.confirm(
          'تحذير: استيراد قاعدة بيانات سيؤدي لاستبدال كافة البيانات الحالية. هل تريد الاستمرار؟'
        )
      ) {
        setIsProcessing(true)
        console.log('Starting DB import...')
        const result = await window.api.settings.importDb()
        console.log('Import result:', result)
        if (result.success) {
          toast.success(result.message)
          fetchSettings()
        } else if (result.message) {
          toast.error(result.message)
        }
      }
    } catch (error) {
      console.error('Import DB error:', error)
      toast.error('حدث خطأ تقني أثناء الاستيراد')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImportExcel = async () => {
    try {
      setIsProcessing(true)
      console.log('Starting Excel import...')
      const result = await window.api.settings.importExcel()
      console.log('Excel import result:', result)
      if (result.success) {
        toast.success(result.message)
      } else if (result.message) {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Excel import error:', error)
      toast.error('حدث خطأ تقني أثناء استيراد Excel')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTestTelegram = async () => {
    if (!formData.telegram_token || !formData.telegram_chat_id) {
      toast.error('يرجى إدخال بيانات تلجرام أولاً')
      return
    }

    const result = await (window as any).api.telegram.send({
      token: formData.telegram_token,
      chatId: formData.telegram_chat_id,
      message: '🔔 تجربة إشعارات مصنع التمور\nتم إعداد البوت بنجاح!'
    })

    if (result.success) {
      toast.success('تم إرسال رسالة التجربة بنجاح')
    } else {
      toast.error('فشل إرسال رسالة التجربة، تحقق من البيانات')
    }
  }

  const handleSendReport = async () => {
    if (!formData.telegram_token || !formData.telegram_chat_id) {
      toast.error('يرجى إدخال بيانات تلجرام أولاً')
      return
    }

    try {
      setIsProcessing(true)
      const result = await (window as any).api.telegram.sendReport()

      if (result.success) {
        toast.success(result.message || 'تم إرسال التقرير بنجاح')
      } else {
        toast.error(result.error || result.message || 'فشل إرسال التقرير')
      }
    } catch (error) {
      console.error('Send report error:', error)
      toast.error('حدث خطأ أثناء إرسال التقرير')
    } finally {
      setIsProcessing(false)
    }
  }

  const fetchBotStatus = async () => {
    const stats = await window.api.telegram.getStats()
    setBotStatus(stats)
  }

  const handleStartBot = async () => {
    const result = await window.api.telegram.startBot()
    if (result.success) {
      toast.success(result.message || 'تم تشغيل البوت')
      fetchBotStatus()
    } else {
      toast.error(result.message || 'فشل تشغيل البوت')
    }
  }

  const handleStopBot = async () => {
    const result = await window.api.telegram.stopBot()
    if (result.success) {
      toast.success(result.message || 'تم إيقاف البوت')
      fetchBotStatus()
    } else {
      toast.error(result.message || 'فشل إيقاف البوت')
    }
  }

  const handleRestartBot = async () => {
    const result = await window.api.telegram.restartBot()
    if (result.success) {
      toast.success(result.message || 'تم إعادة تشغيل البوت')
      fetchBotStatus()
    } else {
      toast.error(result.message || 'فشل إعادة تشغيل البوت')
    }
  }

  const handleTestBotConnection = async () => {
    if (!botToken) {
      toast.error('يرجى إدخال توكن البوت أولاً')
      return
    }
    const result = await window.api.telegram.testConnection(botToken)
    if (result.success) {
      toast.success(`تم الاتصال بالبوت: @${result.botInfo?.username}`)
    } else {
      toast.error(result.message || 'فشل الاتصال بالبوت')
    }
  }

  const handleEnableBot = async (enabled: boolean) => {
    await handleSave('telegram_bot_enabled', enabled ? '1' : '0')
    if (enabled) {
      handleStartBot()
    } else {
      handleStopBot()
    }
  }

  useEffect(() => {
    fetchBotStatus()
  }, [])

  const handleValidate = async () => {
    try {
      setIsProcessing(true)
      const result = await (window as any).api.weighbridge.validateCalculations()
      if (result.success) {
        toast.success(`تم التحقق: ${result.valid}/${result.total} عملية صحيحة`)
        if (result.errors > 0) {
          toast.warn(`وجدنا ${result.errors} عملية بأخطاء حسابية`)
        }
      } else {
        toast.error(result.error || 'فشل التحقق من الحسابات')
      }
    } catch (error) {
      console.error('Validate error:', error)
      toast.error('فشل التحقق من الحسابات')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecalculateAll = async () => {
    const confirmed = window.confirm(
      '⚠️ تحذير: سيتم إعادة حساب جميع عمليات الميزان بناءً على الإعدادات الحالية.\n\n' +
        `وزن الصندوق: ${settings.crate_weight} كجم\n` +
        `وزن القنطار: ${settings.qantar_weight} كجم\n\n` +
        'سيتم إنشاء نسخة احتياطية تلقائياً قبل البدء.\n\n' +
        'هل تريد الاستمرار؟'
    )

    if (!confirmed) return

    try {
      setIsProcessing(true)
      const result = await (window as any).api.weighbridge.recalculateAll()
      if (result.success) {
        toast.success(result.message || 'تم إعادة حساب العمليات بنجاح')
        if (result.backupPath) {
          toast.info(`تم إنشاء نسخة احتياطية:\n${result.backupPath}`)
        }
        const { useWeighbridgeStore } = require('../store/useWeighbridgeStore')
        useWeighbridgeStore.getState().fetchTransactions()
        useCustomerAccountStore.getState().fetchAllSummaries()
      } else {
        toast.error(result.message || 'فشل إعادة حساب العمليات')
      }
    } catch (error) {
      console.error('Recalculate error:', error)
      toast.error('فشل إعادة حساب العمليات')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecalculateSingle = async (id: number) => {
    try {
      const result = await (window as any).api.weighbridge.recalculateSingle(id)
      if (result.success) {
        toast.success(result.message)
        handleValidate()
        const { useWeighbridgeStore } = require('../store/useWeighbridgeStore')
        useWeighbridgeStore.getState().fetchTransactions()
        useCustomerAccountStore.getState().fetchAllSummaries()
      } else {
        toast.error(result.message || 'فشل إعادة حساب العملية')
      }
    } catch (error) {
      console.error('Recalculate single error:', error)
      toast.error('فشل إعادة حساب العملية')
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettings formData={formData} setFormData={setFormData} onSave={handleSave} />
      case 'data':
        return (
          <DataTypesSettings
            dateTypes={dateTypes}
            crateTypes={crateTypes}
            supervisors={supervisors}
            newName={newName}
            setNewName={setNewName}
            onAddDateType={handleAddDateType}
            onDeleteDateType={handleDeleteDateType}
            onAddCrateType={handleAddCrateType}
            onDeleteCrateType={handleDeleteCrateType}
            onAddSupervisor={handleAddSupervisor}
            onDeleteSupervisor={handleDeleteSupervisor}
          />
        )
      case 'telegram':
        return (
          <TelegramSettings
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onTestTelegram={handleTestTelegram}
            onSendReport={handleSendReport}
            botStatus={botStatus}
            botToken={botToken}
            setBotToken={setBotToken}
            onStartBot={handleStartBot}
            onStopBot={handleStopBot}
            onRestartBot={handleRestartBot}
            onTestBotConnection={handleTestBotConnection}
            onEnableBot={handleEnableBot}
            isProcessing={isProcessing}
          />
        )
      case 'database':
        return (
          <DatabaseSettings
            isProcessing={isProcessing}
            onSync={handleSync}
            onImportDb={handleImportDb}
            onImportExcel={handleImportExcel}
          />
        )
      case 'cloud':
        return <CloudSettings />
      case 'maintenance':
        return (
          <MaintenanceSettings
            isProcessing={isProcessing}
            settings={settings}
            onValidate={handleValidate}
            onRecalculateAll={handleRecalculateAll}
            onRecalculateSingle={handleRecalculateSingle}
          />
        )
      case 'license':
        return (
          <LicenseSettings
            licenseInfo={licenseInfo}
            licenseKey={licenseKey}
            setLicenseKey={setLicenseKey}
            factoryName={factoryName}
            setFactoryName={setFactoryName}
            onActivate={handleActivate}
          />
        )
      case 'security':
        return (
          <SecuritySettings
            onChangePassword={async (old, newPass) => {
              const result = await window.api.auth.changePassword({
                oldPassword: old,
                newPassword: newPass
              })
              if (result.success) {
                toast.success(result.message)
              } else {
                toast.error(result.message)
              }
            }}
            onDeleteAllData={handleDeleteAllData}
          />
        )
      case 'support':
        return <SupportSettings />
      default:
        return <GeneralSettings formData={formData} setFormData={setFormData} onSave={handleSave} />
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 overflow-y-auto px-2">{renderSection()}</div>
    </div>
  )
}
