import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ExpectedExpenseForm from '../components/forms/ExpectedExpenseForm'
import EditExpectedExpenseForm from '../components/forms/EditExpectedExpenseForm'
import { Trash2, FolderOpen, Edit } from 'lucide-react'
import { expectedExpenseApi, categoryApi, projectApi } from '@/lib/api'
import type { Expense, ExpenseFilters } from '@/types'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function ExpectedExpenses() {
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([])
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  
  const queryClient = useQueryClient()

  // جلب الإنفاق المتوقع
  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['expected-expenses', filters],
    queryFn: () => expectedExpenseApi.getExpectedExpenses({
      ...filters,
      q: searchTerm || undefined,
    })
  })

  // جلب الفئات للفلترة
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories
  })

  // جلب المشاريع للفلترة
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.getProjects
  })

  // حذف إنفاق متوقع
  const deleteMutation = useMutation({
    mutationFn: (id: number) => expectedExpenseApi.deleteExpectedExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowEditForm(true)
  }

  const handleDelete = (expense: Expense) => {
    if (confirm('هل أنت متأكد من حذف هذا الإنفاق المتوقع؟')) {
      deleteMutation.mutate(expense.id)
    }
  }

  // حذف الإنفاق المتوقع المحدد
  const deleteSelectedMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await expectedExpenseApi.deleteExpectedExpense(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setSelectedExpenses([])
    }
  })

  const handleDeleteSelected = () => {
    if (selectedExpenses.length === 0) return
    
    if (confirm(`هل أنت متأكد من حذف ${selectedExpenses.length} إنفاق متوقع محدد؟`)) {
      deleteSelectedMutation.mutate(selectedExpenses)
    }
  }

  // تحديد/إلغاء تحديد إنفاق متوقع واحد
  const toggleExpenseSelection = (expenseId: number) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    )
  }

  // تحديد/إلغاء تحديد جميع الإنفاق المتوقع
  const toggleSelectAll = () => {
    setSelectedExpenses(prev => 
      prev.length === expenses.length 
        ? [] 
        : expenses.map(expense => expense.id)
    )
  }

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, q: searchTerm }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  // حساب الصفحات
  const totalPages = Math.ceil(expenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const displayedExpenses = expenses.slice(startIndex, endIndex)

  // حساب الإحصائيات
  const stats = {
    total: expenses.length,
    totalAmount: expenses.reduce((sum, expense) => sum + (expense.total_amount || expense.amount), 0),
    byCategory: expenses.reduce((acc, expense) => {
      const categoryName = expense.category_name || 'غير محدد'
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    linkedToProjects: expenses.filter(expense => expense.project_id).length
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">حدث خطأ في تحميل الإنفاق المتوقع</p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📊 الإنفاق المتوقع</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-h-[48px] px-6 rounded-xl font-semibold"
        >
          ➕ إضافة إنفاق متوقع جديد
        </Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="text-2xl sm:text-3xl font-bold mb-1">{stats.total}</div>
          <div className="text-xs sm:text-sm text-purple-100">إجمالي الإنفاق المتوقع</div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="text-xl sm:text-2xl font-bold mb-1">{stats.totalAmount.toLocaleString()} ر.س</div>
          <div className="text-xs sm:text-sm text-indigo-100">إجمالي المبلغ المتوقع</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="text-2xl sm:text-3xl font-bold mb-1">{Object.keys(stats.byCategory).length}</div>
          <div className="text-xs sm:text-sm text-pink-100">الفئات المستخدمة</div>
        </div>

        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="text-2xl sm:text-3xl font-bold mb-1">{stats.linkedToProjects}</div>
          <div className="text-xs sm:text-sm text-violet-100">مرتبط بمشاريع</div>
        </div>

        {selectedExpenses.length > 0 && (
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{selectedExpenses.length}</div>
            <div className="text-xs sm:text-sm text-red-100">محدد للحذف</div>
          </div>
        )}
      </div>

      {/* البحث والفلاتر */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-4 sm:p-6 space-y-4">
          {/* البحث */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">🔍 البحث في الإنفاق المتوقع:</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="ابحث في الوصف أو التفاصيل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 min-h-[48px] px-4 py-3 text-base border-2 rounded-xl"
              />
              <Button 
                onClick={handleSearch}
                className="min-h-[48px] px-6 rounded-xl bg-purple-600 hover:bg-purple-700"
              >
                بحث
              </Button>
            </div>
          </div>

          {/* الفلاتر */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* فلتر الفئة */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">الفئة:</label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  categoryId: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full min-h-[48px] px-4 py-3 text-base border-2 rounded-xl bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="">جميع الفئات</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* فلتر المشروع */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">المشروع:</label>
              <select
                value={filters.projectId || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  projectId: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full min-h-[48px] px-4 py-3 text-base border-2 rounded-xl bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="">جميع المشاريع</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.code && `(${project.code})`}
                  </option>
                ))}
              </select>
            </div>

            {/* فلتر التاريخ من */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">من تاريخ:</label>
              <Input
                type="date"
                value={filters.from ? new Date(filters.from).toISOString().split('T')[0] : ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  from: e.target.value ? new Date(e.target.value).getTime() : undefined
                }))}
                className="min-h-[48px] px-4 py-3 text-base border-2 rounded-xl"
              />
            </div>

            {/* فلتر التاريخ إلى */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">إلى تاريخ:</label>
              <Input
                type="date"
                value={filters.to ? new Date(filters.to).toISOString().split('T')[0] : ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  to: e.target.value ? new Date(e.target.value).getTime() : undefined
                }))}
                className="min-h-[48px] px-4 py-3 text-base border-2 rounded-xl"
              />
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-200">
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              🗑️ مسح الفلاتر
            </Button>

            {selectedExpenses.length > 0 && (
              <Button 
                onClick={handleDeleteSelected}
                variant="destructive"
                className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl bg-red-600 hover:bg-red-700"
              >
                🗑️ حذف المحدد ({selectedExpenses.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* جدول الإنفاق المتوقع */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">جاري التحميل...</div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا يوجد إنفاق متوقع</h3>
          <p className="text-gray-500">ابدأ بإضافة إنفاق متوقع جديد</p>
        </div>
      ) : (
        <>
          {/* عرض الجدول على الشاشات الكبيرة */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                  <tr>
                    <th className="px-3 py-4 text-right">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-3 py-4 text-right text-sm font-bold text-gray-800">📅 التاريخ</th>
                    <th className="px-3 py-4 text-right text-sm font-bold text-gray-800">📋 التفاصيل</th>
                    <th className="px-3 py-4 text-right text-sm font-bold text-gray-800">🏷️ الفئة</th>
                    <th className="px-3 py-4 text-center text-sm font-bold text-gray-800">🔢 الكمية</th>
                    <th className="px-3 py-4 text-right text-sm font-bold text-gray-800">💵 سعر الوحدة</th>
                    <th className="px-3 py-4 text-right text-sm font-bold text-gray-800">💳 الدفع</th>
                    <th className="px-3 py-4 text-right text-sm font-bold text-gray-800">📊 الضريبة</th>
                    <th className="px-3 py-4 text-right text-sm font-bold text-gray-800">💰 المبلغ</th>
                    <th className="px-3 py-4 text-right text-sm font-bold text-gray-800">📁 المشروع</th>
                    <th className="px-3 py-4 text-center text-sm font-bold text-gray-800">⚙️ الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedExpenses.map((expense) => {
                    return (
                    <tr 
                      key={expense.id} 
                      className={`hover:bg-purple-50 transition-colors duration-150 ${
                        selectedExpenses.includes(expense.id) ? 'bg-purple-100' : ''
                      }`}
                    >
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={() => toggleExpenseSelection(expense.id)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-4 text-gray-700 font-medium whitespace-nowrap">
                        {format(new Date(expense.date), 'dd/MM/yyyy', { locale: ar })}
                      </td>
                      <td className="px-3 py-4 text-gray-600 max-w-xs">
                        <div className="line-clamp-2 text-sm" title={expense.details}>
                          {expense.details || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ backgroundColor: expense.category_color || '#6b7280', color: '#fff' }}
                        >
                          {expense.category_name}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-gray-700 text-center font-medium whitespace-nowrap">
                        {expense.quantity ? `${expense.quantity} ${expense.unit_name || ''}` : '-'}
                      </td>
                      <td className="px-3 py-4 text-gray-700 font-medium whitespace-nowrap">
                        {expense.unit_price ? `${expense.unit_price.toLocaleString()} ر.س` : '-'}
                      </td>
                      <td className="px-3 py-4 text-gray-700">
                        {expense.payment_method || '-'}
                      </td>
                      <td className="px-3 py-4 text-gray-700 whitespace-nowrap">
                        {expense.tax_rate ? `${expense.tax_rate}% (${expense.tax_amount?.toLocaleString() || 0} ر.س)` : '-'}
                      </td>
                      <td className="px-3 py-4 font-bold text-lg text-purple-700 whitespace-nowrap">
                        {(expense.total_amount || expense.amount).toLocaleString()} ر.س
                      </td>
                      <td className="px-3 py-4">
                        {expense.project_name ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                              <FolderOpen className="w-4 h-4" style={{ color: expense.project_color || '#3b82f6' }} />
                              {expense.project_name}
                            </div>
                            {expense.project_item_name && (
                              <div className="text-xs text-gray-500 mt-1">{expense.project_item_name}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* نظام الصفحات وعرض الصفوف */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* عدد الصفوف في الصفحة */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">عرض:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">
                  عرض {startIndex + 1}-{Math.min(endIndex, expenses.length)} من {expenses.length}
                </span>
              </div>

              {/* أزرار الصفحات */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  السابق
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>

          {/* عرض البطاقات على الشاشات الصغيرة */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-gray-300"
                />
                تحديد الكل
              </label>
            </div>
            
            {expenses.map((expense) => (
              <div 
                key={expense.id} 
                className={`bg-white rounded-2xl shadow-lg border p-4 space-y-3 ${
                  selectedExpenses.includes(expense.id) ? 'border-purple-500 bg-purple-50' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => toggleExpenseSelection(expense.id)}
                      className="w-5 h-5 rounded border-gray-300 mt-1"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{expense.details || 'إنفاق متوقع'}</h3>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 -mt-1"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">التاريخ</div>
                    <div className="font-medium text-gray-900">
                      {format(new Date(expense.date), 'dd MMM yyyy', { locale: ar })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">المبلغ</div>
                    <div className="font-bold text-lg text-gray-900">{expense.amount.toLocaleString()} ر.س</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {expense.category_name}
                  </span>
                </div>

                {expense.project_name && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">المشروع</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <FolderOpen className="w-4 h-4" style={{ color: expense.project_color || '#3b82f6' }} />
                      {expense.project_name}
                      {expense.project_code && (
                        <span className="text-xs text-gray-500">({expense.project_code})</span>
                      )}
                    </div>
                    {expense.project_item_name && (
                      <div className="text-xs text-gray-500 mt-1 mr-6">{expense.project_item_name}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* نموذج إضافة إنفاق متوقع */}
      {showForm && (
        <ExpectedExpenseForm 
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['expected-expenses'] })
            queryClient.invalidateQueries({ queryKey: ['stats'] })
            queryClient.invalidateQueries({ queryKey: ['projects'] })
          }}
        />
      )}

      {/* نموذج تعديل إنفاق متوقع */}
      <EditExpectedExpenseForm
        expense={selectedExpense}
        open={showEditForm}
        onClose={() => {
          setShowEditForm(false)
          setSelectedExpense(null)
        }}
      />
    </div>
  )
}
