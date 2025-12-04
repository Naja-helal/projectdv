import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expensesApi, projectsApi, categoriesApi, clientsApi } from '@/lib/supabaseApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
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

// ألوان احترافية متناسقة مثل Power BI
const COLORS = [
  '#0078D4', // أزرق رئيسي
  '#00BCF2', // أزرق فاتح
  '#00B294', // أخضر
  '#FFB900', // ذهبي
  '#8661C5', // بنفسجي
  '#E74856', // أحمر
  '#FF8C00', // برتقالي
  '#00CC6A', // أخضر فاتح
  '#E3008C', // وردي
  '#68217A'  // بنفسجي غامق
];

type TimeRange = 'month' | 'quarter' | 'year' | 'all';

export default function ChartsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // جلب البيانات
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: expensesApi.getAll
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll
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
        const expDate = new Date(exp.expense_date || exp.date);
        return expDate >= startOfRange && expDate <= now;
      });
    }

    // تصفية حسب العميل
    if (selectedClientId) {
      const clientProjects = projects.filter(p => p.client_id === selectedClientId).map(p => p.id);
      filtered = filtered.filter((exp) => clientProjects.includes(exp.project_id || 0));
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
  }, [expenses, timeRange, selectedClientId, selectedProjectId, selectedCategoryId, projects]);

  // إحصائيات سريعة
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (exp.total_amount || exp.amount || 0), 0);
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
      
      // استخراج اسم الفئة من الحقول المباشرة أو من القائمة
      let categoryName = exp.category_name || 'غير محدد';
      let categoryColor = exp.category_color || '#6b7280';
      
      if (!exp.category_name) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          categoryName = category.name;
          categoryColor = category.color || '#6b7280';
        }
      }
      
      const expAmount = exp.total_amount || exp.amount || 0;

      if (categoryMap.has(categoryId)) {
        const data = categoryMap.get(categoryId)!;
        data.value += expAmount;
      } else {
        categoryMap.set(categoryId, {
          name: categoryName,
          value: expAmount,
          color: categoryColor
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [filteredExpenses, categories]);

  // 2. المصروفات حسب المشاريع (أعلى 10)
  const projectData = useMemo(() => {
    const projectMap = new Map<number, { name: string; value: number }>();

    filteredExpenses.forEach((exp) => {
      const projectId = exp.project_id || 0;
      
      // استخراج اسم المشروع من الحقول المباشرة أو من القائمة
      let projectName = exp.project_name || 'بدون مشروع';
      
      if (!exp.project_name) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          projectName = project.name;
        }
      }
      
      const expAmount = exp.total_amount || exp.amount || 0;

      if (projectMap.has(projectId)) {
        const data = projectMap.get(projectId)!;
        data.value += expAmount;
      } else {
        projectMap.set(projectId, {
          name: projectName,
          value: expAmount
        });
      }
    });

    return Array.from(projectMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredExpenses, projects]);

  // 3. المصروفات الشهرية (آخر 6 أشهر)
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { month: string; amount: number }>();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    filteredExpenses
      .filter(exp => new Date(exp.expense_date || exp.date) >= sixMonthsAgo)
      .forEach((exp) => {
        const expDate = new Date(exp.expense_date || exp.date);
        const monthKey = format(expDate, 'yyyy-MM');
        const monthName = format(expDate, 'MMM yyyy', { locale: ar });
        const expAmount = exp.total_amount || exp.amount || 0;

        if (monthMap.has(monthKey)) {
          const data = monthMap.get(monthKey)!;
          data.amount += expAmount;
        } else {
          monthMap.set(monthKey, {
            month: monthName,
            amount: expAmount
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
      const actualSpending = projectExpenses.reduce((sum, exp) => sum + (exp.total_amount || exp.amount || 0), 0);

      return {
        name: project.name,
        budget: project.budget || 0,
        spending: actualSpending
      };
    });
  }, [projects, filteredExpenses, selectedProjectId]);

  // 5. المصروفات اليومية (آخر 15 يوم)
  const dailyData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; amount: number }>();

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    filteredExpenses
      .filter(exp => new Date(exp.expense_date || exp.date) >= fifteenDaysAgo)
      .forEach((exp) => {
        const expDate = new Date(exp.expense_date || exp.date);
        const dateKey = format(expDate, 'yyyy-MM-dd');
        const dateName = format(expDate, 'dd MMM', { locale: ar });
        const expAmount = exp.total_amount || exp.amount || 0;

        if (dailyMap.has(dateKey)) {
          const data = dailyMap.get(dateKey)!;
          data.amount += expAmount;
        } else {
          dailyMap.set(dateKey, {
            date: dateName,
            amount: expAmount
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
      let paymentMethod = 'غير محدد';
      
      // استخراج اسم طريقة الدفع من الكائن أو النص
      if (exp.payment_method) {
        if (typeof exp.payment_method === 'object' && exp.payment_method !== null) {
          paymentMethod = (exp.payment_method as any).name || 'غير محدد';
        } else {
          paymentMethod = exp.payment_method;
        }
      }
      
      const expAmount = exp.total_amount || exp.amount || 0;

      if (paymentMap.has(paymentMethod)) {
        const data = paymentMap.get(paymentMethod)!;
        data.value += expAmount;
      } else {
        paymentMap.set(paymentMethod, {
          name: paymentMethod,
          value: expAmount
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
      
      // استخراج اسم الفئة من الحقول المباشرة أو من القائمة
      let categoryName = exp.category_name || 'غير محدد';
      
      if (!exp.category_name) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          categoryName = category.name;
        }
      }

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
  }, [filteredExpenses, categories]);

  // Tooltip مخصص احترافي
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border-2 border-blue-500 rounded-lg shadow-2xl" dir="rtl">
          <p className="font-bold text-gray-800 mb-2 text-sm">
            {payload[0].payload.name || payload[0].payload.month || payload[0].payload.date || label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
              {entry.name || 'القيمة'}: <span className="font-bold">{entry.value.toLocaleString()} ر.س</span>
            </p>
          ))}
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

            {/* العميل */}
            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">العميل</label>
              <div className="flex gap-2">
                <select
                  value={selectedClientId || ''}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value ? Number(e.target.value) : null);
                    setSelectedProjectId(null); // إعادة تعيين المشروع عند تغيير العميل
                  }}
                  className="flex-1 min-h-[44px] sm:h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">جميع العملاء</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {selectedClientId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClientId(null)}
                    className="min-h-[44px] sm:h-9 px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
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
                  disabled={!selectedClientId && projects.length === 0}
                >
                  <option value="">
                    {selectedClientId 
                      ? `جميع مشاريع ${clients.find(c => c.id === selectedClientId)?.name || 'العميل'}`
                      : 'جميع المشاريع'
                    }
                  </option>
                  {(selectedClientId 
                    ? projects.filter(p => p.client_id === selectedClientId)
                    : projects
                  ).map(project => (
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
        <Card className="shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-800">المصروفات حسب الفئات</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={false}
                  outerRadius={window.innerWidth < 640 ? 90 : 140}
                  innerRadius={window.innerWidth < 640 ? 50 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  layout="horizontal"
                  wrapperStyle={{ 
                    fontSize: '13px', 
                    paddingTop: '30px',
                    direction: 'rtl'
                  }}
                  formatter={(value, entry: any) => {
                    const percent = ((entry.payload.value / totalExpenses) * 100).toFixed(1);
                    return `${value}: ${percent}% (${entry.payload.value.toLocaleString()} ر.س)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. أعلى 10 مشاريع */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-800">أعلى 10 مشاريع إنفاقاً</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {projectData.slice(0, 5).map((project, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-700">{project.name}</span>
                    <span className="font-bold text-blue-600">{project.value.toLocaleString()} ر.س</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(project.value / Math.max(...projectData.map(p => p.value))) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3. المصروفات الشهرية */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-800">المصروفات الشهرية (آخر 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B294" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00B294" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  fontSize={13}
                  fontWeight="500"
                  stroke="#6b7280"
                />
                <YAxis 
                  fontSize={13}
                  fontWeight="500"
                  stroke="#6b7280"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#00B294" 
                  strokeWidth={3}
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. مقارنة الميزانية بالإنفاق */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-800">الميزانية مقابل الإنفاق الفعلي</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {budgetComparisonData.slice(0, 8).map((project, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">{project.name}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600 font-bold">
                        الميزانية: {project.budget.toLocaleString()} ر.س
                      </span>
                      <span className="text-red-600 font-bold">
                        الإنفاق: {project.spending.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                        style={{ width: `${(project.budget / Math.max(...budgetComparisonData.map(p => Math.max(p.budget, p.spending)))) * 100}%` }}
                        title={`الميزانية: ${project.budget.toLocaleString()}`}
                      />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full"
                        style={{ width: `${(project.spending / Math.max(...budgetComparisonData.map(p => Math.max(p.budget, p.spending)))) * 100}%` }}
                        title={`الإنفاق: ${project.spending.toLocaleString()}`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>نسبة الاستخدام: {project.budget > 0 ? ((project.spending / project.budget) * 100).toFixed(1) : 0}%</span>
                    <span className={project.spending > project.budget ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {project.spending > project.budget ? 'تجاوز الميزانية' : 'ضمن الميزانية'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 5. المصروفات اليومية */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-violet-50 to-purple-50">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-800">المصروفات اليومية (آخر 15 يوم)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  fontWeight="500"
                  stroke="#6b7280"
                />
                <YAxis 
                  fontSize={13}
                  fontWeight="500"
                  stroke="#6b7280"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8661C5" 
                  strokeWidth={3}
                  dot={{ fill: '#8661C5', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6. طرق الدفع */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-800">توزيع طرق الدفع</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={false}
                  outerRadius={window.innerWidth < 640 ? 90 : 140}
                  innerRadius={window.innerWidth < 640 ? 50 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={3}
                >
                  {paymentMethodData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  layout="horizontal"
                  wrapperStyle={{ 
                    fontSize: '13px', 
                    paddingTop: '30px',
                    direction: 'rtl'
                  }}
                  formatter={(value, entry: any) => {
                    const total = paymentMethodData.reduce((sum, item) => sum + item.value, 0);
                    const percent = ((entry.payload.value / total) * 100).toFixed(1);
                    return `${value}: ${percent}% (${entry.payload.value.toLocaleString()} ر.س)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 7. عدد المصروفات حسب الفئات */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-800">عدد المصروفات حسب الفئات</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {categoryCountData.map((category, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-700">{category.name}</span>
                    <span className="font-bold text-teal-600">{category.count} مصروف</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(category.count / Math.max(...categoryCountData.map(c => c.count))) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
