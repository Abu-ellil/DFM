/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { app, shell, BrowserWindow, ipcMain, dialog, autoUpdater } from 'electron'
import { join } from 'path'
import { writeFile, readFile } from 'fs/promises'
import * as XLSX from 'xlsx'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico?asset'
import { initializeDatabase, getDb, saveDatabase, getDbPath } from './db'
import { enqueueChange } from './sync/queue'
import bcrypt from 'bcryptjs'
import {
  generateReportData,
  generateReportSummary,
  generateExcelReport,
  generateJsonReport,
  sendReportToTelegram
} from './reports'
import {
  startTelegramBot,
  stopTelegramBot,
  restartTelegramBot,
  testBotConnection,
  getBotStats
} from './telegram'
import * as syncConflict from './sync/conflict'
import * as webAuth from './web-auth'

// Import license manager
import * as licenseManager from './license'
import * as sync from './sync'
import { getRegistrationHandler } from './telegram/handlers/registration'

// Auto-updater configuration
const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000 // Check every 4 hours
let updateCheckTimer: NodeJS.Timeout | null = null

let mainWindow: BrowserWindow | null = null
let windowShowTimeout: NodeJS.Timeout | null = null

// Logging utility for production debugging
function logToConsole(message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}`
  console.log(logMessage)
  if (data) {
    if (data instanceof Error) {
      console.log(`${data.name}: ${data.message}\n${data.stack}`)
    } else {
      try {
        console.log(JSON.stringify(data, null, 2))
      } catch {
        console.log(data)
      }
    }
  }
}

// Global error handling
process.on('uncaughtException', (error) => {
  logToConsole('UNCAUGHT EXCEPTION:', error)
  dialog.showErrorBox('حدث خطأ غير متوقع', error.message || 'خطأ غير معروف في العملية الرئيسية')
})

process.on('unhandledRejection', (reason, promise) => {
  logToConsole('UNHANDLED REJECTION:', reason)
  logToConsole('PROMISE:', promise)
})

type WeightSettings = { crateWeight: number; qantarWeight: number }

function getWeightSettings(db: any): WeightSettings {
  const settingsRes = db.exec(`
      SELECT value FROM settings
      WHERE key IN ('crate_weight', 'qantar_weight')
    `)

  const settings: Record<string, number> = {}
  if (settingsRes.length > 0) {
    settingsRes[0].values.forEach((row) => {
      const key = row[0]
      if (typeof key !== 'string') return
      const raw = row[1]
      const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw ?? 0))
      settings[key] = Number.isFinite(parsed) ? parsed : 0
    })
  }

  return {
    crateWeight: settings.crate_weight || 2,
    qantarWeight: settings.qantar_weight || 45
  }
}

// Configure auto-updater
function configureAutoUpdater(): void {
  // Only check for updates in production
  if (is.dev) {
    console.log('Auto-updater disabled in development')
    return
  }

  const owner = 'Abu-ellil'
  const repo = 'DFM-V2'

  autoUpdater.setFeedURL({
    owner: owner,
    repo: repo
  } as any)
  ;(autoUpdater as any).autoDownload = true
  ;(autoUpdater as any).autoInstallOnAppQuit = true

  // Auto-updater event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...')
    sendUpdateStatusToRenderer('checking', { message: 'جاري التحقق من التحديثات...' })
  })

  autoUpdater.on('update-available' as any, (info: any) => {
    console.log('Update available:', info)
    sendUpdateStatusToRenderer('available', {
      version: (info as any).version,
      releaseDate: (info as any).releaseDate,
      message: `يتوفر إصدار جديد ${(info as any).version}`
    })
  })

  autoUpdater.on('update-not-available' as any, (info: any) => {
    console.log('Update not available:', info)
    sendUpdateStatusToRenderer('not-available', {
      version: (info as any).version,
      message: 'أنت تستخدم أحدث إصدار'
    })
  })

  autoUpdater.on('error', (err: any) => {
    console.error('Update error:', err)
    sendUpdateStatusToRenderer('error', {
      message: 'حدث خطأ أثناء التحقق من التحديثات'
    })
  })

  autoUpdater.on('download-progress' as any, (progress: any) => {
    console.log('Download progress:', progress)
    sendUpdateStatusToRenderer('downloading', {
      percent: Math.floor(progress.percent),
      transferred: Math.floor(progress.transferred / 1024 / 1024),
      total: Math.floor(progress.total / 1024 / 1024),
      speed: Math.floor(progress.bytesPerSecond / 1024 / 1024),
      message: `جاري تحميل التحديث ${Math.floor(progress.percent)}%`
    })
  })

  autoUpdater.on('update-downloaded' as any, (info: any) => {
    console.log('Update downloaded:', info)
    sendUpdateStatusToRenderer('downloaded', {
      version: (info as any).version,
      message: `تم تحميل الإصدار ${(info as any).version}. سيتم التثبيت عند إغلاق التطبيق`,
      restartNow: true
    })
  })
}

// Send update status to renderer process
function sendUpdateStatusToRenderer(status: string, data: any = {}): void {
  if (mainWindow) {
    mainWindow.webContents.send('autoUpdater:event', { status, ...data })
  }
}

// Check for updates manually
async function checkForUpdates(): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    if (is.dev) {
      return { success: false, message: 'التحديثات غير متاحة في وضع التطوير' }
    }

    await autoUpdater.checkForUpdates()
    return { success: true, message: 'جاري التحقق من التحديثات...' }
  } catch (error: any) {
    console.error('Check for updates error:', error)
    return { success: false, message: error.message || 'فشل التحقق من التحديثات' }
  }
}

// Download and install update
async function downloadUpdate(): Promise<{ success: boolean; message?: string }> {
  try {
    if (is.dev) {
      return { success: false, message: 'التحديثات غير متاحة في وضع التطوير' }
    }

    await (autoUpdater as any).downloadUpdate()
    return { success: true, message: 'جاري تحميل التحديث...' }
  } catch (error: any) {
    console.error('Download update error:', error)
    return { success: false, message: error.message || 'فشل تحميل التحديث' }
  }
}

// Install update and restart
function installUpdateAndRestart(): void {
  if (is.dev) {
    return
  }
  autoUpdater.quitAndInstall()
}

// Start periodic update checks
function startPeriodicUpdateChecks(): void {
  if (is.dev || updateCheckTimer) {
    return
  }

  // Initial check after 30 seconds
  setTimeout(() => {
    checkForUpdates()
  }, 30000)

  // Then check every 4 hours
  updateCheckTimer = setInterval(() => {
    checkForUpdates()
  }, UPDATE_CHECK_INTERVAL)

  console.log('Periodic update checks started')
}

// Stop periodic update checks
function stopPeriodicUpdateChecks(): void {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer)
    updateCheckTimer = null
    console.log('Periodic update checks stopped')
  }
}

async function createWindow(): Promise<void> {
  logToConsole('Creating window...')
  // Configure auto-updater
  try {
    configureAutoUpdater()
  } catch (error) {
    logToConsole('Auto-updater configuration failed:', error)
  }

  // Initialize Database
  try {
    await initializeDatabase()
    logToConsole('Database initialized successfully')
  } catch (error: any) {
    logToConsole('Failed to initialize database:', error)
    dialog.showErrorBox(
      'خطأ في قاعدة البيانات',
      `فشل في تهيئة قاعدة البيانات: ${error.message || 'خطأ غير معروف'}`
    )
    // We continue anyway to at least show the window if possible
  }

  // Start Telegram bot if configured
  try {
    const botResult = await startTelegramBot()
    if (botResult.success) {
      logToConsole('Telegram bot started:', botResult.message)
    } else {
      logToConsole('Telegram bot not started:', botResult.message)
    }
  } catch (error) {
    logToConsole('Failed to start Telegram bot:', error)
  }

  try {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      autoHideMenuBar: true,
      icon: icon,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        plugins: true
      }
    })

    // Set up timeout to show window even if ready-to-show doesn't fire
    windowShowTimeout = setTimeout(() => {
      logToConsole('Window show timeout triggered, showing window anyway')
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show()
      }
    }, 10000) // 10 second timeout

    mainWindow.on('ready-to-show', () => {
      logToConsole('Window ready-to-show event fired')
      if (windowShowTimeout) {
        clearTimeout(windowShowTimeout)
        windowShowTimeout = null
      }
      if (mainWindow) {
        mainWindow.show()
      }
    })

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      logToConsole('Renderer failed to load:', { errorCode, errorDescription })
      // Don't show error box for every failure (some are benign), but log it
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      logToConsole('Loading dev URL:', process.env['ELECTRON_RENDERER_URL'])
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      const indexPath = join(__dirname, '../renderer/index.html')
      logToConsole('Loading production file:', indexPath)
      mainWindow.loadFile(indexPath).catch((err) => {
        logToConsole('Failed to load file:', err)
        dialog.showErrorBox(
          'خطأ في تحميل التطبيق',
          `فشل في تحميل ملفات واجهة المستخدم: ${err.message}`
        )
      })
    }
  } catch (error: any) {
    logToConsole('Error during window creation:', error)
    dialog.showErrorBox(
      'خطأ في إنشاء النافذة',
      error.message || 'حدث خطأ غير متوقع أثناء تشغيل التطبيق'
    )
  }
}

// IPC Handlers
ipcMain.handle('auth:login', async (_event, { username, password }) => {
  try {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?')
    stmt.bind([username])

    if (stmt.step()) {
      const user = stmt.getAsObject() as any
      stmt.free()

      const passwordMatch = bcrypt.compareSync(password, user.password)
      if (passwordMatch) {
        return { success: true, user: { id: user.id, username: user.username, role: user.role } }
      }
    } else {
      stmt.free()
    }

    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' }
  }
})

// Customers IPC
ipcMain.handle('customers:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec('SELECT * FROM customers ORDER BY name ASC')
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch (error) {
    console.error('Get customers error:', error)
    return []
  }
})

ipcMain.handle('customers:create', async (_event, customer) => {
  try {
    const db = getDb()
    const stmt = db.prepare('INSERT INTO customers (name, type, phone) VALUES (?, ?, ?)')
    stmt.bind([customer.name, customer.type, customer.phone])
    stmt.run()
    stmt.free()

    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'INSERT',
      table: 'customers',
      record_id: lastId,
      data: { ...customer, id: lastId, _client_id: null, _synced_at: null, _version: 1 },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    return { success: true }
  } catch (error) {
    console.error('Create customer error:', error)
    return { success: false, message: 'حدث خطأ أثناء إضافة العميل' }
  }
})

ipcMain.handle('customers:update', async (_event, id, customer) => {
  try {
    const db = getDb()
    const stmt = db.prepare('UPDATE customers SET name = ?, type = ?, phone = ? WHERE id = ?')
    stmt.bind([customer.name, customer.type, customer.phone, id])
    stmt.run()
    stmt.free()
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'UPDATE',
      table: 'customers',
      record_id: id,
      data: customer,
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    return { success: true }
  } catch (error) {
    console.error('Update customer error:', error)
    return { success: false, message: 'حدث خطأ أثناء تعديل العميل' }
  }
})

ipcMain.handle('customers:delete', async (_event, id) => {
  try {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?')
    stmt.bind([id])
    stmt.run()
    stmt.free()
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'DELETE',
      table: 'customers',
      record_id: id,
      data: { id },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    return { success: true }
  } catch (error) {
    console.error('Delete customer error:', error)
    return { success: false, message: 'حدث خطأ أثناء حذف العميل' }
  }
})

// Date Types & Crate Types IPC
ipcMain.handle('dateTypes:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec('SELECT * FROM date_types ORDER BY name ASC')
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch {
    return []
  }
})

ipcMain.handle('dateTypes:create', async (_event, name) => {
  try {
    const db = getDb()
    const stmt = db.prepare('INSERT INTO date_types (name) VALUES (?)')
    stmt.bind([name])
    stmt.run()
    stmt.free()
    await saveDatabase()
    return { success: true }
  } catch {
    return { success: false, message: 'فشل إضافة النوع' }
  }
})

ipcMain.handle('dateTypes:delete', async (_event, id) => {
  try {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM date_types WHERE id = ?')
    stmt.bind([id])
    stmt.run()
    stmt.free()
    await saveDatabase()
    return { success: true }
  } catch {
    return { success: false, message: 'فشل حذف النوع' }
  }
})

ipcMain.handle('crateTypes:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec('SELECT * FROM crate_types ORDER BY name ASC')
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch {
    return []
  }
})

ipcMain.handle('crateTypes:create', async (_event, { name, weight }) => {
  try {
    const db = getDb()
    const stmt = db.prepare('INSERT INTO crate_types (name, weight) VALUES (?, ?)')
    stmt.bind([name, weight])
    stmt.run()
    stmt.free()
    await saveDatabase()
    return { success: true }
  } catch {
    return { success: false, message: 'فشل إضافة نوع الصندوق' }
  }
})

ipcMain.handle('crateTypes:delete', async (_event, id) => {
  try {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM crate_types WHERE id = ?')
    stmt.bind([id])
    stmt.run()
    stmt.free()
    await saveDatabase()
    return { success: true }
  } catch {
    return { success: false, message: 'فشل حذف نوع الصندوق' }
  }
})

// Supervisors IPC
ipcMain.handle('supervisors:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec('SELECT * FROM supervisors ORDER BY name ASC')
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch {
    return []
  }
})

ipcMain.handle('supervisors:create', async (_event, name) => {
  try {
    const db = getDb()
    const stmt = db.prepare('INSERT INTO supervisors (name) VALUES (?)')
    stmt.bind([name])
    stmt.run()
    stmt.free()
    await saveDatabase()
    return { success: true }
  } catch {
    return { success: false, message: 'فشل إضافة المشرف' }
  }
})

ipcMain.handle('supervisors:delete', async (_event, id) => {
  try {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM supervisors WHERE id = ?')
    stmt.bind([id])
    stmt.run()
    stmt.free()
    await saveDatabase()
    return { success: true }
  } catch {
    return { success: false, message: 'فشل حذف المشرف' }
  }
})

// Weighbridge IPC
ipcMain.handle('weighbridge:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec(`
      SELECT w.*, c.name as customer_name, dt.name as date_type_name 
      FROM weighbridge w
      JOIN customers c ON w.customer_id = c.id
      LEFT JOIN date_types dt ON w.date_type_id = dt.id
      ORDER BY w.date DESC, w.id DESC
    `)
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch (error) {
    console.error('Get weighbridge error:', error)
    return []
  }
})

ipcMain.handle('weighbridge:create', async (_event, data) => {
  try {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO weighbridge (date, customer_id, date_type_id, gross_weight, net_weight, price_per_qantar, total, crates_count, commission, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.bind([
      data.date,
      data.customer_id,
      data.date_type_id,
      data.gross_weight,
      data.net_weight,
      data.price_per_qantar,
      data.total,
      data.crates_count,
      data.commission,
      data.notes
    ])
    stmt.run()
    stmt.free()

    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'INSERT',
      table: 'weighbridge',
      record_id: lastId,
      data: { ...data, id: lastId },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    // Send customer account update notification
    mainWindow?.webContents.send('customerAccounts:updated', { customerId: data.customer_id })

    return { success: true }
  } catch (error) {
    console.error('Create weighbridge error:', error)
    return { success: false, message: 'حدث خطأ أثناء إضافة عملية الميزان' }
  }
})

ipcMain.handle('weighbridge:validateCalculations', async () => {
  try {
    const db = getDb()

    const { crateWeight, qantarWeight } = getWeightSettings(db)
    const tolerance = 0.1

    const res = db.exec(`
      SELECT
        w.id,
        w.date,
        w.gross_weight,
        w.net_weight,
        w.price_per_qantar,
        w.total,
        w.crates_count,
        c.name as customer_name
      FROM weighbridge w
      JOIN customers c ON w.customer_id = c.id
      ORDER BY w.date DESC
    `)

    if (res.length === 0) {
      return {
        success: true,
        total: 0,
        valid: 0,
        errors: 0,
        details: []
      }
    }

    const columns = res[0].columns
    const transactions = res[0].values.map((row) => {
      const obj: Record<string, any> = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })

    const errors: Array<{
      id: number
      customer_name: string
      date: string
      net_weight_error: {
        current: number
        expected: number
        diff: number
      } | null
      total_error: {
        current: number
        expected: number
        diff: number
      } | null
    }> = []

    for (const t of transactions) {
      const expectedNetWeight = Math.max(0, t.gross_weight - t.crates_count * crateWeight)
      const netWeightDiff = Math.abs(t.net_weight - expectedNetWeight)

      const expectedTotal = (t.net_weight / qantarWeight) * t.price_per_qantar
      const totalDiff = Math.abs(t.total - expectedTotal)

      const netWeightError =
        netWeightDiff > tolerance
          ? {
              current: Number(t.net_weight),
              expected: Number(expectedNetWeight.toFixed(2)),
              diff: Number(netWeightDiff.toFixed(2))
            }
          : null

      const totalError =
        totalDiff > tolerance
          ? {
              current: Number(t.total),
              expected: Number(expectedTotal.toFixed(2)),
              diff: Number(totalDiff.toFixed(2))
            }
          : null

      if (netWeightError || totalError) {
        errors.push({
          id: t.id,
          customer_name: t.customer_name,
          date: t.date,
          net_weight_error: netWeightError,
          total_error: totalError
        })
      }
    }

    return {
      success: true,
      total: transactions.length,
      valid: transactions.length - errors.length,
      errors: errors.length,
      details: errors
    }
  } catch (error) {
    console.error('Validate calculations error:', error)
    return { success: false, error: 'فشل التحقق من الحسابات' }
  }
})

ipcMain.handle('weighbridge:recalculateAll', async () => {
  try {
    const db = getDb()

    const { crateWeight, qantarWeight } = getWeightSettings(db)

    const timestamp = new Date().toISOString().split('T')[0]
    const dbPath = getDbPath()
    const backupPath = dbPath.replace('.sqlite', `-backup-${timestamp}.sqlite`)

    const data = db.export()
    await writeFile(backupPath, Buffer.from(data))

    const res = db.exec('SELECT * FROM weighbridge')

    if (res.length === 0 || res[0].values.length === 0) {
      return { success: true, message: 'لا توجد عمليات لإعادة حسابها', updated: 0 }
    }

    const columns = res[0].columns
    const transactions = res[0].values.map((row) => {
      const obj: Record<string, any> = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })

    let updatedCount = 0

    const updateStmt = db.prepare(`
      UPDATE weighbridge
      SET net_weight = ?, total = ?, _synced_at = NULL
      WHERE id = ?
    `)

    for (const t of transactions) {
      const newNetWeight = Math.max(0, t.gross_weight - t.crates_count * crateWeight)
      const newTotal = (newNetWeight / qantarWeight) * t.price_per_qantar

      updateStmt.bind([Number(newNetWeight.toFixed(2)), Number(newTotal.toFixed(2)), t.id])
      updateStmt.run()
      updatedCount++
    }
    updateStmt.free()

    await saveDatabase()

    mainWindow?.webContents.send('customerAccounts:updated', { customerId: null })

    return {
      success: true,
      message: `تم إعادة حساب ${updatedCount} عملية بنجاح`,
      backupPath,
      updated: updatedCount
    }
  } catch (error: any) {
    console.error('Recalculate all error:', error)
    return { success: false, message: error.message || 'فشل إعادة حساب العمليات' }
  }
})

ipcMain.handle('weighbridge:recalculateSingle', async (_event, id: number) => {
  try {
    const db = getDb()

    const { crateWeight, qantarWeight } = getWeightSettings(db)

    const res = db.exec('SELECT * FROM weighbridge WHERE id = ?', [id])

    if (res.length === 0 || res[0].values.length === 0) {
      return { success: false, message: 'العملية غير موجودة' }
    }

    const columns = res[0].columns
    const transaction: Record<string, any> = {}
    columns.forEach((col, i) => (transaction[col] = res[0].values[0][i]))

    const newNetWeight = Math.max(
      0,
      transaction.gross_weight - transaction.crates_count * crateWeight
    )
    const newTotal = (newNetWeight / qantarWeight) * transaction.price_per_qantar

    const updateStmt = db.prepare(`
      UPDATE weighbridge
      SET net_weight = ?, total = ?, _synced_at = NULL
      WHERE id = ?
    `)
    updateStmt.bind([Number(newNetWeight.toFixed(2)), Number(newTotal.toFixed(2)), id])
    updateStmt.run()
    updateStmt.free()

    await saveDatabase()

    mainWindow?.webContents.send('customerAccounts:updated', {
      customerId: transaction.customer_id
    })

    return { success: true, message: 'تم إعادة حساب العملية بنجاح' }
  } catch (error: any) {
    console.error('Recalculate single error:', error)
    return { success: false, message: error.message || 'فشل إعادة حساب العملية' }
  }
})

// Crates IPC
ipcMain.handle('crates:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec(`
      SELECT cr.*, c.name as customer_name, ct.name as crate_type_name
      FROM crates cr
      JOIN customers c ON cr.customer_id = c.id
      LEFT JOIN crate_types ct ON cr.crate_type_id = ct.id
      ORDER BY cr.date DESC, cr.id DESC
    `)
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch (error) {
    console.error('Get crates error:', error)
    return []
  }
})

ipcMain.handle('crates:getSummary', async () => {
  try {
    const db = getDb()
    const res = db.exec(`
      SELECT 
        cr.customer_id,
        c.name as customer_name,
        SUM(cr.crates_out) as total_out,
        SUM(cr.crates_returned) as total_returned,
        (SUM(cr.crates_out) - SUM(cr.crates_returned)) as balance
      FROM crates cr
      JOIN customers c ON cr.customer_id = c.id
      GROUP BY cr.customer_id
      HAVING balance > 0
    `)
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch (error) {
    console.error('Get crates summary error:', error)
    return []
  }
})

ipcMain.handle('crates:create', async (_event, data) => {
  try {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO crates (date, customer_id, crate_type_id, crates_out, crates_returned, handler, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.bind([
      data.date,
      data.customer_id,
      data.crate_type_id,
      data.crates_out,
      data.crates_returned,
      data.handler,
      data.notes
    ])
    stmt.run()
    stmt.free()

    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'INSERT',
      table: 'crates',
      record_id: lastId,
      data: { ...data, id: lastId },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    // Send customer account update notification
    mainWindow?.webContents.send('customerAccounts:updated', { customerId: data.customer_id })

    return { success: true }
  } catch (error) {
    console.error('Create crate transaction error:', error)
    return { success: false, message: 'حدث خطأ أثناء إضافة عملية الصناديق' }
  }
})

ipcMain.handle('crates:update', async (_event, id, data) => {
  try {
    const db = getDb()
    const stmt = db.prepare(`
      UPDATE crates
      SET date = ?, customer_id = ?, crate_type_id = ?, crates_out = ?, crates_returned = ?, handler = ?, notes = ?
      WHERE id = ?
    `)
    stmt.bind([
      data.date,
      data.customer_id,
      data.crate_type_id,
      data.crates_out,
      data.crates_returned,
      data.handler,
      data.notes,
      id
    ])
    stmt.run()
    stmt.free()
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'UPDATE',
      table: 'crates',
      record_id: id,
      data: data,
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    // Send customer account update notification
    mainWindow?.webContents.send('customerAccounts:updated', { customerId: data.customer_id })

    return { success: true }
  } catch (error) {
    console.error('Update crate transaction error:', error)
    return { success: false, message: 'حدث خطأ أثناء تحديث عملية الصناديق' }
  }
})

ipcMain.handle('crates:delete', async (_event, id) => {
  try {
    const db = getDb()

    // Get customer_id before deleting
    const getStmt = db.prepare('SELECT customer_id FROM crates WHERE id = ?')
    getStmt.bind([id])
    let customerId: number | null = null
    if (getStmt.step()) {
      customerId = getStmt.getAsObject().customer_id as number
    }
    getStmt.free()

    const stmt = db.prepare('DELETE FROM crates WHERE id = ?')
    stmt.bind([id])
    stmt.run()
    stmt.free()
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'DELETE',
      table: 'crates',
      record_id: id,
      data: { id },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    // Send customer account update notification
    if (customerId) {
      mainWindow?.webContents.send('customerAccounts:updated', { customerId })
    }

    return { success: true }
  } catch (error) {
    console.error('Delete crate transaction error:', error)
    return { success: false, message: 'حدث خطأ أثناء حذف عملية الصناديق' }
  }
})

// Finance IPC
ipcMain.handle('finance:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec(`
      SELECT f.*, c.name as customer_name
      FROM finance f
      JOIN customers c ON f.customer_id = c.id
      ORDER BY f.date DESC, f.id DESC
    `)
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch (error) {
    console.error('Get finance error:', error)
    return []
  }
})

ipcMain.handle('finance:getSummary', async () => {
  try {
    const db = getDb()
    const res = db.exec(`
      SELECT 
        f.customer_id,
        c.name as customer_name,
        COALESCE(SUM(f.amount_paid), 0) as total_paid,
        COALESCE(SUM(f.amount_received), 0) as total_received,
        COALESCE((SELECT SUM(total) FROM weighbridge WHERE customer_id = f.customer_id), 0) as total_weighbridge_debt,
        (
          COALESCE(SUM(f.amount_received), 0) +
          COALESCE((SELECT SUM(total) FROM weighbridge WHERE customer_id = f.customer_id), 0) -
          COALESCE(SUM(f.amount_paid), 0)
        ) as net_balance
      FROM finance f
      JOIN customers c ON f.customer_id = c.id
      GROUP BY f.customer_id
    `)
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj: any = {}
      columns.forEach((col, i) => {
        const value = row[i]
        if (
          ['total_paid', 'total_received', 'total_weighbridge_debt', 'net_balance'].includes(col)
        ) {
          obj[col] = Number(value) || 0
        } else {
          obj[col] = value
        }
      })
      return obj
    })
  } catch (error) {
    console.error('Get finance summary error:', error)
    return []
  }
})

ipcMain.handle('finance:create', async (_event, data) => {
  try {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO finance (date, customer_id, transaction_type, amount_paid, amount_received, notes, payment_method, receipt_file, receipt_reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.bind([
      data.date,
      data.customer_id,
      data.transaction_type,
      data.amount_paid,
      data.amount_received,
      data.notes,
      data.payment_method || 'نقدا',
      data.receipt_file || null,
      data.receipt_reference || null
    ])
    stmt.run()
    stmt.free()

    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'INSERT',
      table: 'finance',
      record_id: lastId,
      data: { ...data, id: lastId },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    // Send customer account update notification
    mainWindow?.webContents.send('customerAccounts:updated', { customerId: data.customer_id })

    return { success: true }
  } catch (error) {
    console.error('Create finance transaction error:', error)
    return { success: false, message: 'حدث خطأ أثناء إضافة العملية المالية' }
  }
})

ipcMain.handle('finance:update', async (_event, id, data) => {
  try {
    const db = getDb()
    const stmt = db.prepare(`
      UPDATE finance
      SET date = ?, customer_id = ?, transaction_type = ?, amount_paid = ?, amount_received = ?, notes = ?, payment_method = ?, receipt_file = ?, receipt_reference = ?
      WHERE id = ?
    `)
    stmt.bind([
      data.date,
      data.customer_id,
      data.transaction_type,
      data.amount_paid,
      data.amount_received,
      data.notes,
      data.payment_method || 'نقدا',
      data.receipt_file || null,
      data.receipt_reference || null,
      id
    ])
    stmt.run()
    stmt.free()
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'UPDATE',
      table: 'finance',
      record_id: id,
      data: data,
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    // Send customer account update notification
    mainWindow?.webContents.send('customerAccounts:updated', { customerId: data.customer_id })

    return { success: true }
  } catch (error) {
    console.error('Update finance transaction error:', error)
    return { success: false, message: 'حدث خطأ أثناء تحديث العملية المالية' }
  }
})

ipcMain.handle('finance:delete', async (_event, id) => {
  try {
    const db = getDb()

    // Get customer_id before deleting
    const getStmt = db.prepare('SELECT customer_id FROM finance WHERE id = ?')
    getStmt.bind([id])
    let customerId: number | null = null
    if (getStmt.step()) {
      customerId = getStmt.getAsObject().customer_id as number
    }
    getStmt.free()

    const stmt = db.prepare('DELETE FROM finance WHERE id = ?')
    stmt.bind([id])
    stmt.run()
    stmt.free()
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'DELETE',
      table: 'finance',
      record_id: id,
      data: { id },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    // Send customer account update notification
    if (customerId) {
      mainWindow?.webContents.send('customerAccounts:updated', { customerId })
    }

    return { success: true }
  } catch (error) {
    console.error('Delete finance transaction error:', error)
    return { success: false, message: 'حدث خطأ أثناء حذف العملية المالية' }
  }
})

// Customer Accounts IPC
ipcMain.handle('customerAccounts:getSummary', async (_event, customerId?) => {
  try {
    const db = getDb()

    // For a single customer, return detailed summary
    if (customerId) {
      const stmt = db.prepare(`
        SELECT
          c.id as customer_id,
          c.name as customer_name,
          c.type,
          c.phone,
          COALESCE((SELECT SUM(total) FROM weighbridge WHERE customer_id = c.id), 0) as total_weighbridge_debt,
          (SELECT COUNT(*) FROM weighbridge WHERE customer_id = c.id) as weighbridge_transaction_count,
          COALESCE((SELECT SUM(net_weight) FROM weighbridge WHERE customer_id = c.id), 0) as total_net_weight,
          COALESCE((SELECT SUM(amount_paid) FROM finance WHERE customer_id = c.id), 0) as total_paid,
          COALESCE((SELECT SUM(amount_received) FROM finance WHERE customer_id = c.id), 0) as total_received,
          COALESCE((SELECT SUM(crates_out) FROM crates WHERE customer_id = c.id), 0) as total_crates_out,
          COALESCE((SELECT SUM(crates_returned) FROM crates WHERE customer_id = c.id), 0) as total_crates_returned,
          (
            COALESCE((SELECT SUM(amount_paid) FROM finance WHERE customer_id = c.id), 0) +
            COALESCE((SELECT SUM(total) FROM weighbridge WHERE customer_id = c.id), 0) -
            COALESCE((SELECT SUM(amount_received) FROM finance WHERE customer_id = c.id), 0)
          ) as net_balance,
          (
            COALESCE((SELECT SUM(crates_out) FROM crates WHERE customer_id = c.id), 0) -
            COALESCE((SELECT SUM(crates_returned) FROM crates WHERE customer_id = c.id), 0)
          ) as crate_balance
        FROM customers c
        WHERE c.id = ?
      `)
      stmt.bind([customerId])
      const result = stmt.getAsObject() as any
      stmt.free()

      // Convert numbers from strings to actual numbers
      if (result) {
        result.total_weighbridge_debt = Number(result.total_weighbridge_debt) || 0
        result.weighbridge_transaction_count = Number(result.weighbridge_transaction_count) || 0
        result.total_net_weight = Number(result.total_net_weight) || 0
        result.total_paid = Number(result.total_paid) || 0
        result.total_received = Number(result.total_received) || 0
        result.total_crates_out = Number(result.total_crates_out) || 0
        result.total_crates_returned = Number(result.total_crates_returned) || 0
        result.net_balance = Number(result.net_balance) || 0
        result.crate_balance = Number(result.crate_balance) || 0
      }

      return result
    }

    // For all customers
    const res = db.exec(`
      SELECT
        c.id as customer_id,
        c.name as customer_name,
        c.type,
        c.phone,
        COALESCE((SELECT SUM(total) FROM weighbridge WHERE customer_id = c.id), 0) as total_weighbridge_debt,
        (SELECT COUNT(*) FROM weighbridge WHERE customer_id = c.id) as weighbridge_transaction_count,
        COALESCE((SELECT SUM(net_weight) FROM weighbridge WHERE customer_id = c.id), 0) as total_net_weight,
        COALESCE((SELECT SUM(amount_paid) FROM finance WHERE customer_id = c.id), 0) as total_paid,
        COALESCE((SELECT SUM(amount_received) FROM finance WHERE customer_id = c.id), 0) as total_received,
        COALESCE((SELECT SUM(crates_out) FROM crates WHERE customer_id = c.id), 0) as total_crates_out,
        COALESCE((SELECT SUM(crates_returned) FROM crates WHERE customer_id = c.id), 0) as total_crates_returned,
        (
          COALESCE((SELECT SUM(amount_paid) FROM finance WHERE customer_id = c.id), 0) +
          COALESCE((SELECT SUM(total) FROM weighbridge WHERE customer_id = c.id), 0) -
          COALESCE((SELECT SUM(amount_received) FROM finance WHERE customer_id = c.id), 0)
        ) as net_balance,
        (
          COALESCE((SELECT SUM(crates_out) FROM crates WHERE customer_id = c.id), 0) -
          COALESCE((SELECT SUM(crates_returned) FROM crates WHERE customer_id = c.id), 0)
        ) as crate_balance
      FROM customers c
      ORDER BY c.name ASC
    `)

    if (res.length === 0) return []

    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj: any = {}
      columns.forEach((col, i) => {
        // Convert numeric strings to numbers
        const value = row[i]
        if (
          [
            'total_weighbridge_debt',
            'weighbridge_transaction_count',
            'total_net_weight',
            'total_paid',
            'total_received',
            'total_crates_out',
            'total_crates_returned',
            'net_balance',
            'crate_balance'
          ].includes(col)
        ) {
          obj[col] = Number(value) || 0
        } else {
          obj[col] = value
        }
      })
      return obj
    })
  } catch (error) {
    console.error('Get customer accounts summary error:', error)
    return customerId ? null : []
  }
})

ipcMain.handle(
  'customerAccounts:getRecentTransactions',
  async (_event, customerId: number, limit: number = 20) => {
    try {
      const db = getDb()
      const transactions: any[] = []

      // Get weighbridge transactions
      const weighbridgeStmt = db.prepare(`
      SELECT 'weighbridge' as type, id, date, customer_id, total as amount, notes, created_at
      FROM weighbridge
      WHERE customer_id = ?
      ORDER BY date DESC, id DESC
      LIMIT ?
    `)
      weighbridgeStmt.bind([customerId, limit])
      while (weighbridgeStmt.step()) {
        transactions.push(weighbridgeStmt.getAsObject())
      }
      weighbridgeStmt.free()

      // Get finance transactions
      const financeStmt = db.prepare(`
      SELECT 'finance' as type, id, date, customer_id,
             CASE
               WHEN amount_paid > 0 THEN amount_paid
               ELSE -amount_received
             END as amount,
             transaction_type as notes, created_at
      FROM finance
      WHERE customer_id = ?
      ORDER BY date DESC, id DESC
      LIMIT ?
    `)
      financeStmt.bind([customerId, limit])
      while (financeStmt.step()) {
        transactions.push(financeStmt.getAsObject())
      }
      financeStmt.free()

      // Get crates transactions
      const cratesStmt = db.prepare(`
      SELECT 'crates' as type, id, date, customer_id,
             (crates_out - crates_returned) as amount,
             handler || ' - ' || notes as notes, created_at
      FROM crates
      WHERE customer_id = ?
      ORDER BY date DESC, id DESC
      LIMIT ?
    `)
      cratesStmt.bind([customerId, limit])
      while (cratesStmt.step()) {
        transactions.push(cratesStmt.getAsObject())
      }
      cratesStmt.free()

      // Sort all by date descending
      transactions.sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
        if (dateCompare !== 0) return dateCompare
        return b.id - a.id
      })

      return transactions.slice(0, limit)
    } catch (error) {
      console.error('Get recent transactions error:', error)
      return []
    }
  }
)

// Security IPC
ipcMain.handle('auth:setWebPassword', async (_event, { phone, password }) => {
  try {
    const result = await webAuth.updateWebPassword({ phone, newPassword: password })

    if (result.success) {
      return { success: true, message: 'تم تحديث كلمة مرور الويب بنجاح' }
    } else {
      return { success: false, message: result.error || 'فشل تحديث كلمة المرور' }
    }
  } catch (error: any) {
    console.error('Set web password error:', error)
    return { success: false, message: 'حدث خطأ أثناء تحديث كلمة المرور' }
  }
})

ipcMain.handle('auth:getWebUserStatus', async () => {
  try {
    const registered = webAuth.isWebUserRegistered()
    const user = webAuth.getWebUser()
    return { success: true, registered, user }
  } catch (error: any) {
    console.error('Get web user status error:', error)
    return { success: false, registered: false }
  }
})

// Cloud Account IPC Handlers
ipcMain.handle('cloudAccount:register', async (_event, { phone, password, factoryName }) => {
  try {
    const result = await webAuth.registerWebUser({
      phone,
      password,
      factory_name: factoryName
    })

    if (result.success) {
      // Enable sync after successful registration
      sync.enableSync()
      return { success: true, message: 'تم إنشاء الحساب وتفعيل المزامنة بنجاح' }
    } else {
      return { success: false, message: result.error || 'فشل إنشاء الحساب' }
    }
  } catch (error: any) {
    console.error('Cloud account register error:', error)
    return { success: false, message: error.message || 'حدث خطأ أثناء إنشاء الحساب' }
  }
})

ipcMain.handle('cloudAccount:login', async (_event, { phone, password }) => {
  try {
    const result = await webAuth.loginWebUser({ phone, password })

    if (result.success) {
      // Enable sync after successful login
      sync.enableSync()
      return { success: true, message: 'تم تسجيل الدخول بنجاح', user: result.user }
    } else {
      return { success: false, message: result.error || 'فشل تسجيل الدخول' }
    }
  } catch (error: any) {
    console.error('Cloud account login error:', error)
    return { success: false, message: error.message || 'حدث خطأ أثناء تسجيل الدخول' }
  }
})

ipcMain.handle('cloudAccount:restore', async (_event, { phone, password }) => {
  try {
    const result = await webAuth.restoreUserData({ phone, password })

    if (result.success) {
      return { success: true, message: result.message || 'تم استعادة البيانات بنجاح' }
    } else {
      return { success: false, message: result.error || 'فشل استعادة البيانات' }
    }
  } catch (error: any) {
    console.error('Cloud account restore error:', error)
    return { success: false, message: error.message || 'حدث خطأ أثناء استعادة البيانات' }
  }
})

ipcMain.handle('cloudAccount:getStatus', async () => {
  try {
    const status = webAuth.getCloudAccountStatus()
    return { success: true, ...status }
  } catch (error: any) {
    console.error('Get cloud account status error:', error)
    return { success: false, isRegistered: false }
  }
})

ipcMain.handle('auth:changePassword', async (_event, { oldPassword, newPassword }) => {
  try {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM users WHERE username = 'admin'")
    if (stmt.step()) {
      const user = stmt.getAsObject() as any
      stmt.free()

      const passwordMatch = bcrypt.compareSync(oldPassword, user.password)
      if (!passwordMatch) {
        return { success: false, message: 'كلمة المرور القديمة غير صحيحة' }
      }

      const salt = bcrypt.genSaltSync(10)
      const hash = bcrypt.hashSync(newPassword, salt)
      const updateStmt = db.prepare("UPDATE users SET password = ? WHERE username = 'admin'")
      updateStmt.bind([hash])
      updateStmt.run()
      updateStmt.free()
      await saveDatabase()
      return { success: true, message: 'تم تغيير كلمة المرور بنجاح' }
    }
    stmt.free()
    return { success: false, message: 'لم يتم العثور على حساب المشرف' }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور' }
  }
})

ipcMain.handle('settings:deleteAllData', async () => {
  try {
    const db = getDb()
    // List of tables to clear
    const tables = [
      'weighbridge',
      'crates',
      'finance',
      'customers',
      'date_types',
      'crate_types',
      'supervisors',
      'daily_prices'
    ]

    db.run('BEGIN TRANSACTION')
    try {
      for (const table of tables) {
        const stmt = db.prepare(`DELETE FROM ${table}`)
        stmt.run()
        stmt.free()
      }
      db.run('COMMIT')
    } catch (err) {
      db.run('ROLLBACK')
      throw err
    }

    await saveDatabase()
    return { success: true, message: 'تم حذف كافة البيانات بنجاح' }
  } catch (error: any) {
    console.error('Delete all data error:', error)
    return { success: false, message: error.message || 'حدث خطأ أثناء حذف البيانات' }
  }
})

// Settings IPC
ipcMain.handle('settings:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec('SELECT * FROM settings')
    if (res.length === 0) return {}
    const settings = {}
    res[0].values.forEach((row) => {
      settings[row[0] as string] = row[1]
    })
    return settings
  } catch (error) {
    console.error('Get settings error:', error)
    return {}
  }
})

ipcMain.handle('settings:update', async (_event, key, value) => {
  try {
    const db = getDb()
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    stmt.bind([key, value])
    stmt.run()
    stmt.free()
    await saveDatabase()
    return { success: true }
  } catch (error) {
    console.error('Update settings error:', error)
    return { success: false }
  }
})

ipcMain.handle('settings:sync', async () => {
  try {
    const db = getDb()
    const data = db.export()

    if (!mainWindow) {
      throw new Error('Main window not found')
    }

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ نسخة احتياطية',
      defaultPath: `backup-${new Date().toISOString().split('T')[0]}.sqlite`,
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
    })

    if (filePath) {
      await writeFile(filePath, Buffer.from(data))
      return { success: true }
    }
    return { success: false }
  } catch (error: any) {
    console.error('Sync error:', error)
    // Rethrow to be caught by renderer's catch block, or return success: false
    // Given the renderer handles both, let's return a clear error
    return { success: false, message: error.message || 'حدث خطأ أثناء التصدير' }
  }
})

ipcMain.handle('settings:importDb', async () => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not found')
    }

    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'اختر ملف قاعدة البيانات للاستيراد',
      filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
      properties: ['openFile']
    })

    if (filePaths && filePaths.length > 0) {
      const data = await readFile(filePaths[0])

      // Get the correct database path
      const dbPath = getDbPath()

      // Write the new database file
      await writeFile(dbPath, data)

      // Re-initialize the DB
      await initializeDatabase(true)

      return { success: true, message: 'تم استيراد قاعدة البيانات بنجاح' }
    }
    return { success: false }
  } catch (error: any) {
    console.error('Import DB error:', error)
    return { success: false, message: error.message || 'فشل استيراد قاعدة البيانات' }
  }
})

ipcMain.handle('settings:importExcel', async () => {
  try {
    console.log('Main: Starting Excel import dialog...')

    if (!mainWindow) {
      throw new Error('Main window not found')
    }

    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'اختر ملف Excel للاستيراد',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }],
      properties: ['openFile']
    })

    if (filePaths && filePaths.length > 0) {
      console.log('Main: File selected:', filePaths[0])
      const buffer = await readFile(filePaths[0])
      const workbook = XLSX.read(buffer, { type: 'buffer' })

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return { success: false, message: 'الملف لا يحتوي على أوراق عمل' }
      }

      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[]

      if (data.length === 0) {
        console.log('Main: Excel file is empty')
        return { success: false, message: 'الملف فارغ أو غير صالح' }
      }

      const db = getDb()
      let importedCount = 0

      console.log('Main: Starting row processing...')

      // Start transaction for better performance
      const beginStmt = db.prepare('BEGIN TRANSACTION')
      beginStmt.run()
      beginStmt.free()

      try {
        for (const row of data) {
          // Normalize column names (support Arabic and English)
          const name = (
            row['الاسم'] ||
            row['اسم العميل'] ||
            row['Name'] ||
            row['name'] ||
            row['customer_name'] ||
            ''
          )
            .toString()
            .trim()
          const type = (row['النوع'] || row['نوع العميل'] || row['Type'] || row['type'] || 'مورد')
            .toString()
            .trim()
          const phone = (
            row['الهاتف'] ||
            row['رقم الهاتف'] ||
            row['تلفون'] ||
            row['Phone'] ||
            row['phone'] ||
            ''
          )
            .toString()
            .trim()

          if (name) {
            const stmt = db.prepare(
              'INSERT OR IGNORE INTO customers (name, type, phone) VALUES (?, ?, ?)'
            )
            stmt.bind([name, type, phone])
            stmt.run()
            stmt.free()
            importedCount++
          }
        }
        const commitStmt = db.prepare('COMMIT')
        commitStmt.run()
        commitStmt.free()
      } catch (transactionError) {
        const rollbackStmt = db.prepare('ROLLBACK')
        rollbackStmt.run()
        rollbackStmt.free()
        throw transactionError
      }

      await saveDatabase()
      console.log(`Main: Successfully imported ${importedCount} customers`)

      // Send bulk update notification
      mainWindow?.webContents.send('customerAccounts:bulkUpdate', {
        count: importedCount,
        timestamp: Date.now()
      })

      return { success: true, message: `تم استيراد ${importedCount} عميل بنجاح` }
    }
    console.log('Main: Import cancelled by user')
    return { success: false }
  } catch (error: any) {
    console.error('Main: Import Excel error:', error)
    return { success: false, message: `فشل استيراد ملف Excel: ${error.message || 'خطأ غير معروف'}` }
  }
})

ipcMain.handle('reports:exportExcel', async (_event, { title, data }) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not found')
    }

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'تصدير إلى Excel',
      defaultPath: `${title}-${new Date().toISOString().split('T')[0]}.xlsx`,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })

    if (filePath) {
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      await writeFile(filePath, buffer)
      return { success: true }
    }
    return { success: false }
  } catch (error: any) {
    console.error('Export Excel error:', error)
    return { success: false, message: error.message || 'فشل التصدير إلى Excel' }
  }
})

// Sales Products IPC
ipcMain.handle('salesProducts:getAll', async () => {
  try {
    const db = getDb()
    if (!db) return []
    const res = db.exec('SELECT * FROM sales_products ORDER BY name ASC')
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch {
    return []
  }
})

ipcMain.handle('salesProducts:create', async (_event, { name, unit_type, weight_per_unit }) => {
  try {
    const db = getDb()
    if (!db) {
      return { success: false, message: 'خطأ في الاتصال بالقاعدة - يرجى المحاولة مرة أخرى' }
    }
    const stmt = db.prepare(
      'INSERT INTO sales_products (name, unit_type, weight_per_unit) VALUES (?, ?, ?)'
    )
    stmt.bind([name, unit_type, weight_per_unit])
    stmt.run()
    stmt.free()
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number
    await saveDatabase()

    await enqueueChange({
      operation: 'INSERT',
      table: 'sales_products',
      record_id: lastId,
      data: {
        ...{ name, unit_type, weight_per_unit },
        id: lastId,
        _client_id: null,
        _synced_at: null,
        _version: 1
      },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    return { success: true }
  } catch {
    return { success: false, message: 'فشل إضافة المنتج' }
  }
})

ipcMain.handle('salesProducts:update', async (_event, id, data) => {
  try {
    const db = getDb()
    if (!db) {
      return { success: false, message: 'خطأ في الاتصال بالقاعدة - يرجى المحاولة مرة أخرى' }
    }
    const stmt = db.prepare(
      'UPDATE sales_products SET name = ?, unit_type = ?, weight_per_unit = ? WHERE id = ?'
    )
    stmt.bind([data.name, data.unit_type, data.weight_per_unit, id])
    stmt.run()
    stmt.free()
    await saveDatabase()

    await enqueueChange({
      operation: 'UPDATE',
      table: 'sales_products',
      record_id: id,
      data: data,
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    return { success: true }
  } catch {
    return { success: false, message: 'فشل تعديل المنتج' }
  }
})

ipcMain.handle('salesProducts:delete', async (_event, id) => {
  try {
    const db = getDb()
    if (!db) {
      return { success: false, message: 'خطأ في الاتصال بالقاعدة - يرجى المحاولة مرة أخرى' }
    }
    const stmt = db.prepare('DELETE FROM sales_products WHERE id = ?')
    stmt.bind([id])
    stmt.run()
    stmt.free()
    await saveDatabase()

    await enqueueChange({
      operation: 'DELETE',
      table: 'sales_products',
      record_id: id,
      data: { id },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    return { success: true }
  } catch {
    return { success: false, message: 'فشل حذف المنتج' }
  }
})

// Sales Invoices IPC
ipcMain.handle('salesInvoices:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec(`
      SELECT si.*, 
        COUNT(DISTINCT sit.id) as items_count
      FROM sales_invoices si
      LEFT JOIN sales_items sit ON si.id = sit.invoice_id
      GROUP BY si.id
      ORDER BY si.date DESC, si.id DESC
    `)
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch {
    return []
  }
})

ipcMain.handle('salesInvoices:getById', async (_event, id: number) => {
  try {
    const db = getDb()
    const res = db.exec('SELECT * FROM sales_invoices WHERE id = ?', [id])
    if (res.length === 0) return null
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj: Record<string, any> = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })[0]
  } catch {
    return null
  }
})

ipcMain.handle('salesInvoices:getItems', async (_event, invoiceId) => {
  try {
    const db = getDb()
    const res = db.exec(
      `
      SELECT si.*, sp.name as product_name, sp.unit_type, sp.weight_per_unit
      FROM sales_items si
      JOIN sales_products sp ON si.product_id = sp.id
      WHERE si.invoice_id = ?
      ORDER BY si.id
    `,
      [invoiceId]
    )
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch {
    return []
  }
})

ipcMain.handle('salesInvoices:getSummary', async () => {
  try {
    const db = getDb()

    const totalIncoming = db.exec('SELECT SUM(net_weight) as total FROM weighbridge')
    const incoming =
      totalIncoming.length > 0 && totalIncoming[0].values[0][0]
        ? (totalIncoming[0].values[0][0] as number)
        : 0

    const totalOutgoing = db.exec('SELECT SUM(total_weight) as total FROM sales_invoices')
    const outgoing =
      totalOutgoing.length > 0 && totalOutgoing[0].values[0][0]
        ? (totalOutgoing[0].values[0][0] as number)
        : 0

    const totalSales = db.exec('SELECT SUM(total_amount) as total FROM sales_invoices')
    const sales =
      totalSales.length > 0 && totalSales[0].values[0][0]
        ? (totalSales[0].values[0][0] as number)
        : 0

    const lossPercentage = incoming > 0 ? ((incoming - outgoing) / incoming) * 100 : 0

    return {
      total_incoming: incoming,
      total_outgoing: outgoing,
      current_stock: incoming - outgoing,
      total_sales: sales,
      loss_percentage: lossPercentage
    }
  } catch (error) {
    console.error('Get sales summary error:', error)
    return {
      total_incoming: 0,
      total_outgoing: 0,
      current_stock: 0,
      total_sales: 0,
      loss_percentage: 0
    }
  }
})

ipcMain.handle('salesInvoices:create', async (_event, data) => {
  try {
    const db = getDb()

    const beginStmt = db.prepare('BEGIN TRANSACTION')
    beginStmt.run()
    beginStmt.free()

    try {
      const invoiceStmt = db.prepare(`
        INSERT INTO sales_invoices (date, buyer_name, buyer_phone, total_weight, total_amount, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      invoiceStmt.bind([
        data.date,
        data.buyer_name,
        data.buyer_phone || null,
        data.total_weight,
        data.total_amount,
        data.payment_method || 'نقدا',
        data.notes || null
      ])
      invoiceStmt.run()
      invoiceStmt.free()

      const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number

      data.items.forEach((item: any) => {
        const itemStmt = db.prepare(`
          INSERT INTO sales_items (invoice_id, product_id, quantity, price_per_kg, total_weight, total_amount)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        itemStmt.bind([
          lastId,
          item.product_id,
          item.quantity,
          item.price_per_kg,
          item.total_weight,
          item.total_amount
        ])
        itemStmt.run()
        itemStmt.free()
      })

      const commitStmt = db.prepare('COMMIT')
      commitStmt.run()
      commitStmt.free()

      await saveDatabase()

      await enqueueChange({
        operation: 'INSERT',
        table: 'sales_invoices',
        record_id: lastId,
        data: { ...data, id: lastId, _client_id: null, _synced_at: null, _version: 1 },
        client_timestamp: Date.now()
      }).catch((err) => console.error('Failed to enqueue change:', err))

      data.items.forEach(async (item: any) => {
        const itemId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number
        await enqueueChange({
          operation: 'INSERT',
          table: 'sales_items',
          record_id: itemId,
          data: {
            ...item,
            id: itemId,
            invoice_id: lastId,
            _client_id: null,
            _synced_at: null,
            _version: 1
          },
          client_timestamp: Date.now()
        }).catch((err) => console.error('Failed to enqueue change:', err))
      })

      return { success: true, id: lastId }
    } catch (error) {
      const rollbackStmt = db.prepare('ROLLBACK')
      rollbackStmt.run()
      rollbackStmt.free()
      throw error
    }
  } catch (error) {
    console.error('Create invoice error:', error)
    return { success: false, message: 'فشل إنشاء الفاتورة' }
  }
})

ipcMain.handle('salesInvoices:delete', async (_event, id) => {
  try {
    const db = getDb()

    const beginStmt = db.prepare('BEGIN TRANSACTION')
    beginStmt.run()
    beginStmt.free()

    try {
      const deleteItemsStmt = db.prepare('DELETE FROM sales_items WHERE invoice_id = ?')
      deleteItemsStmt.bind([id])
      deleteItemsStmt.run()
      deleteItemsStmt.free()

      const deleteInvoiceStmt = db.prepare('DELETE FROM sales_invoices WHERE id = ?')
      deleteInvoiceStmt.bind([id])
      deleteInvoiceStmt.run()
      deleteInvoiceStmt.free()

      const commitStmt = db.prepare('COMMIT')
      commitStmt.run()
      commitStmt.free()

      await saveDatabase()

      await enqueueChange({
        operation: 'DELETE',
        table: 'sales_invoices',
        record_id: id,
        data: { id },
        client_timestamp: Date.now()
      }).catch((err) => console.error('Failed to enqueue change:', err))

      return { success: true }
    } catch (error) {
      const rollbackStmt = db.prepare('ROLLBACK')
      rollbackStmt.run()
      rollbackStmt.free()
      throw error
    }
  } catch {
    return { success: false, message: 'فشل حذف الفاتورة' }
  }
})

ipcMain.handle('telegram:send', async (_event, { token, chatId, message }) => {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    })
    const data = await response.json()
    return { success: data.ok }
  } catch (error) {
    console.error('Telegram error:', error)
    return { success: false }
  }
})

ipcMain.handle('telegram:sendReport', async () => {
  try {
    const db = getDb()

    const settings = db.exec('SELECT * FROM settings')
    const telegramSettings: Record<string, string> = {}
    if (settings.length > 0) {
      settings[0].values.forEach((row) => {
        telegramSettings[row[0] as string] = row[1] as string
      })
    }

    const telegramToken = telegramSettings.telegram_token
    const chatId = telegramSettings.telegram_chat_id

    if (!telegramToken || !chatId) {
      return { success: false, message: 'يرجى إعداد توكن البوت ومعرف الشات أولاً' }
    }

    const reportData = generateReportData(db)
    const summary = generateReportSummary(db)
    const excelBuffer = generateExcelReport(reportData, summary)
    const jsonReport = generateJsonReport(reportData, summary)

    const result = await sendReportToTelegram(
      telegramToken,
      chatId,
      excelBuffer,
      jsonReport,
      summary
    )

    return result
  } catch (error: any) {
    console.error('Send report error:', error)
    return { success: false, error: error.message || 'فشل إرسال التقرير' }
  }
})

ipcMain.handle('telegram:sendDb', async () => {
  try {
    const db = getDb()

    const settings = db.exec('SELECT * FROM settings')
    const telegramSettings: Record<string, string> = {}
    if (settings.length > 0) {
      settings[0].values.forEach((row) => {
        telegramSettings[row[0] as string] = row[1] as string
      })
    }

    const telegramToken = telegramSettings.telegram_token
    const chatId = telegramSettings.telegram_chat_id

    if (!telegramToken || !chatId) {
      return { success: false, message: 'يرجى إعداد توكن البوت ومعرف الشات أولاً' }
    }

    await saveDatabase()

    const dbPath = getDbPath()
    const dbBuffer = await readFile(dbPath)

    const TelegramBot = (await import('node-telegram-bot-api')).default
    const bot = new TelegramBot(telegramToken, { polling: false })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_')
    const caption = `
📄 نسخة احتياطية من قاعدة البيانات
📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}
📁 الملف: date_factory_v2.db

تم إرسال قاعدة البيانات الاحتياطية بنجاح.
    `.trim()

    await bot.sendDocument(
      chatId,
      dbBuffer,
      {},
      {
        filename: `date_factory_v2_${timestamp}.db`,
        caption: caption
      }
    )

    return { success: true, message: 'تم إرسال قاعدة البيانات بنجاح' }
  } catch (error: any) {
    console.error('Send DB error:', error)
    return { success: false, error: error.message || 'فشل إرسال قاعدة البيانات' }
  }
})

// License IPC
ipcMain.handle('license:getInfo', async () => {
  return licenseManager.getLicenseInfo()
})

ipcMain.handle('license:getMachineId', async () => {
  try {
    const machineId = licenseManager.getMachineId()
    console.log('License: Machine ID retrieved:', machineId)
    return { success: true, machineId }
  } catch (error) {
    console.error('License: Error getting machine ID:', error)
    return { success: false, message: 'فشل الحصول على معرف الجهاز' }
  }
})

ipcMain.handle('license:activate', async (_event, { licenseKey, factoryName }) => {
  if (licenseManager.validateLicense(licenseKey)) {
    const success = licenseManager.saveLicense(licenseKey, factoryName || '')
    return { success, message: success ? 'تم تفعيل البرنامج بنجاح' : 'فشل حفظ ملف الترخيص' }
  }
  return { success: false, message: 'مفتاح الترخيص غير صالح لهذا الجهاز' }
})

ipcMain.handle('license:check', async () => {
  return await licenseManager.isLicensed()
})

ipcMain.handle('license:openTrialRequest', async () => {
  const TRIAL_REQUEST_URL =
    process.env.TRIAL_REQUEST_URL || 'https://dates-factory-manager-cloud.vercel.app/trial'
  shell.openExternal(TRIAL_REQUEST_URL)
  return { success: true }
})

// Seasons IPC
ipcMain.handle('seasons:getAll', async () => {
  try {
    const db = getDb()
    const res = db.exec('SELECT * FROM seasons ORDER BY start_date DESC')
    if (res.length === 0) return []
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })
  } catch (error) {
    console.error('Get seasons error:', error)
    return []
  }
})

ipcMain.handle('seasons:getActive', async () => {
  try {
    const db = getDb()
    const res = db.exec('SELECT * FROM seasons WHERE is_active = 1 LIMIT 1')
    if (res.length === 0 || res[0].values.length === 0) return null
    const columns = res[0].columns
    return res[0].values.map((row) => {
      const obj = {}
      columns.forEach((col, i) => (obj[col] = row[i]))
      return obj
    })[0]
  } catch (error) {
    console.error('Get active season error:', error)
    return null
  }
})

ipcMain.handle('seasons:create', async (_event, season) => {
  try {
    const db = getDb()
    const stmt = db.prepare(
      'INSERT INTO seasons (name, start_date, end_date, is_active, notes) VALUES (?, ?, ?, ?, ?)'
    )
    stmt.bind([
      season.name,
      season.start_date,
      season.end_date,
      season.is_active ? 1 : 0,
      season.notes || null
    ])
    stmt.run()
    stmt.free()

    // If this season is active, deactivate all other seasons
    if (season.is_active) {
      const deactivateStmt = db.prepare('UPDATE seasons SET is_active = 0 WHERE id != ?')
      deactivateStmt.bind([db.exec('SELECT last_insert_rowid() as id')[0].values[0][0]])
      deactivateStmt.run()
      deactivateStmt.free()
    }

    await saveDatabase()

    // Enqueue for sync
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number
    await enqueueChange({
      operation: 'INSERT',
      table: 'seasons',
      record_id: lastId,
      data: { ...season, id: lastId },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    return { success: true }
  } catch (error) {
    console.error('Create season error:', error)
    return { success: false, message: 'حدث خطأ أثناء إضافة الموسم' }
  }
})

ipcMain.handle('seasons:update', async (_event, id, season) => {
  try {
    const db = getDb()
    const stmt = db.prepare(
      'UPDATE seasons SET name = ?, start_date = ?, end_date = ?, is_active = ?, notes = ? WHERE id = ?'
    )
    stmt.bind([
      season.name,
      season.start_date,
      season.end_date,
      season.is_active ? 1 : 0,
      season.notes || null,
      id
    ])
    stmt.run()
    stmt.free()

    // If this season is active, deactivate all other seasons
    if (season.is_active) {
      const deactivateStmt = db.prepare('UPDATE seasons SET is_active = 0 WHERE id != ?')
      deactivateStmt.bind([id])
      deactivateStmt.run()
      deactivateStmt.free()
    }

    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'UPDATE',
      table: 'seasons',
      record_id: id,
      data: season,
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    return { success: true }
  } catch (error) {
    console.error('Update season error:', error)
    return { success: false, message: 'حدث خطأ أثناء تعديل الموسم' }
  }
})

ipcMain.handle('seasons:delete', async (_event, id) => {
  try {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM seasons WHERE id = ?')
    stmt.bind([id])
    stmt.run()
    stmt.free()
    await saveDatabase()

    // Enqueue for sync
    await enqueueChange({
      operation: 'DELETE',
      table: 'seasons',
      record_id: id,
      data: { id },
      client_timestamp: Date.now()
    }).catch((err) => console.error('Failed to enqueue change:', err))

    return { success: true }
  } catch (error) {
    console.error('Delete season error:', error)
    return { success: false, message: 'حدث خطأ أثناء حذف الموسم' }
  }
})

ipcMain.handle('seasons:setActive', async (_event, id) => {
  try {
    const db = getDb()

    // Deactivate all seasons
    const deactivateStmt = db.prepare('UPDATE seasons SET is_active = 0')
    deactivateStmt.run()
    deactivateStmt.free()

    // Activate the specified season
    const activateStmt = db.prepare('UPDATE seasons SET is_active = 1 WHERE id = ?')
    activateStmt.bind([id])
    activateStmt.run()
    activateStmt.free()

    await saveDatabase()

    return { success: true }
  } catch (error) {
    console.error('Set active season error:', error)
    return { success: false, message: 'حدث خطأ أثناء تفعيل الموسم' }
  }
})

// Duplicates IPC
ipcMain.handle('duplicates:getAll', async () => {
  try {
    const db = getDb()
    const duplicates: any = {
      weighbridge: [],
      crates: [],
      finance: [],
      summary: { total: 0, byTable: {} }
    }

    // Helper to execute query and return objects
    const query = (sql: string) => {
      const res = db.exec(sql)
      if (res.length === 0) return []
      const columns = res[0].columns
      return res[0].values.map((row) => {
        const obj = {}
        columns.forEach((col, i) => (obj[col] = row[i]))
        return obj
      })
    }

    // 1. Weighbridge duplicates
    duplicates.weighbridge = query(`
      SELECT w.*, c.name as customer_name,
             (SELECT COUNT(*) FROM weighbridge w2 
              WHERE w2.date = w.date 
              AND w2.customer_id = w.customer_id 
              AND w2.gross_weight = w.gross_weight 
              AND w2.net_weight = w.net_weight) as duplicate_count
      FROM weighbridge w
      LEFT JOIN customers c ON w.customer_id = c.id
      WHERE (w.date || w.customer_id || w.gross_weight || w.net_weight) IN (
          SELECT (date || customer_id || gross_weight || net_weight)
          FROM weighbridge 
          GROUP BY date, customer_id, gross_weight, net_weight 
          HAVING COUNT(*) > 1
      )
      ORDER BY w.date DESC, w.customer_id, w.id
    `)
    duplicates.summary.byTable.weighbridge = duplicates.weighbridge.length

    // 2. Crates duplicates
    duplicates.crates = query(`
      SELECT cr.*, c.name as customer_name,
             (SELECT COUNT(*) FROM crates cr2 
              WHERE cr2.date = cr.date 
              AND cr2.customer_id = cr.customer_id 
              AND cr2.crates_out = cr.crates_out 
              AND cr2.crates_returned = cr.crates_returned) as duplicate_count
      FROM crates cr
      LEFT JOIN customers c ON cr.customer_id = c.id
      WHERE (cr.date || cr.customer_id || cr.crates_out || cr.crates_returned) IN (
          SELECT (date || customer_id || crates_out || crates_returned)
          FROM crates 
          GROUP BY date, customer_id, crates_out, crates_returned 
          HAVING COUNT(*) > 1
      )
      ORDER BY cr.date DESC, cr.customer_id, cr.id
    `)
    duplicates.summary.byTable.crates = duplicates.crates.length

    // 3. Finance duplicates
    duplicates.finance = query(`
      SELECT f.*, c.name as customer_name,
             (SELECT COUNT(*) FROM finance f2 
              WHERE f2.date = f.date 
              AND f2.customer_id = f.customer_id 
              AND f2.transaction_type = f.transaction_type
              AND f2.amount_paid = f.amount_paid 
              AND f2.amount_received = f.amount_received) as duplicate_count
      FROM finance f
      LEFT JOIN customers c ON f.customer_id = c.id
      WHERE (f.date || f.customer_id || f.transaction_type || f.amount_paid || f.amount_received) IN (
          SELECT (date || customer_id || transaction_type || amount_paid || amount_received)
          FROM finance 
          GROUP BY date, customer_id, transaction_type, amount_paid, amount_received 
          HAVING COUNT(*) > 1
      )
      ORDER BY f.date DESC, f.customer_id, f.id
    `)
    duplicates.summary.byTable.finance = duplicates.finance.length

    duplicates.summary.total =
      duplicates.weighbridge.length + duplicates.crates.length + duplicates.finance.length

    return duplicates
  } catch (error) {
    console.error('Get duplicates error:', error)
    return { weighbridge: [], crates: [], finance: [], summary: { total: 0, byTable: {} } }
  }
})

ipcMain.handle('duplicates:delete', async (_event, { table, id }) => {
  try {
    const validTables = ['weighbridge', 'crates', 'finance']
    if (!validTables.includes(table)) {
      return { success: false, message: 'جدول غير صالح' }
    }
    const db = getDb()
    const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`)
    stmt.bind([id])
    stmt.run()
    stmt.free()
    await saveDatabase()
    return { success: true }
  } catch (error: any) {
    console.error('Delete duplicate error:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('duplicates:autoClean', async () => {
  try {
    const db = getDb()
    let totalCleaned = 0

    const clean = (table: string, columns: string[]) => {
      const columnList = columns.join(', ')
      const stmt = db.prepare(`
        DELETE FROM ${table} 
        WHERE id NOT IN (
            SELECT MIN(id) FROM ${table} GROUP BY ${columnList}
        )
      `)
      stmt.run()
      stmt.free()
      return db.getRowsModified()
    }

    const beginStmt = db.prepare('BEGIN TRANSACTION')
    beginStmt.run()
    beginStmt.free()
    try {
      totalCleaned += clean('weighbridge', ['date', 'customer_id', 'gross_weight', 'net_weight'])
      totalCleaned += clean('crates', ['date', 'customer_id', 'crates_out', 'crates_returned'])
      totalCleaned += clean('finance', [
        'date',
        'customer_id',
        'transaction_type',
        'amount_paid',
        'amount_received'
      ])
      const commitStmt = db.prepare('COMMIT')
      commitStmt.run()
      commitStmt.free()
    } catch (err) {
      const rollbackStmt = db.prepare('ROLLBACK')
      rollbackStmt.run()
      rollbackStmt.free()
      throw err
    }

    await saveDatabase()
    return { success: true, count: totalCleaned }
  } catch (error: any) {
    console.error('Auto clean duplicates error:', error)
    return { success: false, message: error.message }
  }
})

// Telegram Bot IPC Handlers
ipcMain.handle('telegram:startBot', async () => {
  return startTelegramBot()
})

ipcMain.handle('telegram:stopBot', async () => {
  return stopTelegramBot()
})

ipcMain.handle('telegram:restartBot', async () => {
  return restartTelegramBot()
})

ipcMain.handle('telegram:testConnection', async (_event, token?) => {
  return testBotConnection(token)
})

ipcMain.handle('telegram:getStats', async () => {
  return getBotStats()
})

// Telegram Users IPC
ipcMain.handle('telegram:getUsers', async (_event, filters) => {
  try {
    const db = getDb()
    let query = `
      SELECT tu.*, ur.role
      FROM telegram_users tu
      LEFT JOIN user_roles ur ON tu.user_id = ur.user_id
    `
    const params: any[] = []
    const conditions: string[] = []

    if (filters?.status) {
      conditions.push('tu.status = ?')
      params.push(filters.status)
    }

    if (filters?.role) {
      conditions.push('ur.role = ?')
      params.push(filters.role)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY tu.registration_date DESC'

    if (filters?.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
      if (filters?.offset) {
        query += ' OFFSET ?'
        params.push(filters.offset)
      }
    }

    const stmt = db.prepare(query)
    params.forEach((param) => stmt.bind([param]))

    const users: any[] = []
    while (stmt.step()) {
      users.push(stmt.getAsObject())
    }
    stmt.free()

    return { success: true, data: users }
  } catch (error: any) {
    console.error('Get telegram users error:', error)
    return { success: false, message: error.message || 'Failed to get users' }
  }
})

ipcMain.handle('telegram:updateUser', async (_event, telegramId, data) => {
  try {
    const db = getDb()
    const updates: string[] = []
    const params: any[] = []

    if (data.status !== undefined) {
      updates.push('status = ?')
      params.push(data.status)
    }

    if (data.role !== undefined) {
      // Update role in user_roles table
      const getUserIdStmt = db.prepare('SELECT user_id FROM telegram_users WHERE telegram_id = ?')
      getUserIdStmt.bind([telegramId])
      getUserIdStmt.step()
      const userIdResult = getUserIdStmt.getAsObject() as any
      getUserIdStmt.free()

      if (userIdResult?.user_id) {
        // Check if role exists
        const checkRoleStmt = db.prepare('SELECT * FROM user_roles WHERE user_id = ?')
        checkRoleStmt.bind([userIdResult.user_id])
        if (checkRoleStmt.step()) {
          const updateRoleStmt = db.prepare('UPDATE user_roles SET role = ? WHERE user_id = ?')
          updateRoleStmt.bind([data.role, userIdResult.user_id])
          updateRoleStmt.run()
          updateRoleStmt.free()
        } else {
          const insertRoleStmt = db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)')
          insertRoleStmt.bind([userIdResult.user_id, data.role])
          insertRoleStmt.run()
          insertRoleStmt.free()
        }
        checkRoleStmt.free()
      }
    }

    if (updates.length > 0) {
      params.push(telegramId)
      const stmt = db.prepare(
        `UPDATE telegram_users SET ${updates.join(', ')} WHERE telegram_id = ?`
      )
      stmt.bind(params)
      stmt.run()
      stmt.free()
    }

    await saveDatabase()
    return { success: true }
  } catch (error: any) {
    console.error('Update telegram user error:', error)
    return { success: false, message: error.message || 'Failed to update user' }
  }
})

ipcMain.handle('telegram:deleteUser', async (_event, telegramId) => {
  try {
    const db = getDb()

    // Delete user roles
    const deleteRoleStmt = db.prepare(`
      DELETE FROM user_roles
      WHERE user_id IN (SELECT user_id FROM telegram_users WHERE telegram_id = ?)
    `)
    deleteRoleStmt.bind([telegramId])
    deleteRoleStmt.run()
    deleteRoleStmt.free()

    // Delete notifications
    const deleteNotifStmt = db.prepare('DELETE FROM notification_queue WHERE telegram_id = ?')
    deleteNotifStmt.bind([telegramId])
    deleteNotifStmt.run()
    deleteNotifStmt.free()

    // Delete preferences
    const deletePrefStmt = db.prepare('DELETE FROM notification_preferences WHERE telegram_id = ?')
    deletePrefStmt.bind([telegramId])
    deletePrefStmt.run()
    deletePrefStmt.free()

    // Delete user
    const deleteStmt = db.prepare('DELETE FROM telegram_users WHERE telegram_id = ?')
    deleteStmt.bind([telegramId])
    deleteStmt.run()
    deleteStmt.free()

    await saveDatabase()
    return { success: true }
  } catch (error: any) {
    console.error('Delete telegram user error:', error)
    return { success: false, message: error.message || 'Failed to delete user' }
  }
})

// Telegram Registrations IPC

ipcMain.handle('telegram:getRegistrations', async (_event, filters) => {
  try {
    const handler = getRegistrationHandler()
    const registrations = await handler.getRegistrations(filters)
    return { success: true, data: registrations }
  } catch (error: any) {
    console.error('Get registrations error:', error)
    return { success: false, message: error.message || 'Failed to get registrations' }
  }
})

ipcMain.handle(
  'telegram:approveRegistration',
  async (_event, registrationId, role, reviewerUserId) => {
    try {
      const handler = getRegistrationHandler()
      const result = await handler.approveRegistration(registrationId, role, reviewerUserId)
      return result
    } catch (error: any) {
      console.error('Approve registration error:', error)
      return { success: false, message: error.message || 'Failed to approve registration' }
    }
  }
)

ipcMain.handle(
  'telegram:rejectRegistration',
  async (_event, registrationId, reason, reviewerUserId) => {
    try {
      const handler = getRegistrationHandler()
      const result = await handler.rejectRegistration(registrationId, reason, reviewerUserId)
      return result
    } catch (error: any) {
      console.error('Reject registration error:', error)
      return { success: false, message: error.message || 'Failed to reject registration' }
    }
  }
)

// Sync IPC Handlers
ipcMain.handle('sync:getStatus', async () => {
  try {
    const status = await sync.getSyncStatus()
    return { success: true, data: status }
  } catch (error: any) {
    console.error('Get sync status error:', error)
    return { success: false, message: error.message || 'Failed to get sync status' }
  }
})

ipcMain.handle('sync:manualSync', async () => {
  try {
    const result = await sync.manualSync()
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Manual sync error:', error)
    return { success: false, message: error.message || 'Sync failed' }
  }
})

ipcMain.handle('sync:enable', async () => {
  try {
    await sync.enableSync()
    return { success: true }
  } catch (error: any) {
    console.error('Enable sync error:', error)
    return { success: false, message: error.message || 'Failed to enable sync' }
  }
})

ipcMain.handle('sync:disable', async () => {
  try {
    sync.disableSync()
    return { success: true }
  } catch (error: any) {
    console.error('Disable sync error:', error)
    return { success: false, message: error.message || 'Failed to disable sync' }
  }
})

ipcMain.handle('sync:getConflicts', async (_event, limit) => {
  try {
    const conflicts = await syncConflict.getRecentConflicts(limit || 50)
    return { success: true, data: conflicts }
  } catch (error: any) {
    console.error('Get conflicts error:', error)
    return { success: false, message: error.message || 'Failed to get conflicts' }
  }
})

ipcMain.handle('sync:clearConflicts', async () => {
  try {
    return await syncConflict.clearOldConflicts()
  } catch (error: any) {
    console.error('Clear conflicts error:', error)
    return { success: false, message: error.message || 'Failed to clear conflicts' }
  }
})

ipcMain.handle('sync:clearOldConflicts', async (_event, olderThanDays) => {
  try {
    const cleared = await syncConflict.clearOldConflicts(olderThanDays || 90)
    return { success: true, data: { cleared } }
  } catch (error: any) {
    console.error('Clear conflicts error:', error)
    return { success: false, message: error.message || 'Failed to clear conflicts' }
  }
})

// Print IPC Handler - Open print preview dialog
ipcMain.handle('app:print', async () => {
  try {
    if (!mainWindow) {
      return { success: false, message: 'No window available' }
    }

    // Execute print in the renderer process
    await mainWindow.webContents.executeJavaScript(`
      // Add print styles before printing
      const printStyle = document.createElement('style');
      printStyle.textContent = \`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:flex, .print\\:hidden { visibility: visible !important; }
          .print\\:block { display: block !important; }
          .print\\:flex { display: flex !important; }
          .no-print { display: none !important; }

          /* Show only printable content */
          #root > div > *:not(:has(.print\\\\:block)) { display: none; }

          /* Make sure print elements are visible */
          .print\\\\:block, .print\\\\:flex {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      \`;
      document.head.appendChild(printStyle);

      // Trigger print
      window.print();

      // Remove style after print dialog closes
      setTimeout(() => {
        document.head.removeChild(printStyle);
      }, 1000);
    `)

    return { success: true }
  } catch (error: any) {
    console.error('Print error:', error)
    return { success: false, message: error.message || 'Failed to print' }
  }
})

// Auto-update IPC handlers
ipcMain.handle('autoUpdater:check', async () => {
  return await checkForUpdates()
})

ipcMain.handle('autoUpdater:download', async () => {
  return await downloadUpdate()
})

ipcMain.handle('autoUpdater:installAndRestart', () => {
  installUpdateAndRestart()
  return { success: true }
})

ipcMain.handle('autoUpdater:getVersion', () => {
  return {
    current: app.getVersion(),
    isDev: is.dev
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app
  .whenReady()
  .then(async () => {
    logToConsole('App is ready')
    try {
      // Set app user model id for windows
      electronApp.setAppUserModelId('com.electron')

      // Default open or close DevTools by F12 in development
      // and ignore CommandOrControl + R in production.
      // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
      app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
      })

      await createWindow()

      // Start periodic update checks
      try {
        startPeriodicUpdateChecks()
      } catch (updateError) {
        logToConsole('Failed to start periodic update checks:', updateError)
      }

      app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
      })
    } catch (error: any) {
      logToConsole('Error during app initialization:', error)
      dialog.showErrorBox(
        'خطأ في بدء التطبيق',
        error.message || 'حدث خطأ غير متوقع أثناء بدء التطبيق'
      )
    }
  })
  .catch((error) => {
    logToConsole('Failed to initialize app:', error)
    dialog.showErrorBox('خطأ في تهيئة التطبيق', error.message || 'فشل في بدء التطبيق')
  })

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  logToConsole('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  logToConsole('App is quitting...')
  // Stop periodic update checks before quitting
  stopPeriodicUpdateChecks()

  // Clear window show timeout
  if (windowShowTimeout) {
    clearTimeout(windowShowTimeout)
    windowShowTimeout = null
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
