import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Download,
  FileText,
  DollarSign,
  FolderOpen,
  Filter,
  Package,
  CreditCard,
  Layers,
  BarChart3,
  PieChart,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Wallet,
} from 'lucide-react';
import { projectsApi, expensesApi, categoriesApi, projectItemsApi, paymentMethodsApi, clientsApi } from '@/lib/supabaseApi';
import Papa from 'papaparse';

type TimeRange = 'month' | 'quarter' | 'year' | 'all';

import { Expense, Project, Category, ProjectItem, PaymentMethod } from '@/types';

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Fetch data
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: expensesApi.getAll,
  });

  // جلب الإنفاق المتوقع من API
  const { data: expectedExpenses = [] } = useQuery<Expense[]>({
    queryKey: ['expected-expenses'],
    queryFn: async () => {
      const { expectedExpensesApi } = await import('@/lib/supabaseApi');
      return expectedExpensesApi.getAll();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const { data: projectItems = [] } = useQuery<ProjectItem[]>({
    queryKey: ['projectItems'],
    queryFn: projectItemsApi.getAll,
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['paymentMethods'],
    queryFn: paymentMethodsApi.getAll,
  });

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    // Filter by date range
    if (timeRange !== 'all') {
      const now = new Date();
      const startOfRange = new Date();

      switch (timeRange) {
        case 'month':
          startOfRange.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startOfRange.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startOfRange.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.expense_date || exp.date);
        return expDate >= startOfRange && expDate <= now;
      });
    }

    // Filter by custom date range
    if (startDate) {
      filtered = filtered.filter((exp) => new Date(exp.expense_date || exp.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((exp) => new Date(exp.expense_date || exp.date) <= new Date(endDate));
    }

    // Filter by client
    if (selectedClientId) {
      const clientProjects = projects.filter(p => p.client_id === selectedClientId).map(p => p.id);
      filtered = filtered.filter((exp) => exp.project_id && clientProjects.includes(exp.project_id));
    }

    // Filter by project
    if (selectedProjectId) {
      filtered = filtered.filter((exp) => exp.project_id === selectedProjectId);
    }

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter((exp) => exp.category_id === selectedCategoryId);
    }

    return filtered;
  }, [expenses, timeRange, startDate, endDate, selectedClientId, selectedProjectId, selectedCategoryId, projects]);

  // Calculate filtered projects count
  const filteredProjectsCount = useMemo(() => {
    let projectsToCount = projects;
    
    if (selectedClientId) {
      projectsToCount = projectsToCount.filter(p => p.client_id === selectedClientId);
    }
    
    if (selectedProjectId) {
      return 1;
    }
    
    return projectsToCount.length;
  }, [projects, selectedClientId, selectedProjectId]);

  // Calculate statistics
  const totalBudget = useMemo(() => {
    let projectsToCalc = projects;
    
    if (selectedClientId) {
      projectsToCalc = projectsToCalc.filter(p => p.client_id === selectedClientId);
    }
    
    if (selectedProjectId) {
      projectsToCalc = projectsToCalc.filter(p => p.id === selectedProjectId);
    }
    
    return projectsToCalc.reduce((sum, p) => sum + (p.budget || 0), 0);
  }, [projects, selectedClientId, selectedProjectId]);

  const totalExpected = useMemo(() => {
    let filtered = expectedExpenses;
    
    // Filter by client if selected
    if (selectedClientId) {
      const clientProjects = projects.filter(p => p.client_id === selectedClientId).map(p => p.id);
      filtered = filtered.filter(exp => exp.project_id && clientProjects.includes(exp.project_id));
    }
    
    // Filter by project if selected
    if (selectedProjectId) {
      filtered = filtered.filter(exp => exp.project_id === selectedProjectId);
    }
    
    // حساب المبلغ باستخدام نفس المنطق من صفحة الإنفاق المتوقع
    return filtered.reduce((sum, exp) => {
      const amount = (exp as any).estimated_amount || exp.amount || (exp as any).total_amount || 0;
      return sum + amount;
    }, 0);
  }, [expectedExpenses, selectedClientId, selectedProjectId, projects]);

  const totalActual = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => {
      const amount = exp.total_amount || exp.amount || 0;
      return sum + amount;
    }, 0);
  }, [filteredExpenses]);

  const expenseCount = filteredExpenses.length;

  // حساب عدد المصروفات المتوقعة (مع نفس الفلترة)
  const expectedExpenseCount = useMemo(() => {
    let filtered = expectedExpenses;
    
    // Filter by client if selected
    if (selectedClientId) {
      const clientProjects = projects.filter(p => p.client_id === selectedClientId).map(p => p.id);
      filtered = filtered.filter(exp => exp.project_id && clientProjects.includes(exp.project_id));
    }
    
    // Filter by project if selected
    if (selectedProjectId) {
      filtered = filtered.filter(exp => exp.project_id === selectedProjectId);
    }
    
    return filtered.length;
  }, [expectedExpenses, selectedClientId, selectedProjectId, projects]);

  // Prepare detailed project data for table
  const projectDetailsData = useMemo(() => {
    const projectsToShow = selectedProjectId 
      ? projects.filter(p => p.id === selectedProjectId)
      : projects;

    return projectsToShow.map(project => {
      const projectExpenses = filteredExpenses.filter(exp => exp.project_id === project.id);
      const actualSpending = projectExpenses.reduce((sum, exp) => {
        const amount = exp.total_amount || exp.amount || 0;
        return sum + amount;
      }, 0);
      const remaining = (project.budget || 0) - actualSpending;
      const percentage = project.budget ? (actualSpending / project.budget) * 100 : 0;
      
      // حساب الإنفاق المتوقع من صفحة الإنفاق المتوقع
      const projectExpectedExpenses = expectedExpenses.filter(exp => exp.project_id === project.id);
      const expectedSpending = projectExpectedExpenses.reduce((sum, exp) => {
        const amount = (exp as any).estimated_amount || exp.amount || (exp as any).total_amount || 0;
        return sum + amount;
      }, 0);

      return {
        id: project.id,
        name: project.name,
        code: project.code || '-',
        status: project.status || '-',
        budget: project.budget || 0,
        expected: expectedSpending,
        actual: actualSpending,
        remaining: remaining,
        percentage: percentage.toFixed(1),
        expenseCount: projectExpenses.length,
      };
    });
  }, [projects, filteredExpenses, selectedProjectId]);

  // Prepare detailed expenses data for table
  const expensesDetailsData = useMemo(() => {
    return filteredExpenses.map(expense => {
      const project = projects.find(p => p.id === expense.project_id);
      const category = categories.find(c => c.id === expense.category_id);
      
      // استخراج اسم طريقة الدفع من الكائن أو string
      let paymentMethodName = '-';
      if (expense.payment_method) {
        if (typeof expense.payment_method === 'object' && expense.payment_method !== null) {
          paymentMethodName = (expense.payment_method as any).name || '-';
        } else {
          paymentMethodName = expense.payment_method;
        }
      }

      return {
        id: expense.id,
        date: new Date(expense.expense_date || expense.date).toLocaleDateString('ar-SA'),
        project: project?.name || '-',
        projectCode: project?.code || '-',
        category: category?.name || '-',
        item: expense.project_item_name || '-',
        description: expense.description || '-',
        quantity: expense.quantity || 1,
        amount: expense.amount,
        total: expense.total_amount || ((expense.quantity || 1) * expense.amount),
        paymentMethod: paymentMethodName,
      };
    });
  }, [filteredExpenses, projects, categories]);

  // Category summary
  const categoryDetailsData = useMemo(() => {
    const categoryMap = new Map<number, {
      id: number;
      name: string;
      count: number;
      total: number;
    }>();

    filteredExpenses.forEach(expense => {
      const category = categories.find(c => c.id === expense.category_id);
      if (!category) return;

      const expenseAmount = expense.total_amount || expense.amount || 0;

      if (categoryMap.has(category.id)) {
        const data = categoryMap.get(category.id)!;
        data.count += 1;
        data.total += expenseAmount;
      } else {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          count: 1,
          total: expenseAmount,
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, categories]);

  // إحصائيات تصنيف المشاريع
  const projectItemsStats = useMemo(() => {
    const itemsMap = new Map<number, { name: string; count: number; total: number; unit: string }>();
    
    filteredExpenses.forEach(expense => {
      if (expense.project_item_id) {
        const item = projectItems.find(i => i.id === expense.project_item_id);
        if (item) {
          const expenseAmount = expense.total_amount || expense.amount || 0;
          
          // استخراج الوحدة كـ string
          let unitStr = '';
          if (item.unit) {
            if (typeof item.unit === 'object') {
              unitStr = (item.unit as any).symbol || (item.unit as any).name || '';
            } else {
              unitStr = item.unit;
            }
          }
          
          if (itemsMap.has(item.id)) {
            const data = itemsMap.get(item.id)!;
            data.count += expense.quantity || 1;
            data.total += expenseAmount;
          } else {
            itemsMap.set(item.id, {
              name: item.name,
              count: expense.quantity || 1,
              total: expenseAmount,
              unit: unitStr,
            });
          }
        }
      }
    });

    return Array.from(itemsMap.values()).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, projectItems]);

  // إحصائيات طرق الدفع
  const paymentMethodsStats = useMemo(() => {
    const methodsMap = new Map<string, { name: string; count: number; total: number }>();
    
    filteredExpenses.forEach(expense => {
      // استخراج اسم طريقة الدفع من الكائن أو string
      let methodName = 'غير محدد';
      if (expense.payment_method) {
        if (typeof expense.payment_method === 'object' && expense.payment_method !== null) {
          methodName = (expense.payment_method as any).name || 'غير محدد';
        } else {
          methodName = expense.payment_method;
        }
      }
      
      const expenseAmount = expense.total_amount || expense.amount || 0;
      
      if (methodsMap.has(methodName)) {
        const data = methodsMap.get(methodName)!;
        data.count += 1;
        data.total += expenseAmount;
      } else {
        methodsMap.set(methodName, {
          name: methodName,
          count: 1,
          total: expenseAmount,
        });
      }
    });

    return Array.from(methodsMap.values()).sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  // إحصائيات حالة المشاريع
  const projectStatusStats = useMemo(() => {
    const stats = {
      active: { count: 0, budget: 0, actual: 0 },
      completed: { count: 0, budget: 0, actual: 0 },
      on_hold: { count: 0, budget: 0, actual: 0 },
      cancelled: { count: 0, budget: 0, actual: 0 },
    };

    projects.forEach(project => {
      const status = project.status || 'active';
      const projectExpenses = filteredExpenses.filter(e => e.project_id === project.id);
      const actualSpent = projectExpenses.reduce((sum, e) => {
        const amount = e.total_amount || e.amount || 0;
        return sum + amount;
      }, 0);
      
      if (stats[status as keyof typeof stats]) {
        stats[status as keyof typeof stats].count += 1;
        stats[status as keyof typeof stats].budget += project.budget || 0;
        stats[status as keyof typeof stats].actual += actualSpent;
      }
    });

    return stats;
  }, [projects, filteredExpenses]);

  // إحصائيات شهرية
  const monthlyStats = useMemo(() => {
    const monthsMap = new Map<string, { month: string; count: number; total: number }>();
    
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.expense_date || expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
      
      const expenseAmount = expense.total_amount || expense.amount || 0;
      
      if (monthsMap.has(monthKey)) {
        const data = monthsMap.get(monthKey)!;
        data.count += 1;
        data.total += expenseAmount;
      } else {
        monthsMap.set(monthKey, {
          month: monthName,
          count: 1,
          total: expenseAmount,
        });
      }
    });

    return Array.from(monthsMap.values()).sort((a, b) => {
      const [aYear, aMonth] = a.month.split('-');
      const [bYear, bMonth] = b.month.split('-');
      return Number(bYear) - Number(aYear) || Number(bMonth) - Number(aMonth);
    });
  }, [filteredExpenses]);

  // متوسطات وإحصائيات عامة
  const generalStats = useMemo(() => {
    const avgExpenseAmount = expenseCount > 0 ? totalActual / expenseCount : 0;
    const avgProjectBudget = projects.length > 0 ? totalBudget / projects.length : 0;
    const totalRemaining = totalBudget - totalActual;
    const spendingPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return {
      avgExpenseAmount,
      avgProjectBudget,
      totalRemaining,
      spendingPercentage,
      categoriesCount: categories.length,
      projectItemsCount: projectItems.length,
      paymentMethodsCount: paymentMethods.length,
    };
  }, [expenseCount, totalActual, totalBudget, projects.length, categories.length, projectItems.length, paymentMethods.length]);

  // Export to CSV
  const exportToCSV = () => {
    const csvData = expensesDetailsData.map(exp => ({
      'التاريخ': exp.date,
      'المشروع': exp.project,
      'كود المشروع': exp.projectCode,
      'الفئة': exp.category,
      'البند': exp.item,
      'الكمية': exp.quantity,
      'المبلغ': exp.amount,
      'الإجمالي': exp.total,
      'طريقة الدفع': exp.paymentMethod,
    }));

    const csv = Papa.unparse(csvData, {
      quotes: true,
      delimiter: ',',
      header: true,
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير-المصروفات-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId)
    : null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedProject ? `تقرير المشروع: ${selectedProject.name}` : 'التقارير والإحصائيات'}
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedProject ? `كود المشروع: ${selectedProject.code}` : 'تقارير تفصيلية وإحصائيات المشاريع والمصروفات'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
            <Download className="ml-2 h-4 w-4" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">تصفية التقارير</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Time Range */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              النطاق الزمني
            </label>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant={timeRange === 'month' ? 'default' : 'outline'}
                onClick={() => setTimeRange('month')}
                className="flex-1 min-h-[40px] text-xs sm:text-sm"
                size="sm"
              >
                شهري
              </Button>
              <Button
                variant={timeRange === 'quarter' ? 'default' : 'outline'}
                onClick={() => setTimeRange('quarter')}
                className="flex-1 min-h-[40px] text-xs sm:text-sm"
                size="sm"
              >
                ربع سنوي
              </Button>
              <Button
                variant={timeRange === 'year' ? 'default' : 'outline'}
                onClick={() => setTimeRange('year')}
                className="flex-1 min-h-[40px] text-xs sm:text-sm"
                size="sm"
              >
                سنوي
              </Button>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            />
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setTimeRange('all');
                setStartDate('');
                setEndDate('');
                setSelectedClientId(null);
                setSelectedProjectId(null);
                setSelectedCategoryId(null);
              }}
              className="w-full"
            >
              إعادة تعيين
            </Button>
          </div>
        </div>

        {/* Client, Project and Category Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              العميل
            </label>
            <select
              value={selectedClientId || ''}
              onChange={(e) => {
                setSelectedClientId(e.target.value ? Number(e.target.value) : null);
                setSelectedProjectId(null); // Reset project when client changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">كل العملاء</option>
              {clients.map((client: any) => {
                const iconStr = typeof client.icon === 'object' && client.icon !== null 
                  ? (client.icon.symbol || client.icon.name || '') 
                  : (client.icon || '');
                return (
                  <option key={client.id} value={client.id}>
                    {iconStr ? `${iconStr} ` : ''}{client.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              المشروع
            </label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">كل المشاريع</option>
              {(selectedClientId 
                ? projects.filter(p => p.client_id === selectedClientId)
                : projects
              ).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.code}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              الفئة
            </label>
            <select
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">كل الفئات</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Projects */}
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">عدد المشاريع</p>
              <h3 className="text-3xl font-bold mt-2">
                {filteredProjectsCount}
              </h3>
            </div>
            <FolderOpen className="h-12 w-12 text-blue-200" />
          </div>
        </Card>

        {/* Total Budget */}
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">إجمالي الميزانية</p>
              <h3 className="text-2xl font-bold mt-2">
                {totalBudget.toLocaleString()} ر.س
              </h3>
            </div>
            <DollarSign className="h-12 w-12 text-purple-200" />
          </div>
        </Card>

        {/* Actual Spending */}
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">الإنفاق الفعلي</p>
              <h3 className="text-2xl font-bold mt-2">
                {totalActual.toLocaleString()} ر.س
              </h3>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </Card>

        {/* Expected Expenses */}
        <Card className="p-6 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm">الإنفاق المتوقع</p>
              <h3 className="text-2xl font-bold mt-2">
                {totalExpected.toLocaleString()} ر.س
              </h3>
              <p className="text-violet-200 text-xs mt-1">
                {expectedExpenseCount} مصروف
              </p>
            </div>
            <FileText className="h-12 w-12 text-violet-200" />
          </div>
        </Card>

        {/* Expense Count */}
        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">عدد المصروفات</p>
              <h3 className="text-3xl font-bold mt-2">{expenseCount}</h3>
            </div>
            <FileText className="h-12 w-12 text-orange-200" />
          </div>
        </Card>

        {/* Expected Profit */}
        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">الربح المتوقع</p>
              <h3 className="text-2xl font-bold mt-2">
                {(totalBudget - totalExpected).toLocaleString()} ر.س
              </h3>
            </div>
            <TrendingUp className="h-12 w-12 text-emerald-200" />
          </div>
        </Card>
      </div>

      {/* إحصائيات شاملة إضافية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* المتبقي من الميزانية */}
        <Card className="p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">المتبقي من الميزانية</p>
              <h3 className="text-2xl font-bold mt-2">
                {generalStats.totalRemaining.toLocaleString()} ر.س
              </h3>
              <p className="text-cyan-200 text-xs mt-1">
                {generalStats.spendingPercentage.toFixed(1)}% مُستخدم
              </p>
            </div>
            <Wallet className="h-12 w-12 text-cyan-200" />
          </div>
        </Card>

        {/* متوسط قيمة المصروف */}
        <Card className="p-6 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">متوسط قيمة المصروف</p>
              <h3 className="text-2xl font-bold mt-2">
                {generalStats.avgExpenseAmount.toLocaleString()} ر.س
              </h3>
            </div>
            <BarChart3 className="h-12 w-12 text-pink-200" />
          </div>
        </Card>

        {/* عدد الفئات */}
        <Card className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">عدد الفئات</p>
              <h3 className="text-3xl font-bold mt-2">{generalStats.categoriesCount}</h3>
            </div>
            <Package className="h-12 w-12 text-indigo-200" />
          </div>
        </Card>

        {/* عدد تصنيفات المشاريع */}
        <Card className="p-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm">تصنيف المشاريع</p>
              <h3 className="text-3xl font-bold mt-2">{generalStats.projectItemsCount}</h3>
            </div>
            <Layers className="h-12 w-12 text-teal-200" />
          </div>
        </Card>
      </div>

      {/* إحصائيات حالة المشاريع */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          إحصائيات حالة المشاريع
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* مشاريع نشطة */}
          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h4 className="font-semibold text-green-900">نشط</h4>
            </div>
            <p className="text-2xl font-bold text-green-700">{projectStatusStats.active.count}</p>
            <p className="text-sm text-green-600 mt-1">
              الميزانية: {projectStatusStats.active.budget.toLocaleString()} ر.س
            </p>
            <p className="text-sm text-green-600">
              الإنفاق: {projectStatusStats.active.actual.toLocaleString()} ر.س
            </p>
          </div>

          {/* مشاريع مكتملة */}
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              <h4 className="font-semibold text-blue-900">مكتمل</h4>
            </div>
            <p className="text-2xl font-bold text-blue-700">{projectStatusStats.completed.count}</p>
            <p className="text-sm text-blue-600 mt-1">
              الميزانية: {projectStatusStats.completed.budget.toLocaleString()} ر.س
            </p>
            <p className="text-sm text-blue-600">
              الإنفاق: {projectStatusStats.completed.actual.toLocaleString()} ر.س
            </p>
          </div>

          {/* مشاريع متوقفة */}
          <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-6 w-6 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">متوقف مؤقتاً</h4>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{projectStatusStats.on_hold.count}</p>
            <p className="text-sm text-yellow-600 mt-1">
              الميزانية: {projectStatusStats.on_hold.budget.toLocaleString()} ر.س
            </p>
            <p className="text-sm text-yellow-600">
              الإنفاق: {projectStatusStats.on_hold.actual.toLocaleString()} ر.س
            </p>
          </div>

          {/* مشاريع ملغاة */}
          <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <h4 className="font-semibold text-red-900">ملغي</h4>
            </div>
            <p className="text-2xl font-bold text-red-700">{projectStatusStats.cancelled.count}</p>
            <p className="text-sm text-red-600 mt-1">
              الميزانية: {projectStatusStats.cancelled.budget.toLocaleString()} ر.س
            </p>
            <p className="text-sm text-red-600">
              الإنفاق: {projectStatusStats.cancelled.actual.toLocaleString()} ر.س
            </p>
          </div>
        </div>
      </Card>

      {/* إحصائيات تصنيف المشاريع */}
      {projectItemsStats.length > 0 && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            أكثر تصنيفات المشاريع استخداماً
          </h3>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">العنصر</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">الكمية المستخدمة</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">الوحدة</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">إجمالي القيمة</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {projectItemsStats.slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {item.count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.unit || '-'}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {item.total.toLocaleString()} ر.س
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${totalActual > 0 ? (item.total / totalActual) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-gray-700 font-medium min-w-[50px]">
                          {totalActual > 0 ? ((item.total / totalActual) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {projectItemsStats.slice(0, 10).map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                  <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                    #{idx + 1}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">الكمية</p>
                    <p className="text-sm font-bold text-indigo-900">
                      {item.count.toLocaleString()} {item.unit || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">القيمة الإجمالية</p>
                    <p className="text-sm font-bold text-indigo-900">{item.total.toLocaleString()} ر.س</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${totalActual > 0 ? (item.total / totalActual) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-indigo-900 min-w-[45px]">
                    {totalActual > 0 ? ((item.total / totalActual) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* إحصائيات طرق الدفع */}
      {paymentMethodsStats.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            إحصائيات طرق الدفع
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethodsStats.map((method, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">{method.name}</h4>
                <p className="text-2xl font-bold text-gray-800">
                  {method.total.toLocaleString()} ر.س
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {method.count} عملية ({totalActual > 0 ? ((method.total / totalActual) * 100).toFixed(1) : 0}%)
                </p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${totalActual > 0 ? (method.total / totalActual) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* الإحصائيات الشهرية */}
      {monthlyStats.length > 0 && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            الإحصائيات الشهرية
          </h3>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">الشهر</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">عدد المصروفات</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">إجمالي الإنفاق</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">متوسط المصروف</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">النسبة من الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.slice(0, 12).map((month, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{month.month}</td>
                    <td className="px-4 py-3 text-gray-600">{month.count}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {month.total.toLocaleString()} ر.س
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {(month.total / month.count).toLocaleString()} ر.س
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${totalActual > 0 ? (month.total / totalActual) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-gray-700 font-medium min-w-[50px]">
                          {totalActual > 0 ? ((month.total / totalActual) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {monthlyStats.slice(0, 12).map((month, idx) => (
              <div key={idx} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 text-sm">{month.month}</h4>
                  <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                    {month.count} مصروف
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">إجمالي الإنفاق</p>
                    <p className="text-sm font-bold text-purple-900">{month.total.toLocaleString()} ر.س</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">متوسط المصروف</p>
                    <p className="text-sm font-bold text-purple-900">
                      {(month.total / month.count).toLocaleString()} ر.س
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${totalActual > 0 ? (month.total / totalActual) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-purple-900 min-w-[45px]">
                    {totalActual > 0 ? ((month.total / totalActual) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Project Details Table */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5" />
          تفاصيل المشاريع
        </h3>
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-right font-semibold text-gray-700">المشروع</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الكود</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الحالة</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الميزانية</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">المتوقع</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الفعلي</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">المتبقي</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">النسبة</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">العدد</th>
              </tr>
            </thead>
            <tbody>
              {projectDetailsData.map((project) => (
                <tr key={project.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{project.name}</td>
                  <td className="px-4 py-3 text-gray-600">{project.code}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status === 'completed' ? 'مكتمل' :
                       project.status === 'active' ? 'نشط' :
                       project.status === 'on_hold' ? 'متوقف' : 'ملغي'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {project.budget.toLocaleString()} ر.س
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {project.expected.toLocaleString()} ر.س
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {project.actual.toLocaleString()} ر.س
                  </td>
                  <td className="px-4 py-3">
                    <span className={project.remaining >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {project.remaining.toLocaleString()} ر.س
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${
                      parseFloat(project.percentage) > 100 ? 'text-red-600' :
                      parseFloat(project.percentage) > 80 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {project.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{project.expenseCount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right">الإجمالي</td>
                <td className="px-4 py-3">{totalBudget.toLocaleString()} ر.س</td>
                <td className="px-4 py-3">{totalExpected.toLocaleString()} ر.س</td>
                <td className="px-4 py-3">{totalActual.toLocaleString()} ر.س</td>
                <td className="px-4 py-3">
                  <span className={totalBudget - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {(totalBudget - totalActual).toLocaleString()} ر.س
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`${
                    totalBudget > 0 && (totalActual / totalBudget) * 100 > 100 ? 'text-red-600' :
                    totalBudget > 0 && (totalActual / totalBudget) * 100 > 80 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : 0}%
                  </span>
                </td>
                <td className="px-4 py-3">{expenseCount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {projectDetailsData.map((project) => (
            <div key={project.id} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">{project.name}</h4>
                  <p className="text-xs text-gray-600">كود: {project.code}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  project.status === 'completed' ? 'bg-green-100 text-green-800' :
                  project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status === 'completed' ? 'مكتمل' :
                   project.status === 'active' ? 'نشط' :
                   project.status === 'on_hold' ? 'متوقف' : 'ملغي'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white bg-opacity-60 rounded p-2">
                  <p className="text-xs text-gray-600 mb-1">الميزانية</p>
                  <p className="text-sm font-bold text-gray-900">{project.budget.toLocaleString()} ر.س</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded p-2">
                  <p className="text-xs text-gray-600 mb-1">الإنفاق الفعلي</p>
                  <p className="text-sm font-bold text-gray-900">{project.actual.toLocaleString()} ر.س</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded p-2">
                  <p className="text-xs text-gray-600 mb-1">المتبقي</p>
                  <p className={`text-sm font-bold ${project.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {project.remaining.toLocaleString()} ر.س
                  </p>
                </div>
                <div className="bg-white bg-opacity-60 rounded p-2">
                  <p className="text-xs text-gray-600 mb-1">النسبة</p>
                  <p className={`text-sm font-bold ${
                    parseFloat(project.percentage) > 100 ? 'text-red-600' :
                    parseFloat(project.percentage) > 80 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {project.percentage}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 bg-white bg-opacity-60 rounded p-2">
                <span>عدد المصروفات: <strong className="text-gray-900">{project.expenseCount}</strong></span>
                <span>المتوقع: <strong className="text-gray-900">{project.expected.toLocaleString()} ر.س</strong></span>
              </div>
            </div>
          ))}

          {/* Mobile Summary */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 border-2 border-gray-300">
            <h4 className="font-bold text-gray-900 mb-3 text-center">الإجمالي الكلي</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded p-2">
                <p className="text-xs text-gray-600 mb-1">الميزانية</p>
                <p className="text-sm font-bold text-gray-900">{totalBudget.toLocaleString()} ر.س</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="text-xs text-gray-600 mb-1">الإنفاق</p>
                <p className="text-sm font-bold text-gray-900">{totalActual.toLocaleString()} ر.س</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="text-xs text-gray-600 mb-1">المتبقي</p>
                <p className={`text-sm font-bold ${totalBudget - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(totalBudget - totalActual).toLocaleString()} ر.س
                </p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="text-xs text-gray-600 mb-1">النسبة</p>
                <p className={`text-sm font-bold ${
                  totalBudget > 0 && (totalActual / totalBudget) * 100 > 100 ? 'text-red-600' :
                  totalBudget > 0 && (totalActual / totalBudget) * 100 > 80 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Summary Table */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
          ملخص الفئات
        </h3>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الفئة</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">عدد المصروفات</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">إجمالي المبلغ</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">النسبة من الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {categoryDetailsData.map((category) => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-gray-600">{category.count}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {category.total.toLocaleString()} ر.س
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${totalActual > 0 ? (category.total / totalActual) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-gray-700 font-medium min-w-[50px]">
                        {totalActual > 0 ? ((category.total / totalActual) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {categoryDetailsData.map((category) => (
            <div key={category.id} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <h4 className="font-bold text-gray-900 mb-3">{category.name}</h4>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">عدد المصروفات</p>
                  <p className="text-sm font-bold text-blue-900">{category.count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">إجمالي المبلغ</p>
                  <p className="text-sm font-bold text-blue-900">{category.total.toLocaleString()} ر.س</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${totalActual > 0 ? (category.total / totalActual) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-blue-900 min-w-[45px]">
                  {totalActual > 0 ? ((category.total / totalActual) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Expenses Table */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          تفاصيل المصروفات ({expensesDetailsData.length} مصروف)
        </h3>
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto shadow-lg rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                <th className="px-4 py-3 text-right font-bold text-gray-800">📅 التاريخ</th>
                <th className="px-4 py-3 text-right font-bold text-gray-800">🎯 المشروع</th>
                <th className="px-4 py-3 text-right font-bold text-gray-800">🔢 الكود</th>
                <th className="px-4 py-3 text-right font-bold text-gray-800">🏷️ الفئة</th>
                <th className="px-4 py-3 text-right font-bold text-gray-800">📋 التفاصيل</th>
                <th className="px-4 py-3 text-center font-bold text-gray-800">🔢 الكمية</th>
                <th className="px-4 py-3 text-right font-bold text-gray-800">💵 سعر الوحدة</th>
                <th className="px-4 py-3 text-right font-bold text-gray-800">💳 الدفع</th>
                <th className="px-4 py-3 text-right font-bold text-gray-800">📊 الضريبة</th>
                <th className="px-4 py-3 text-right font-bold text-gray-800">💰 المبلغ</th>
                <th className="px-4 py-3 text-right font-bold text-gray-800">💎 الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expensesDetailsData.slice(0, 50).map((expense) => {
                const fullExpense = filteredExpenses.find(e => e.id === expense.id);
                return (
                  <tr key={expense.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{expense.date}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{expense.project}</td>
                    <td className="px-4 py-3 text-gray-600">{expense.projectCode}</td>
                    <td className="px-4 py-3 text-gray-700">{expense.category}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <div className="line-clamp-2 text-sm" title={fullExpense?.details}>
                        {fullExpense?.details || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-center font-medium whitespace-nowrap">
                      {expense.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                      {fullExpense?.unit_price ? `${fullExpense.unit_price.toLocaleString()} ر.س` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {fullExpense?.payment_method 
                        ? (typeof fullExpense.payment_method === 'object' && fullExpense.payment_method !== null
                          ? ((fullExpense.payment_method as any).name || '-')
                          : fullExpense.payment_method)
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {fullExpense?.tax_rate ? `${fullExpense.tax_rate}% (${fullExpense.tax_amount?.toLocaleString() || 0} ر.س)` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{expense.amount.toLocaleString()} ر.س</td>
                    <td className="px-4 py-3 text-green-700 font-bold text-lg whitespace-nowrap">
                      {expense.total.toLocaleString()} ر.س
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {expensesDetailsData.length > 50 && (
            <div className="mt-4 text-center text-gray-600 text-sm bg-gray-50 p-3 rounded">
              عرض 50 من {expensesDetailsData.length} مصروف. استخدم التصدير CSV لعرض جميع البيانات.
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {expensesDetailsData.slice(0, 20).map((expense) => {
            const fullExpense = filteredExpenses.find(e => e.id === expense.id);
            return (
              <div key={expense.id} className="bg-white rounded-xl p-4 shadow-md border-r-4 border-blue-500">
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-base mb-1">{expense.project}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      📅 {expense.date} • 🔢 {expense.projectCode}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg px-3 py-2 mr-2">
                    <span className="text-lg font-extrabold text-green-700 whitespace-nowrap">
                      {expense.total.toLocaleString()} ر.س
                    </span>
                  </div>
                </div>

                {/* Details */}
                {fullExpense?.details && (
                  <div className="bg-indigo-50 rounded-lg p-3 mb-3 border border-indigo-100">
                    <p className="text-xs text-gray-500 mb-1 font-medium">📋 التفاصيل:</p>
                    <p className="text-sm text-gray-700">{fullExpense.details}</p>
                  </div>
                )}

                {/* Notes */}
                {fullExpense?.notes && (
                  <div className="bg-amber-50 rounded-lg p-3 mb-3 border border-amber-100">
                    <p className="text-xs text-gray-500 mb-1 font-medium">📝 ملاحظات:</p>
                    <p className="text-sm text-gray-700">{fullExpense.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1">🏷️ الفئة</p>
                    <p className="text-sm font-semibold text-gray-900">{expense.category}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1">🔢 الكمية</p>
                    <p className="text-sm font-semibold text-gray-900">{expense.quantity}</p>
                  </div>
                  {fullExpense?.unit_price && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-1">💵 سعر الوحدة</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {fullExpense.unit_price.toLocaleString()} ر.س
                      </p>
                    </div>
                  )}
                  {fullExpense?.payment_method && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-1">💳 الدفع</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {typeof fullExpense.payment_method === 'object' && fullExpense.payment_method !== null
                          ? ((fullExpense.payment_method as any).name || '-')
                          : fullExpense.payment_method}
                      </p>
                    </div>
                  )}
                  {fullExpense?.tax_rate && fullExpense.tax_rate > 0 && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-1">📊 الضريبة</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {fullExpense.tax_rate}% ({(fullExpense.tax_amount || 0).toLocaleString()} ر.س)
                      </p>
                    </div>
                  )}
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1">💰 المبلغ</p>
                    <p className="text-sm font-bold text-blue-700">{expense.amount.toLocaleString()} ر.س</p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {expensesDetailsData.length > 20 && (
            <div className="text-center py-3 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
              عرض 20 من {expensesDetailsData.length} مصروف
              <br />
              <span className="text-xs">استخدم التصدير CSV لعرض جميع البيانات</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
