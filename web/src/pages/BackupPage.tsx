import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  HardDrive,
  Cloud,
  FileDown,
  FileUp,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5175';

export default function BackupPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [backupInfo, setBackupInfo] = useState<any>(null);

  // تنزيل نسخة احتياطية من السيرفر
  const downloadBackup = async () => {
    try {
      setMessage(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/backup/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('فشل في تنزيل النسخة الاحتياطية');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'تم تنزيل النسخة الاحتياطية بنجاح' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // رفع نسخة احتياطية للسيرفر
  const uploadBackupMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('backup', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/backup/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في رفع النسخة الاحتياطية');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setMessage({ type: 'success', text: 'تم رفع واستعادة النسخة الاحتياطية بنجاح' });
      setBackupInfo(data);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('⚠️ تحذير: سيتم استبدال جميع البيانات الحالية بالنسخة الاحتياطية. هل أنت متأكد؟')) {
        uploadBackupMutation.mutate(file);
      }
    }
  };

  // الحصول على معلومات قاعدة البيانات
  const getBackupInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/backup/info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('فشل في جلب معلومات قاعدة البيانات');

      const data = await response.json();
      setBackupInfo(data);
      setMessage({ type: 'success', text: 'تم جلب معلومات قاعدة البيانات' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="h-8 w-8" />
          النسخ الاحتياطي
        </h1>
        <p className="text-gray-600 mt-2">إدارة النسخ الاحتياطية لقاعدة البيانات</p>
      </div>

      {/* رسائل التنبيه */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* تنزيل نسخة احتياطية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            تنزيل نسخة احتياطية من السيرفر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            احفظ نسخة من قاعدة البيانات الحالية على جهازك
          </p>
          <Button onClick={downloadBackup} className="w-full" size="lg">
            <FileDown className="h-5 w-5 ml-2" />
            تنزيل النسخة الاحتياطية
          </Button>
        </CardContent>
      </Card>

      {/* رفع نسخة احتياطية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            استعادة نسخة احتياطية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ تحذير: سيتم استبدال جميع البيانات الحالية بالنسخة الاحتياطية المرفوعة
            </AlertDescription>
          </Alert>
          <div className="relative">
            <input
              type="file"
              accept=".db"
              onChange={handleFileUpload}
              className="hidden"
              id="backup-upload"
              disabled={uploadBackupMutation.isPending}
            />
            <label htmlFor="backup-upload">
              <Button
                asChild
                variant="outline"
                className="w-full"
                size="lg"
                disabled={uploadBackupMutation.isPending}
              >
                <span>
                  {uploadBackupMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <FileUp className="h-5 w-5 ml-2" />
                      اختيار ملف النسخة الاحتياطية
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* معلومات قاعدة البيانات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            معلومات قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={getBackupInfo} variant="outline" className="w-full">
            <Download className="h-5 w-5 ml-2" />
            جلب المعلومات
          </Button>

          {backupInfo && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">حجم قاعدة البيانات</p>
                <p className="text-lg font-bold">{backupInfo.size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">آخر تعديل</p>
                <p className="text-lg font-bold">
                  {new Date(backupInfo.lastModified).toLocaleDateString('ar-SA')}
                </p>
              </div>
              {backupInfo.tables && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">عدد الجداول</p>
                    <p className="text-lg font-bold">{backupInfo.tables.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">إجمالي السجلات</p>
                    <p className="text-lg font-bold">{backupInfo.totalRows}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
