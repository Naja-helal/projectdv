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
} from 'lucide-react';
import { projectApi, expenseApi, categoryApi } from '@/lib/api';
import Papa from 'papaparse';

type TimeRange = 'month' | 'quarter' | 'year' | 'all';

import { Expense, Project, Category } from '@/types';

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Fetch data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectApi.getProjects,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => expenseApi.getExpenses({}),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories,
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
        const expDate = new Date(exp.date);
        return expDate >= startOfRange && expDate <= now;
      });
    }

    // Filter by custom date range
    if (startDate) {
      filtered = filtered.filter((exp) => new Date(exp.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((exp) => new Date(exp.date) <= new Date(endDate));
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
  }, [expenses, timeRange, startDate, endDate, selectedProjectId, selectedCategoryId]);

  // Calculate statistics
  const totalBudget = useMemo(() => {
    const projectsToCalc = selectedProjectId 
      ? projects.filter(p => p.id === selectedProjectId)
      : projects;
    return projectsToCalc.reduce((sum, p) => sum + (p.budget || 0), 0);
  }, [projects, selectedProjectId]);

  const totalExpected = useMemo(() => {
    const projectsToCalc = selectedProjectId 
      ? projects.filter(p => p.id === selectedProjectId)
      : projects;
    return projectsToCalc.reduce((sum, p) => sum + (p.expected_spending || 0), 0);
  }, [projects, selectedProjectId]);

  const totalActual = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const expenseCount = filteredExpenses.length;

  // Prepare detailed project data for table
  const projectDetailsData = useMemo(() => {
    const projectsToShow = selectedProjectId 
      ? projects.filter(p => p.id === selectedProjectId)
      : projects;

    return projectsToShow.map(project => {
      const projectExpenses = filteredExpenses.filter(exp => exp.project_id === project.id);
      const actualSpending = projectExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const remaining = (project.budget || 0) - actualSpending;
      const percentage = project.budget ? (actualSpending / project.budget) * 100 : 0;

      return {
        id: project.id,
        name: project.name,
        code: project.code || '-',
        status: project.status || '-',
        budget: project.budget || 0,
        expected: project.expected_spending || 0,
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

      return {
        id: expense.id,
        date: new Date(expense.date).toLocaleDateString('ar-SA'),
        project: project?.name || '-',
        projectCode: project?.code || '-',
        category: category?.name || '-',
        item: expense.project_item_name || '-',
        description: expense.description || '-',
        quantity: expense.quantity || 1,
        amount: expense.amount,
        total: (expense.quantity || 1) * expense.amount,
        paymentMethod: expense.payment_method || '-',
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

      if (categoryMap.has(category.id)) {
        const data = categoryMap.get(category.id)!;
        data.count += 1;
        data.total += expense.amount;
      } else {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          count: 1,
          total: expense.amount,
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, categories]);

  // Export to CSV
  const exportToCSV = () => {
    const csvData = expensesDetailsData.map(exp => ({
      'التاريخ': exp.date,
      'المشروع': exp.project,
      'كود المشروع': exp.projectCode,
      'الفئة': exp.category,
      'البند': exp.item,
      'الوصف': exp.description,
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
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">تصفية التقارير</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              النطاق الزمني
            </label>
            <div className="flex gap-2">
              <Button
                variant={timeRange === 'month' ? 'default' : 'outline'}
                onClick={() => setTimeRange('month')}
                className="flex-1"
                size="sm"
              >
                شهري
              </Button>
              <Button
                variant={timeRange === 'quarter' ? 'default' : 'outline'}
                onClick={() => setTimeRange('quarter')}
                className="flex-1"
                size="sm"
              >
                ربع سنوي
              </Button>
              <Button
                variant={timeRange === 'year' ? 'default' : 'outline'}
                onClick={() => setTimeRange('year')}
                className="flex-1"
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
                setSelectedProjectId(null);
                setSelectedCategoryId(null);
              }}
              className="w-full"
            >
              إعادة تعيين
            </Button>
          </div>
        </div>

        {/* Project and Category Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
              {projects.map((project) => (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">عدد المشاريع</p>
              <h3 className="text-3xl font-bold mt-2">
                {selectedProjectId ? 1 : projects.length}
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
      </div>

      {/* Project Details Table */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          تفاصيل المشاريع
        </h3>
        <div className="overflow-x-auto">
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
      </Card>

      {/* Category Summary Table */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          ملخص الفئات
        </h3>
        <div className="overflow-x-auto">
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
      </Card>

      {/* Detailed Expenses Table */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          تفاصيل المصروفات ({expensesDetailsData.length} مصروف)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-right font-semibold text-gray-700">التاريخ</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">المشروع</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الكود</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الفئة</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">البند</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الوصف</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الكمية</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">المبلغ</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {expensesDetailsData.slice(0, 50).map((expense) => (
                <tr key={expense.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{expense.date}</td>
                  <td className="px-4 py-3 font-medium">{expense.project}</td>
                  <td className="px-4 py-3 text-gray-600">{expense.projectCode}</td>
                  <td className="px-4 py-3 text-gray-700">{expense.category}</td>
                  <td className="px-4 py-3 text-gray-700">{expense.item}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {expense.description}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-center">{expense.quantity}</td>
                  <td className="px-4 py-3 text-gray-900">{expense.amount.toLocaleString()} ر.س</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {expense.total.toLocaleString()} ر.س
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expensesDetailsData.length > 50 && (
            <div className="mt-4 text-center text-gray-600 text-sm">
              عرض 50 من {expensesDetailsData.length} مصروف. استخدم التصدير CSV لعرض جميع البيانات.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
