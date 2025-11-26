import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // جلب تفاصيل المشروع
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getProject(Number(id)),
    enabled: !!id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل تفاصيل المشروع...</p>
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">المشروع غير موجود</h2>
            <p className="text-gray-600 mb-6">
              عذراً، المشروع الذي تبحث عنه غير موجود أو تم حذفه.
            </p>
            <Button onClick={() => navigate('/projects')} className="w-full">
              العودة للمشاريع
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'completed':
        return 'مكتمل';
      case 'on_hold':
        return 'متوقف مؤقتاً';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل المشروع...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">المشروع غير موجود</h2>
        <Button onClick={() => navigate('/projects')}>العودة للمشاريع</Button>
      </div>
    );
  }

  const completionPercentage = project.completion_percentage || 0;
  const remaining = (project.budget || 0) - (project.total_spent || 0);
  const isOverBudget = remaining < 0;

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/projects')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            العودة
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.code && (
                <Badge variant="outline" className="text-sm">
                  {project.code}
                </Badge>
              )}
              <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
              <Badge variant="secondary">{project.type}</Badge>
            </div>
            {project.description && <p className="text-gray-600">{project.description}</p>}
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6" style={{ borderTop: `4px solid ${project.color || '#3b82f6'}` }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">قيمة العقد</p>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{(project.budget || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">ريال سعودي</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">الإنفاق المتوقع</p>
            <FileText className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-indigo-600">{(project.expected_spending || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">ريال سعودي</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">الإنفاق الفعلي</p>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{(project.total_spent || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">ريال سعودي</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">المتبقي</p>
            {isOverBudget ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
          <p className={`text-3xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
            {Math.abs(remaining).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {isOverBudget ? 'تجاوز الميزانية' : 'متبقي من الميزانية'}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">نسبة الإنجاز</p>
            <FileText className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{completionPercentage.toFixed(1)}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${
                completionPercentage >= 100
                  ? 'bg-red-500'
                  : completionPercentage >= 80
                  ? 'bg-orange-500'
                  : completionPercentage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            ></div>
          </div>
        </Card>
      </div>

      {/* معلومات إضافية */}
      {(project.start_date || project.end_date) && (
        <Card className="p-6">
          <div className="flex items-center gap-6">
            {project.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">تاريخ البداية</p>
                  <p className="font-medium">
                    {new Date(project.start_date).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">تاريخ النهاية</p>
                  <p className="font-medium">{new Date(project.end_date).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* المصروفات المرتبطة */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">المصروفات المرتبطة بالمشروع</h2>
        {!project.expenses || project.expenses.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">لا توجد مصروفات مرتبطة بهذا المشروع</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">التاريخ</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    الوصف
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الفئة</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">العنصر</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {project.expenses.map((expense: any) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(expense.date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4 text-sm">{expense.description}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className="text-xs"
                        style={{ backgroundColor: expense.category_color || '#6b7280' }}
                      >
                        {expense.category_name}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {expense.item_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold">
                      {expense.amount.toLocaleString()} ر.س
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
