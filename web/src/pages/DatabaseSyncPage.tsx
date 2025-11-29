import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  GitCompare,
  Database,
  ArrowRight,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5175';

interface SchemaDiff {
  table: string;
  status: 'missing' | 'different' | 'same';
  details?: string;
}

export default function DatabaseSyncPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [schemaDiff, setSchemaDiff] = useState<SchemaDiff[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // مقارنة Schema بين Local و Server
  const compareSchema = async () => {
    try {
      setIsComparing(true);
      setMessage(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/database/compare-schema`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('فشل في مقارنة قواعد البيانات');

      const data = await response.json();
      setSchemaDiff(data.differences || []);
      
      if (data.differences.length === 0) {
        setMessage({ type: 'success', text: '✅ قواعد البيانات متطابقة تماماً' });
      } else {
        setMessage({ 
          type: 'error', 
          text: `⚠️ تم العثور على ${data.differences.length} فرق في الجداول` 
        });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsComparing(false);
    }
  };

  // تحديث Schema في السيرفر
  const syncMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/database/sync-schema`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في مزامنة قاعدة البيانات');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setMessage({ 
        type: 'success', 
        text: `✅ تم تحديث قاعدة البيانات بنجاح (${data.updatedTables} جدول)` 
      });
      setSchemaDiff([]);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const handleSync = () => {
    if (confirm('⚠️ هل أنت متأكد من تحديث قاعدة بيانات السيرفر؟')) {
      syncMutation.mutate();
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <RefreshCw className="h-8 w-8" />
          مزامنة قاعدة البيانات
        </h1>
        <p className="text-gray-600 mt-2">
          مقارنة وتحديث Schema بين قاعدة البيانات المحلية والسيرفر
        </p>
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

      {/* مقارنة Schema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            مقارنة قواعد البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            قارن بنية الجداول والأعمدة بين قاعدة البيانات المحلية والسيرفر
          </p>
          <Button 
            onClick={compareSchema} 
            className="w-full" 
            size="lg"
            disabled={isComparing}
          >
            {isComparing ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                جاري المقارنة...
              </>
            ) : (
              <>
                <GitCompare className="h-5 w-5 ml-2" />
                مقارنة الآن
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* نتائج المقارنة */}
      {schemaDiff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              الفروقات المكتشفة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {schemaDiff.map((diff, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  diff.status === 'missing'
                    ? 'bg-red-50 border-red-200'
                    : diff.status === 'different'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {diff.status === 'missing' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : diff.status === 'different' ? (
                      <RefreshCw className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <h4 className="font-bold">{diff.table}</h4>
                      {diff.details && (
                        <p className="text-sm text-gray-600 mt-1">{diff.details}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      diff.status === 'missing'
                        ? 'bg-red-200 text-red-800'
                        : diff.status === 'different'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {diff.status === 'missing'
                      ? 'ناقص'
                      : diff.status === 'different'
                      ? 'مختلف'
                      : 'متطابق'}
                  </span>
                </div>
              </div>
            ))}

            <Alert>
              <ArrowRight className="h-4 w-4" />
              <AlertDescription>
                سيتم تحديث قاعدة بيانات السيرفر لتطابق قاعدة البيانات المحلية
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSync}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 ml-2" />
                  تحديث قاعدة بيانات السيرفر
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
