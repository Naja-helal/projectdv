/**
 * Backups API
 * ===========
 * API لإدارة النسخ الاحتياطية
 */

import { supabase } from './supabase'

export interface BackupFile {
  name: string
  timestamp: string
  size: number
  type: 'full' | 'incremental'
  recordsCount: number
  tables: Record<string, { count: number; data: any[] }>
}

// قائمة الجداول
const TABLES = [
  'projects',
  'expenses',
  'expected_expenses',
  'categories',
  'clients',
  'units',
  'payment_methods',
  'project_items'
]

/**
 * إنشاء نسخة احتياطية
 */
export async function createBackup(): Promise<BackupFile> {
  const timestamp = new Date().toISOString()
  const backup: BackupFile = {
    name: `backup-${timestamp.replace(/[:.]/g, '-')}.json`,
    timestamp,
    size: 0,
    type: 'full',
    recordsCount: 0,
    tables: {}
  }

  try {
    // نسخ كل جدول
    for (const table of TABLES) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
      
      if (error) {
        console.error(`خطأ في نسخ ${table}:`, error)
        backup.tables[table] = { count: 0, data: [] }
      } else {
        backup.tables[table] = {
          count: data?.length || 0,
          data: data || []
        }
        backup.recordsCount += data?.length || 0
      }
    }

    // حساب الحجم التقريبي
    const jsonString = JSON.stringify(backup)
    backup.size = new Blob([jsonString]).size

    // حفظ في localStorage (مؤقتاً - في الإنتاج استخدم API)
    saveBackupToLocal(backup)

    return backup
  } catch (error) {
    console.error('فشل النسخ الاحتياطي:', error)
    throw error
  }
}

/**
 * استعادة من نسخة احتياطية
 */
export async function restoreBackup(backupName: string): Promise<void> {
  try {
    // تحميل النسخة
    const backup = loadBackupFromLocal(backupName)
    if (!backup) throw new Error('النسخة غير موجودة')

    // استعادة كل جدول
    for (const [table, info] of Object.entries(backup.tables)) {
      if (!info.data || info.data.length === 0) continue

      // حذف البيانات الحالية واستبدالها
      const { error } = await supabase
        .from(table)
        .upsert(info.data, { onConflict: 'id' })

      if (error) {
        console.error(`خطأ في استعادة ${table}:`, error)
        throw error
      }
    }

    console.log('✅ تمت الاستعادة بنجاح')
  } catch (error) {
    console.error('فشلت الاستعادة:', error)
    throw error
  }
}

/**
 * الحصول على قائمة النسخ الاحتياطية
 */
export function listBackups(): BackupFile[] {
  const backupsStr = localStorage.getItem('backups')
  if (!backupsStr) return []
  
  try {
    return JSON.parse(backupsStr)
  } catch {
    return []
  }
}

/**
 * حذف نسخة احتياطية
 */
export function deleteBackup(backupName: string): void {
  const backups = listBackups()
  const filtered = backups.filter(b => b.name !== backupName)
  localStorage.setItem('backups', JSON.stringify(filtered))
}

/**
 * تحميل نسخة احتياطية محددة
 */
export function downloadBackup(backupName: string): void {
  const backup = loadBackupFromLocal(backupName)
  if (!backup) throw new Error('النسخة غير موجودة')

  // إنشاء blob وتحميله
  const blob = new Blob([JSON.stringify(backup, null, 2)], { 
    type: 'application/json' 
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupName
  link.click()
  URL.revokeObjectURL(url)
}

// ============ Helper Functions ============

function saveBackupToLocal(backup: BackupFile): void {
  const backups = listBackups()
  
  // إضافة النسخة الجديدة
  backups.unshift({
    name: backup.name,
    timestamp: backup.timestamp,
    size: backup.size,
    type: backup.type,
    recordsCount: backup.recordsCount,
    tables: {} // لا نحفظ البيانات الكاملة في القائمة
  })
  
  // حفظ القائمة
  localStorage.setItem('backups', JSON.stringify(backups))
  
  // حفظ البيانات الكاملة
  localStorage.setItem(`backup_${backup.name}`, JSON.stringify(backup))
}

function loadBackupFromLocal(backupName: string): BackupFile | null {
  const backupStr = localStorage.getItem(`backup_${backupName}`)
  if (!backupStr) return null
  
  try {
    return JSON.parse(backupStr)
  } catch {
    return null
  }
}
