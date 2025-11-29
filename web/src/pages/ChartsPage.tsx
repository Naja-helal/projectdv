import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expenseApi, projectApi, categoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, Filter, X } from 'lucide-react';
import { Expense, Project, Category } from '@/types';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

type TimeRange = 'month' | 'quarter' | 'year' | 'all';

export default function ChartsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // جلب البيانات
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => expenseApi.getExpenses({})
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects()
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories
  });

  // تصفية المصروفات
  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    // تصفية حسب الفترة الزمنية
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

    // تصفية حسب المشروع
    if (selectedProjectId) {
      filtered = filtered.filter((exp) => exp.project_id === selectedProjectId);
    }

    // تصفية حسب الفئة
    if (selectedCategoryId) {
      filtered = filtered.filter((exp) => exp.category_id === selectedCategoryId);
    }

    return filtered;
  }, [expenses, timeRange, selectedProjectId, selectedCategoryId]);

  // إحصائيات سريعة
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const expenseCount = filteredExpenses.length;

  const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

  const activeProjects = useMemo(() => {
    const projectIds = new Set(filteredExpenses.map(exp => exp.project_id));
    return projectIds.size;
  }, [filteredExpenses]);

  // 1. المصروفات حسب الفئات
  const categoryData = useMemo(() => {
    const categoryMap = new Map<number, { name: string; value: number; color: string }>();

    filteredExpenses.forEach((exp) => {
      const categoryId = exp.category_id || 0;
      const categoryName = exp.category_name || 'غير محدد';
      const categoryColor = exp.category_color || '#6b7280';

      if (categoryMap.has(categoryId)) {
        const data = categoryMap.get(categoryId)!;
        data.value += exp.amount;
      } else {
        categoryMap.set(categoryId, {
          name: categoryName,
          value: exp.amount,
          color: categoryColor
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [filteredExpenses]);

  // 2. المصروفات حسب المشاريع (أعلى 10)
  const projectData = useMemo(() => {
    const projectMap = new Map<number, { name: string; value: number }>();

    filteredExpenses.forEach((exp) => {
      const projectId = exp.project_id || 0;
      const projectName = exp.project_name || 'بدون مشروع';

      if (projectMap.has(projectId)) {
        const data = projectMap.get(projectId)!;
        data.value += exp.amount;
      } else {
        projectMap.set(projectId, {
          name: projectName,
          value: exp.amount
        });
      }
    });

    return Array.from(projectMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredExpenses]);

  // 3. المصروفات الشهرية (آخر 6 أشهر)
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { month: string; amount: number }>();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    filteredExpenses
      .filter(exp => new Date(exp.date) >= sixMonthsAgo)
      .forEach((exp) => {
        const monthKey = format(new Date(exp.date), 'yyyy-MM');
        const monthName = format(new Date(exp.date), 'MMM yyyy', { locale: ar });

        if (monthMap.has(monthKey)) {
          const data = monthMap.get(monthKey)!;
          data.amount += exp.amount;
        } else {
          monthMap.set(monthKey, {
            month: monthName,
            amount: exp.amount
          });
        }
      });

    return Array.from(monthMap.values()).sort((a, b) => {
      const [aYear, aMonth] = a.month.split(' ');
      const [bYear, bMonth] = b.month.split(' ');
      return new Date(`${aMonth} ${aYear}`).getTime() - new Date(`${bMonth} ${bYear}`).getTime();
    });
  }, [filteredExpenses]);

  // 4. مقارنة الميزانية بالإنفاق
  const budgetComparisonData = useMemo(() => {
    const projectsToShow = selectedProjectId 
      ? projects.filter(p => p.id === selectedProjectId)
      : projects.slice(0, 10);

    return projectsToShow.map(project => {
      const projectExpenses = filteredExpenses.filter(exp => exp.project_id === project.id);
      const actualSpending = projectExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      return {
        name: project.name,
        budget: project.budget || 0,
        spending: actualSpending,
        expected: project.expected_spending || 0
      };
    });
  }, [projects, filteredExpenses, selectedProjectId]);

  // 5. المصروفات اليومية (آخر 15 يوم)
  const dailyData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; amount: number }>();

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    filteredExpenses
      .filter(exp => new Date(exp.date) >= fifteenDaysAgo)
      .forEach((exp) => {
        const dateKey = format(new Date(exp.date), 'yyyy-MM-dd');
        const dateName = format(new Date(exp.date), 'dd MMM', { locale: ar });

        if (dailyMap.has(dateKey)) {
          const data = dailyMap.get(dateKey)!;
          data.amount += exp.amount;
        } else {
          dailyMap.set(dateKey, {
            date: dateName,
            amount: exp.amount
          });
        }
      });

    return Array.from(dailyMap.values()).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredExpenses]);

  // 6. طرق الدفع
  const paymentMethodData = useMemo(() => {
    const paymentMap = new Map<string, { name: string; value: number }>();

    filteredExpenses.forEach((exp) => {
      const paymentMethod = exp.payment_method || 'غير محدد';

      if (paymentMap.has(paymentMethod)) {
        const data = paymentMap.get(paymentMethod)!;
        data.value += exp.amount;
      } else {
        paymentMap.set(paymentMethod, {
          name: paymentMethod,
          value: exp.amount
        });
      }
    });

    return Array.from(paymentMap.values());
  }, [filteredExpenses]);

  // 7. عدد المصروفات حسب الفئات
  const categoryCountData = useMemo(() => {
    const countMap = new Map<number, { name: string; count: number }>();

    filteredExpenses.forEach((exp) => {
      const categoryId = exp.category_id || 0;
      const categoryName = exp.category_name || 'غير محدد';

      if (countMap.has(categoryId)) {
        const data = countMap.get(categoryId)!;
        data.count += 1;
      } else {
        countMap.set(categoryId, {
          name: categoryName,
          count: 1
        });
      }
    });

    return Array.from(countMap.values());
  }, [filteredExpenses]);

  // Tooltip مخصص
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg" dir="rtl">
          <p className="font-semibold">{payload[0].payload.name || payload[0].payload.month || payload[0].payload.date}</p>
          <p className="text-primary">
            {payload[0].value.toLocaleString()} ر.س
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4" dir="rtl">
      <div className="flex flex-col gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            📊 الرسومات البيانية
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            عرض شامل لجميع إحصائيات المشروع
          </p>
        </div>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            التصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {/* الفترة الزمنية */}
            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">الفترة الزمنية</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={timeRange === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('month')}
                  className="text-xs sm:text-sm min-h-[40px] sm:min-h-[36px]"
                >
                  شهر
                </Button>
                <Button
                  variant={timeRange === 'quarter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('quarter')}
                  className="text-xs sm:text-sm min-h-[40px] sm:min-h-[36px]"
                >
                  3 أشهر
                </Button>
                <Button
                  variant={timeRange === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('year')}
                  className="text-xs sm:text-sm min-h-[40px] sm:min-h-[36px]"
                >
                  سنة
                </Button>
                <Button
                  variant={timeRange === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('all')}
                  className="text-xs sm:text-sm min-h-[40px] sm:min-h-[36px]"
                >
                  الكل
                </Button>
              </div>
            </div>

            {/* المشروع */}
            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">المشروع</label>
              <div className="flex gap-2">
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 min-h-[44px] sm:h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">جميع المشاريع</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {selectedProjectId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProjectId(null)}
                    className="min-h-[44px] sm:h-9 px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* الفئة */}
            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">الفئة</label>
              <div className="flex gap-2">
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 min-h-[44px] sm:h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">جميع الفئات</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {selectedCategoryId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategoryId(null)}
                    className="min-h-[44px] sm:h-9 px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div className="w-full">
                <p className="text-xs sm:text-sm text-muted-foreground">إجمالي المصروفات</p>
                <p className="text-lg sm:text-2xl font-bold text-primary break-words">
                  {totalExpenses.toLocaleString()} ر.س
                </p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div className="w-full">
                <p className="text-xs sm:text-sm text-muted-foreground">عدد المصروفات</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{expenseCount}</p>
              </div>
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div className="w-full">
                <p className="text-xs sm:text-sm text-muted-foreground">متوسط المصروف</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600 break-words">
                  {averageExpense.toLocaleString()} ر.س
                </p>
              </div>
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div className="w-full">
                <p className="text-xs sm:text-sm text-muted-foreground">المشاريع النشطة</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{activeProjects}</p>
              </div>
              <PieChartIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسومات البيانية */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* 1. المصروفات حسب الفئات */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">المصروفات حسب الفئات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / totalExpenses) * 100).toFixed(1)}%`}
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. أعلى 10 مشاريع */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">أعلى 10 مشاريع إنفاقاً</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                />
                <YAxis fontSize={window.innerWidth < 640 ? 10 : 12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. المصروفات الشهرية */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">المصروفات الشهرية (آخر 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                />
                <YAxis fontSize={window.innerWidth < 640 ? 10 : 12} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. مقارنة الميزانية بالإنفاق */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">الميزانية مقابل الإنفاق الفعلي</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                />
                <YAxis fontSize={window.innerWidth < 640 ? 10 : 12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '11px' : '12px' }} />
                <Bar dataKey="budget" fill="#3b82f6" name="الميزانية" />
                <Bar dataKey="spending" fill="#ef4444" name="الإنفاق الفعلي" />
                <Bar dataKey="expected" fill="#f59e0b" name="الإنفاق المتوقع" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 5. المصروفات اليومية */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">المصروفات اليومية (آخر 15 يوم)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                />
                <YAxis fontSize={window.innerWidth < 640 ? 10 : 12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6. طرق الدفع */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">توزيع طرق الدفع</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 7. عدد المصروفات حسب الفئات */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">عدد المصروفات حسب الفئات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryCountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                />
                <YAxis fontSize={window.innerWidth < 640 ? 10 : 12} />
                <Tooltip />
                <Bar dataKey="count" fill="#14b8a6" name="عدد المصروفات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
