import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Calendar, 
  HardDrive,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  createBackup, 
  restoreBackup, 
  listBackups, 
  deleteBackup, 
  downloadBackup,
  type BackupFile 
} from '@/lib/backupsApi'

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [stats, setStats] = useState({
    totalBackups: 0,
    totalSize: 0,
    lastBackup: null as string | null,
    totalRecords: 0
  })

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    try {
      const backupsList = listBackups()
      setBackups(backupsList)
      
      const totalSize = backupsList.reduce((sum, b) => sum + b.size, 0)
      const totalRecords = backupsList.reduce((sum, b) => sum + b.recordsCount, 0)
      
      setStats({
        totalBackups: backupsList.length,
        totalSize: totalSize,
        lastBackup: backupsList[0]?.timestamp || null,
        totalRecords: totalRecords
      })
    } catch (error) {
      console.error('خطأ في تحميل النسخ:', error)
    }
  }

  const handleCreateBackup = async () => {
    setLoading(true)
    try {
      await createBackup()
      await loadBackups()
      alert('✅ تم إنشاء النسخة الاحتياطية بنجاح!')
    } catch (error) {
      console.error('خطأ في إنشاء النسخة:', error)
      alert('❌ فشل إنشاء النسخة الاحتياطية')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = (backupName: string) => {
    try {
      downloadBackup(backupName)
    } catch (error) {
      console.error('خطأ في التحميل:', error)
      alert('❌ فشل تحميل النسخة')
    }
  }

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return
    
    setRestoring(true)
    try {
      await restoreBackup(selectedBackup)
      alert('✅ تمت الاستعادة بنجاح! سيتم تحديث الصفحة...')
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      console.error('خطأ في الاستعادة:', error)
      alert('❌ فشلت عملية الاستعادة')
    } finally {
      setRestoring(false)
      setShowRestoreDialog(false)
    }
  }

  const handleDeleteBackup = async (backupName: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة؟')) return
    
    try {
      deleteBackup(backupName)
      await loadBackups()
      alert('✅ تم حذف النسخة')
    } catch (error) {
      console.error('خطأ في الحذف:', error)
      alert('❌ فشل حذف النسخة')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            النسخ الاحتياطية
          </h1>
          <p className="text-gray-500 mt-1">
            إدارة نسخ البيانات الاحتياطية واستعادتها
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={loadBackups}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <Button
            onClick={handleCreateBackup}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري النسخ...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 ml-2" />
                نسخ احتياطي جديد
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">عدد النسخ</p>
                <p className="text-2xl font-bold">{stats.totalBackups}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الحجم الإجمالي</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مجموع السجلات</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">آخر نسخة</p>
                <p className="text-sm font-semibold">
                  {stats.lastBackup 
                    ? format(new Date(stats.lastBackup), 'dd MMM', { locale: ar })
                    : 'لا يوجد'
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">معلومات مهمة:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>يتم نسخ <strong>البيانات من Supabase فقط</strong></li>
                <li>الملفات والكود محلية - لا تحتاج نسخ احتياطي</li>
                <li>يُنصح بعمل نسخة قبل أي تعديلات كبيرة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            النسخ الاحتياطية المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">لا توجد نسخ احتياطية بعد</p>
              <Button onClick={handleCreateBackup} disabled={loading}>
                إنشاء أول نسخة احتياطية
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{backup.name}</h3>
                        <Badge>نسخة كاملة</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{format(new Date(backup.timestamp), 'dd MMMM yyyy - HH:mm', { locale: ar })}</span>
                        <span>{formatFileSize(backup.size)}</span>
                        <span>{backup.recordsCount} سجل</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadBackup(backup.name)}
                    >
                      <Download className="h-4 w-4 ml-1" />
                      تحميل
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBackup(backup.name)
                        setShowRestoreDialog(true)
                      }}
                    >
                      <Upload className="h-4 w-4 ml-1" />
                      استعادة
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBackup(backup.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الاستعادة</AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-2">
              <p className="font-semibold text-gray-900">⚠️ تحذير مهم!</p>
              <p>هذه العملية ستقوم باستبدال جميع البيانات الحالية</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreBackup}
              disabled={restoring}
            >
              {restoring ? 'جاري الاستعادة...' : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
