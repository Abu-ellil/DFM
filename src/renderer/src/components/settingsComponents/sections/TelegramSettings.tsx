import { Card } from '../../ui/Card'
import Bell from 'lucide-react/dist/esm/icons/bell'
import Save from 'lucide-react/dist/esm/icons/save'

interface TelegramSettingsProps {
  formData: any
  setFormData: (data: any) => void
  onSave: (key: string, value: string) => Promise<void>
  onTestTelegram: () => Promise<void>
  onSendReport: () => Promise<void>
  botStatus: any
  botToken: string
  setBotToken: (token: string) => void
  onStartBot: () => Promise<void>
  onStopBot: () => Promise<void>
  onRestartBot: () => Promise<void>
  onTestBotConnection: () => Promise<void>
  onEnableBot: (enabled: boolean) => Promise<void>
  isProcessing: boolean
}

export function TelegramSettings({
  formData,
  setFormData,
  onSave,
  onTestTelegram,
  onSendReport,
  botStatus,
  botToken,
  setBotToken,
  onStartBot,
  onStopBot,
  onRestartBot,
  onTestBotConnection,
  onEnableBot,
  isProcessing
}: TelegramSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Telegram Notifications */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Bell size={20} />
            <h3 className="font-bold">إشعارات تلجرام</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSendReport}
              disabled={isProcessing}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'جاري الإرسال...' : 'إرسال التقرير'}
            </button>
            <button
              onClick={onTestTelegram}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold hover:bg-blue-100 transition-colors"
            >
              تجربة الإرسال
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
              Telegram Bot Token
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.telegram_token}
                onChange={(e) => setFormData({ ...formData, telegram_token: e.target.value })}
              />
              <button
                onClick={() => onSave('telegram_token', formData.telegram_token)}
                className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors shrink-0"
              >
                <Save size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
              Chat ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.telegram_chat_id}
                onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
              />
              <button
                onClick={() => onSave('telegram_chat_id', formData.telegram_chat_id)}
                className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors shrink-0"
              >
                <Save size={20} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Telegram Bot Management */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 mb-4 text-blue-600">
          <Bell size={20} />
          <h3 className="font-bold">إدارة بوت تيليجرام</h3>
        </div>

        <div className="space-y-4">
          {/* Bot Status */}
          <div
            className={`p-4 rounded-lg border-2 ${
              botStatus?.isRunning
                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    botStatus?.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span className="font-bold text-sm">
                  {botStatus?.isRunning ? 'البوت يعمل' : 'البوت متوقف'}
                </span>
              </div>
              <button
                onClick={() => onEnableBot(!botStatus?.isRunning)}
                className={`text-xs px-4 py-2 rounded-full font-bold transition-colors ${
                  botStatus?.isRunning
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {botStatus?.isRunning ? 'إيقاف البوت' : 'تشغيل البوت'}
              </button>
            </div>
          </div>

          {/* Bot Token Test */}
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
              اختبار التوكن
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Telegram Bot Token"
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
              <button
                onClick={onTestBotConnection}
                className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shrink-0"
              >
                اختبار
              </button>
            </div>
          </div>

          {/* Bot Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={onStartBot}
              disabled={!formData.telegram_token}
              className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              تشغيل
            </button>
            <button
              onClick={onStopBot}
              disabled={!botStatus?.isRunning}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إيقاف
            </button>
            <button
              onClick={onRestartBot}
              disabled={!formData.telegram_token}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إعادة تشغيل
            </button>
          </div>

          {/* Bot Stats */}
          {botStatus?.notificationStats && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2 text-xs">
              <div className="font-bold text-slate-600 dark:text-slate-400 mb-2">
                إحصائيات الإشعارات
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">في الانتظار:</span>
                  <span className="font-bold">{botStatus.notificationStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تم الإرسال:</span>
                  <span className="font-bold text-emerald-600">
                    {botStatus.notificationStats.sent}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">فاشلة:</span>
                  <span className="font-bold text-red-500">
                    {botStatus.notificationStats.failed}
                  </span>
                </div>
              </div>
            </div>
          )}

          {botStatus?.registrationStats && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2 text-xs">
              <div className="font-bold text-slate-600 dark:text-slate-400 mb-2">
                إحصائيات التسجيل
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">قيد المراجعة:</span>
                  <span className="font-bold">{botStatus.registrationStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مقبولة:</span>
                  <span className="font-bold text-emerald-600">
                    {botStatus.registrationStats.approved}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مرفوضة:</span>
                  <span className="font-bold text-red-500">
                    {botStatus.registrationStats.rejected}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
