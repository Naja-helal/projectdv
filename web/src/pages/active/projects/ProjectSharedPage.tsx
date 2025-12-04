import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { expectedExpensesApi } from '@/lib/supabaseApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock,
} from 'lucide-react';

type SortField = 'date' | 'description' | 'category' | 'amount' | 'quantity';
type SortDirection = 'asc' | 'desc';

export default function ProjectSharedPage() {
  const { id } = useParams<{ id: string }>();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // جلب المشروع المشارك (للعرض العام فقط)
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['shared-project', id],
    queryFn: async () => {
      // جلب المشروع مباشرة (بدون التحقق من is_shared هنا)
      const { data, error } = await (await import('@/lib/supabase')).supabase
        .from('projects')
        .select('*, client:clients(*)')
        .eq('id', Number(id))
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    retry: false,
  });

  // جلب المصاريف الفعلية المرتبطة بالمشروع
  const { data: allExpenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const expenses = await (await import('@/lib/supabaseApi')).expensesApi.getAll();
      return expenses;
    }
  });

  // تصفية المصاريف الفعلية للمشروع الحالي
  const projectExpenses = useMemo(() => {
    if (!id || !allExpenses) return [];
    return allExpenses.filter((exp: any) => exp.project_id === Number(id));
  }, [allExpenses, id]);

  // جلب الإنفاق المتوقع للمشروع
  const { data: allExpectedExpenses = [] } = useQuery({
    queryKey: ['expected-expenses'],
    queryFn: expectedExpensesApi.getAll
  });

  // تصفية الإنفاق المتوقع للمشروع الحالي
  const expectedExpenses = useMemo(() => {
    if (!id || !allExpectedExpenses) return [];
    return allExpectedExpenses.filter((exp: any) => exp.project_id === Number(id));
  }, [allExpectedExpenses, id]);

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

  // دالة الترتيب
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // المصروفات المرتبة
  const sortedExpenses = useMemo(() => {
    if (!projectExpenses) return [];
    
    const expenses = [...projectExpenses];
    
    expenses.sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          const dateA = new Date(a.expense_date || a.date).getTime();
          const dateB = new Date(b.expense_date || b.date).getTime();
          comparison = dateA - dateB;
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '', 'ar');
          break;
        case 'category':
          const categoryA = typeof a.category === 'object' ? a.category?.name : a.category_name;
          const categoryB = typeof b.category === 'object' ? b.category?.name : b.category_name;
          comparison = (categoryA || '').localeCompare(categoryB || '', 'ar');
          break;
        case 'amount':
          const amountA = a.total_amount || a.amount || 0;
          const amountB = b.total_amount || b.amount || 0;
          comparison = amountA - amountB;
          break;
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return expenses;
  }, [projectExpenses, sortField, sortDirection]);

  // الإنفاق المتوقع المرتب
  const sortedExpectedExpenses = useMemo(() => {
    if (!expectedExpenses) return [];
    
    const expenses = [...expectedExpenses];
    
    expenses.sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          const dateA = new Date(a.expected_date || a.date).getTime();
          const dateB = new Date(b.expected_date || b.date).getTime();
          comparison = dateA - dateB;
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '', 'ar');
          break;
        case 'category':
          const categoryA = typeof a.category === 'object' ? a.category?.name : a.category_name;
          const categoryB = typeof b.category === 'object' ? b.category?.name : b.category_name;
          comparison = (categoryA || '').localeCompare(categoryB || '', 'ar');
          break;
        case 'amount':
          const amountA = a.estimated_amount || a.amount || 0;
          const amountB = b.estimated_amount || b.amount || 0;
          comparison = amountA - amountB;
          break;
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return expenses;
  }, [expectedExpenses, sortField, sortDirection]);

  // أيقونة الترتيب
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
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
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">المشروع غير موجود</h2>
            <p className="text-gray-600 mb-4">
              عذراً، المشروع الذي تبحث عنه غير موجود.
            </p>
            <p className="text-sm text-gray-500">
              يرجى التحقق من الرابط والمحاولة مرة أخرى.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // التحقق من حالة المشاركة
  if (!project.is_shared) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">المشاركة مغلقة</h2>
            <p className="text-gray-600 mb-4">
              تم إيقاف مشاركة هذا المشروع من قبل المسؤول.
            </p>
            <p className="text-sm text-gray-500">
              يرجى التواصل مع مالك المشروع لإعادة تفعيل المشاركة.
            </p>
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
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">المشاركة غير متاحة</h2>
            <p className="text-gray-600">
              عذراً، هذا المشروع غير متاح للمشاركة حالياً.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // حساب الإنفاق الفعلي من المصاريف المرتبطة
  const actualSpent = projectExpenses.reduce((sum: number, exp: any) => {
    const amount = exp.total_amount || exp.amount || 0;
    return sum + amount;
  }, 0);
  
  // حساب نسبة الإنجاز بناءً على الإنفاق الفعلي مقارنة بالميزانية
  const completionPercentage = project.budget ? (actualSpent / project.budget) * 100 : 0;
  
  const remaining = (project.budget || 0) - actualSpent;
  const isOverBudget = remaining < 0;
  
  // حساب الإنفاق المتوقع
  const expectedSpending = expectedExpenses.reduce((sum, exp: any) => {
    const amount = exp.estimated_amount || exp.amount || 0;
    return sum + amount;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* رأس الصفحة */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.code && (
                <Badge variant="outline" className="text-sm">
                  {project.code}
                </Badge>
              )}
              <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
              {project.project_item_name && (
                <Badge variant="secondary" className="text-sm">
                  {project.project_item_icon && (
                    <span className="mr-1">
                      {typeof project.project_item_icon === 'object' && project.project_item_icon !== null 
                        ? (typeof project.project_item_icon === 'object' && project.project_item_icon !== null
                          ? ((project.project_item_icon as any).symbol || (project.project_item_icon as any).name || '')
                          : (project.project_item_icon || '')) 
                        : project.project_item_icon}
                    </span>
                  )}
                  {project.project_item_name}
                </Badge>
              )}
            </div>
          {project.description && <p className="text-gray-600">{project.description}</p>}
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
          <p className="text-3xl font-bold text-indigo-600">{expectedSpending.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">ريال سعودي</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">الإنفاق الفعلي</p>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{actualSpent.toLocaleString()}</p>
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

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">الربح المتوقع</p>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {((project.budget || 0) - expectedSpending).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">ريال سعودي</p>
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
        {!projectExpenses || projectExpenses.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">لا توجد مصروفات مرتبطة بهذا المشروع</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto shadow-lg rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                    <th className="text-right py-4 px-4 font-bold text-gray-800">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        📅 التاريخ
                        <SortIcon field="date" />
                      </button>
                    </th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">📋 التفاصيل</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        🏷️ الفئة
                        <SortIcon field="category" />
                      </button>
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-gray-800">
                      <button
                        onClick={() => handleSort('quantity')}
                        className="flex items-center gap-2 mx-auto hover:text-blue-600 transition-colors"
                      >
                        🔢 الكمية
                        <SortIcon field="quantity" />
                      </button>
                    </th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">💵 سعر الوحدة</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">💳 الدفع</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">📊 الضريبة</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        💰 المبلغ
                        <SortIcon field="amount" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedExpenses.map((expense: any) => {
                    const displayDate = expense.expense_date || expense.date;
                    const displayAmount = expense.total_amount || expense.amount || 0;
                    const categoryName = typeof expense.category === 'object' ? expense.category?.name : expense.category_name;
                    const categoryColor = typeof expense.category === 'object' ? expense.category?.color : expense.category_color;
                    const paymentMethod = typeof expense.payment_method === 'object' ? expense.payment_method?.name : expense.payment_method;
                    const unitName = typeof expense.unit === 'object' ? expense.unit?.name : expense.unit_name;

                    return (
                    <tr key={expense.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                        {displayDate ? new Date(displayDate).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-600 max-w-xs">
                        <div className="line-clamp-2 text-sm" title={expense.description || expense.details}>
                          {expense.description || expense.details || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className="text-xs font-semibold px-3 py-1 whitespace-nowrap"
                          style={{ backgroundColor: categoryColor || '#6b7280' }}
                        >
                          {categoryName || '-'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-700 text-center font-medium whitespace-nowrap">
                        {expense.quantity ? `${expense.quantity} ${unitName || ''}` : '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                        {expense.unit_price ? `${expense.unit_price.toLocaleString()} ر.س` : '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {paymentMethod || '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-700 whitespace-nowrap">
                        {expense.tax_rate ? `${expense.tax_rate}% (${expense.tax_amount?.toLocaleString() || 0} ر.س)` : '-'}
                      </td>
                      <td className="py-4 px-4 font-bold text-lg text-green-700 whitespace-nowrap">
                        {displayAmount.toLocaleString()} ر.س
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gradient-to-r from-green-50 to-green-100">
                  <tr className="border-t-2 border-green-300">
                    <td colSpan={7} className="py-4 px-4 text-right">
                      <span className="text-lg font-bold text-gray-900">💰 الإجمالي:</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xl font-extrabold text-green-700">
                        {projectExpenses.reduce((sum: number, exp: any) => {
                          const amount = exp.total_amount || exp.amount || 0;
                          return sum + amount;
                        }, 0).toLocaleString()} ر.س
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {sortedExpenses.map((expense: any) => {
                const displayDate = expense.expense_date || expense.date;
                const displayAmount = expense.total_amount || expense.amount || 0;
                const categoryName = typeof expense.category === 'object' ? expense.category?.name : expense.category_name;
                const categoryColor = typeof expense.category === 'object' ? expense.category?.color : expense.category_color;
                const paymentMethod = typeof expense.payment_method === 'object' ? expense.payment_method?.name : expense.payment_method;
                const unitName = typeof expense.unit === 'object' ? expense.unit?.name : expense.unit_name;

                return (
                <div key={expense.id} className="bg-white rounded-xl p-5 shadow-md border-r-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-1">
                        {expense.description || expense.details || 'مصروف'}
                      </h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        📅 {displayDate ? new Date(displayDate).toLocaleDateString('ar-SA') : '-'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg px-4 py-2 mr-2">
                      <span className="text-xl font-extrabold text-green-700 whitespace-nowrap">
                        {displayAmount.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  {expense.details && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                      <p className="text-xs text-gray-500 mb-1 font-medium">📋 التفاصيل:</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{expense.details}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {expense.notes && (
                    <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-100">
                      <p className="text-xs text-gray-500 mb-1 font-medium">📝 ملاحظات:</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{expense.notes}</p>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-2 font-medium">🏷️ الفئة</p>
                      <Badge
                        className="text-xs font-semibold px-3 py-1.5"
                        style={{ backgroundColor: categoryColor || '#6b7280' }}
                      >
                        {categoryName || '-'}
                      </Badge>
                    </div>
                    {expense.quantity && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">🔢 الكمية</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {expense.quantity} {unitName || ''}
                        </p>
                      </div>
                    )}
                    {expense.unit_price && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">💵 سعر الوحدة</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {expense.unit_price.toLocaleString()} ر.س
                        </p>
                      </div>
                    )}
                    {paymentMethod && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-2 font-medium">💳 طريقة الدفع</p>
                        <p className="text-sm font-semibold text-gray-900">{paymentMethod}</p>
                      </div>
                    )}
                    {expense.tax_rate > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">📊 الضريبة</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {expense.tax_rate}% ({(expense.tax_amount || 0).toLocaleString()} ر.س)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}

              {/* Mobile Total */}
              <div className="bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 rounded-xl p-5 border-2 border-green-400 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    💰 الإجمالي:
                  </span>
                  <span className="text-2xl font-extrabold text-green-700">
                    {projectExpenses.reduce((sum: number, exp: any) => {
                      const amount = exp.total_amount || exp.amount || 0;
                      return sum + amount;
                    }, 0).toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* الإنفاق المتوقع المرتبط */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">الإنفاق المتوقع المرتبط بالمشروع</h2>
        {!expectedExpenses || expectedExpenses.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">لا يوجد إنفاق متوقع مرتبط بهذا المشروع</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto shadow-lg rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                    <th className="text-right py-4 px-4 font-bold text-gray-800">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-2 hover:text-purple-600 transition-colors"
                      >
                        📅 التاريخ
                        <SortIcon field="date" />
                      </button>
                    </th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">📋 التفاصيل</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center gap-2 hover:text-purple-600 transition-colors"
                      >
                        🏷️ الفئة
                        <SortIcon field="category" />
                      </button>
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-gray-800">
                      <button
                        onClick={() => handleSort('quantity')}
                        className="flex items-center gap-2 mx-auto hover:text-purple-600 transition-colors"
                      >
                        🔢 الكمية
                        <SortIcon field="quantity" />
                      </button>
                    </th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">💵 سعر الوحدة</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">💳 الدفع</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">📊 الضريبة</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-2 hover:text-purple-600 transition-colors"
                      >
                        💰 المبلغ
                        <SortIcon field="amount" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedExpectedExpenses.map((expense: any) => {
                    const displayDate = expense.expected_date || expense.expense_date || expense.date;
                    const displayAmount = expense.estimated_amount || expense.total_amount || expense.amount || 0;
                    const categoryName = typeof expense.category === 'object' 
                      ? expense.category?.name 
                      : expense.category_name;
                    const categoryColor = typeof expense.category === 'object'
                      ? expense.category?.color
                      : expense.category_color;
                    const paymentMethod = typeof expense.payment_method === 'object'
                      ? expense.payment_method?.name
                      : expense.payment_method;
                    const unitName = typeof expense.unit === 'object'
                      ? expense.unit?.name
                      : expense.unit_name;

                    return (
                    <tr key={expense.id} className="hover:bg-purple-50 transition-colors duration-150">
                      <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                        {displayDate ? new Date(displayDate).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-600 max-w-xs">
                        <div className="line-clamp-2 text-sm" title={expense.description || expense.details}>
                          {expense.description || expense.details || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className="text-xs font-semibold px-3 py-1 whitespace-nowrap"
                          style={{ backgroundColor: categoryColor || '#6b7280' }}
                        >
                          {categoryName || '-'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-700 text-center font-medium whitespace-nowrap">
                        {expense.quantity ? `${expense.quantity} ${unitName || ''}` : '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap">
                        {expense.unit_price ? `${expense.unit_price.toLocaleString()} ر.س` : '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {paymentMethod || '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-700 whitespace-nowrap">
                        {expense.tax_rate ? `${expense.tax_rate}% (${expense.tax_amount?.toLocaleString() || 0} ر.س)` : '-'}
                      </td>
                      <td className="py-4 px-4 font-bold text-lg text-purple-700 whitespace-nowrap">
                        {displayAmount.toLocaleString()} ر.س
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <tr className="border-t-2 border-purple-300">
                    <td colSpan={7} className="py-4 px-4 text-right">
                      <span className="text-lg font-bold text-gray-900">💰 الإجمالي:</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xl font-extrabold text-purple-700">
                        {expectedExpenses.reduce((sum: number, exp: any) => {
                          const amount = exp.estimated_amount || exp.total_amount || exp.amount || 0;
                          return sum + amount;
                        }, 0).toLocaleString()} ر.س
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {sortedExpectedExpenses.map((expense: any) => {
                const displayDate = expense.expected_date || expense.expense_date || expense.date;
                const displayAmount = expense.estimated_amount || expense.total_amount || expense.amount || 0;
                const categoryName = typeof expense.category === 'object' ? expense.category?.name : expense.category_name;
                const categoryColor = typeof expense.category === 'object' ? expense.category?.color : expense.category_color;
                const paymentMethod = typeof expense.payment_method === 'object' ? expense.payment_method?.name : expense.payment_method;
                const unitName = typeof expense.unit === 'object' ? expense.unit?.name : expense.unit_name;
                
                return (
                <div key={expense.id} className="bg-white rounded-xl p-5 shadow-md border-r-4 border-purple-500 hover:shadow-lg transition-shadow duration-200">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-1">
                        {expense.description || expense.details || 'إنفاق متوقع'}
                      </h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        📅 {displayDate ? new Date(displayDate).toLocaleDateString('ar-SA') : '-'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg px-4 py-2 mr-2">
                      <span className="text-xl font-extrabold text-purple-700 whitespace-nowrap">
                        {displayAmount.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  {expense.details && (
                    <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-100">
                      <p className="text-xs text-gray-500 mb-1 font-medium">📋 التفاصيل:</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{expense.details}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {expense.notes && (
                    <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-100">
                      <p className="text-xs text-gray-500 mb-1 font-medium">📝 ملاحظات:</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{expense.notes}</p>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-2 font-medium">🏷️ الفئة</p>
                      <Badge
                        className="text-xs font-semibold px-3 py-1.5"
                        style={{ backgroundColor: categoryColor || '#6b7280' }}
                      >
                        {categoryName || '-'}
                      </Badge>
                    </div>
                    
                    {expense.quantity && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">🔢 الكمية</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {expense.quantity} {unitName || ''}
                        </p>
                      </div>
                    )}
                    
                    {expense.unit_price && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">💵 سعر الوحدة</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {expense.unit_price.toLocaleString()} ر.س
                        </p>
                      </div>
                    )}
                    
                    {paymentMethod && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">💳 طريقة الدفع</p>
                        <p className="text-sm font-semibold text-gray-900">{paymentMethod}</p>
                      </div>
                    )}
                    
                    {expense.tax_rate > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">📊 الضريبة</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {expense.tax_rate}% ({(expense.tax_amount || 0).toLocaleString()} ر.س)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}

              {/* Mobile Total */}
              <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 rounded-xl p-5 border-2 border-purple-400 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    💰 الإجمالي:
                  </span>
                  <span className="text-2xl font-extrabold text-purple-700">
                    {expectedExpenses.reduce((sum: number, exp: any) => {
                      const amount = exp.estimated_amount || exp.total_amount || exp.amount || 0;
                      return sum + amount;
                    }, 0).toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
      </div>
    </div>
  );
}
