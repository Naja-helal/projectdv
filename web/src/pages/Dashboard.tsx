import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { projectsApi, expensesApi, categoriesApi, projectItemsApi, paymentMethodsApi, clientsApi, unitsApi } from "@/lib/supabaseApi"
import { useNavigate } from "react-router-dom"
import { Expense } from "@/types"

export default function Dashboard() {
  const navigate = useNavigate()

  // جلب الإحصائيات من جميع الأنظمة
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll
  })

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll()
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll
  })

  const { data: projectItems = [] } = useQuery({
    queryKey: ['project-items'],
    queryFn: projectItemsApi.getAll
  })

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodsApi.getAll
  })

  // جلب العملاء
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll
  })

  // جلب الوحدات
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: unitsApi.getAll
  })

  // حساب الإحصائيات
  const totalExpenses = expenses.reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0)
  const activeProjects = projects.filter(p => p.status === 'active').length
  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0)
  const activeClients = clients.filter((c: any) => c.is_active !== false).length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* رأس الصفحة مع تدرج لوني */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-2xl">
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">تطبيق إدارة المشاريع المتقدم</h1>
          <p className="text-base sm:text-lg opacity-90">
            📊 نظرة شاملة على حالة جميع المشاريع والمصروفات
          </p>
        </div>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate('/projects')}>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
              📁
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-blue-700 mb-2">
              {projects.length}
            </div>
            <div className="text-sm sm:text-base text-blue-600 font-medium">
              مشروع ({activeProjects} نشط)
            </div>
            <div className="text-xs text-blue-500 mt-2">
              الميزانية الإجمالية: {totalBudget.toLocaleString()} ر.س
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate('/expenses')}>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
              💰
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-red-700 mb-2">
              {expenses.length}
            </div>
            <div className="text-sm sm:text-base text-red-600 font-medium">
              مصروف مسجل
            </div>
            <div className="text-xs text-red-500 mt-2">
              الإجمالي: {totalExpenses.toLocaleString()} ر.س
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate('/categories')}>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
              🏷️
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-green-700 mb-2">
              {categories.length}
            </div>
            <div className="text-sm sm:text-base text-green-600 font-medium">
              فئة مصروفات
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate('/project-items')}>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
              📦
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-purple-700 mb-2">
              {projectItems.length}
            </div>
            <div className="text-sm sm:text-base text-purple-600 font-medium">
              تصنيف مشروع
            </div>
          </CardContent>
        </Card>
      </div>

      {/* بطاقات إضافية - الصف الثاني */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate('/payment-methods')}>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
              💳
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-cyan-700 mb-2">
              {paymentMethods.length}
            </div>
            <div className="text-sm sm:text-base text-cyan-600 font-medium">
              طريقة دفع متاحة
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate('/clients')}>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
              👥
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-orange-700 mb-2">
              {clients.length}
            </div>
            <div className="text-sm sm:text-base text-orange-600 font-medium">
              عميل ({activeClients} نشط)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate('/units')}>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
              📏
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-teal-700 mb-2">
              {units.length}
            </div>
            <div className="text-sm sm:text-base text-teal-600 font-medium">
              وحدة قياس
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الإجراءات السريعة */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🚀 الإجراءات السريعة
          </h2>
          <p className="text-lg text-muted-foreground">انتقل بسرعة إلى الأقسام المختلفة</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Button
            onClick={() => navigate('/projects')}
            className="group min-h-[100px] p-4 text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl group-hover:scale-110 transition-transform duration-300">📁</div>
              <span className="text-white text-center">المشاريع</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/expenses')}
            className="group min-h-[100px] p-4 text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl group-hover:scale-110 transition-transform duration-300">💰</div>
              <span className="text-white text-center">المصروفات</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/categories')}
            className="group min-h-[100px] p-4 text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl group-hover:scale-110 transition-transform duration-300">🏷️</div>
              <span className="text-white text-center">الفئات</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/project-items')}
            className="group min-h-[100px] p-4 text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-0"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl group-hover:scale-110 transition-transform duration-300">📦</div>
              <span className="text-white text-center">تصنيف المشاريع</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/payment-methods')}
            className="group min-h-[100px] p-4 text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 border-0"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl group-hover:scale-110 transition-transform duration-300">💳</div>
              <span className="text-white text-center">طرق الدفع</span>
            </div>
          </Button>
        </div>
      </div>

      {/* بطاقة الترحيب */}
      <Card className="relative overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <CardContent className="p-8 sm:p-12 text-center relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
          
          <div className="relative z-10">
            <div className="text-8xl mb-6 animate-pulse">🌟</div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              مرحباً بك في تطبيق إدارة المشاريع المتقدم
            </h3>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto mb-6">
              نظام شامل ومتطور لإدارة المشاريع والمصروفات بكفاءة عالية. 
              تتبع مشاريعك، سجل مصروفاتك، وصنف بياناتك بسهولة.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full shadow-sm">
                <span className="text-2xl">⚡</span>
                <span className="text-sm font-medium text-gray-700">سرعة عالية</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full shadow-sm">
                <span className="text-2xl">🔒</span>
                <span className="text-sm font-medium text-gray-700">آمان تام</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full shadow-sm">
                <span className="text-2xl">📱</span>
                <span className="text-sm font-medium text-gray-700">متجاوب</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full shadow-sm">
                <span className="text-2xl">📊</span>
                <span className="text-sm font-medium text-gray-700">تقارير شاملة</span>
              </div>
            </div>
            
            <div className="mt-8 text-6xl opacity-60">✨ 🚀 ✨</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
