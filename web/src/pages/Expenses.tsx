import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ExpenseForm from '@/components/forms/ExpenseForm'
import EditExpenseForm from '@/components/forms/EditExpenseForm'
import { Trash2, FolderOpen, Edit } from 'lucide-react'
import { expenseApi, categoryApi, projectApi } from '@/lib/api'
import type { Expense, ExpenseFilters } from '@/types'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function Expenses() {
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([])
  
  const queryClient = useQueryClient()

  // جلب المصروفات
  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expenseApi.getExpenses({
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

  // حذف مصروف
  const deleteMutation = useMutation({
    mutationFn: (id: number) => expenseApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowEditForm(true)
  }

  const handleDelete = (expense: Expense) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      deleteMutation.mutate(expense.id)
    }
  }

  // حذف المصروفات المحددة
  const deleteSelectedMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await expenseApi.deleteExpense(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setSelectedExpenses([])
    }
  })

  const handleDeleteSelected = () => {
    if (selectedExpenses.length === 0) return
    
    if (confirm(`هل أنت متأكد من حذف ${selectedExpenses.length} مصروف محدد؟`)) {
      deleteSelectedMutation.mutate(selectedExpenses)
    }
  }

  // تحديد/إلغاء تحديد مصروف واحد
  const toggleExpenseSelection = (expenseId: number) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    )
  }

  // تحديد/إلغاء تحديد جميع المصروفات
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

  // حساب الإحصائيات
  const stats = {
    total: expenses.length,
    totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
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
        <p className="text-red-500">حدث خطأ في تحميل المصروفات</p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💰 المصروفات</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-h-[48px] px-6 rounded-xl font-semibold"
        >
          ➕ إضافة مصروف جديد
        </Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="text-2xl sm:text-3xl font-bold mb-1">{stats.total}</div>
          <div className="text-xs sm:text-sm text-blue-100">إجمالي المصروفات</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="text-xl sm:text-2xl font-bold mb-1">{stats.totalAmount.toLocaleString()} ر.س</div>
          <div className="text-xs sm:text-sm text-green-100">إجمالي المبلغ</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="text-2xl sm:text-3xl font-bold mb-1">{Object.keys(stats.byCategory).length}</div>
          <div className="text-xs sm:text-sm text-purple-100">الفئات المستخدمة</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="text-2xl sm:text-3xl font-bold mb-1">{stats.linkedToProjects}</div>
          <div className="text-xs sm:text-sm text-orange-100">مرتبط بمشاريع</div>
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">🔍 البحث في المصروفات:</label>
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
                className="min-h-[48px] px-6 rounded-xl bg-blue-600 hover:bg-blue-700"
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
                className="w-full min-h-[48px] px-4 py-3 text-base border-2 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                className="w-full min-h-[48px] px-4 py-3 text-base border-2 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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

      {/* جدول المصروفات */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">جاري التحميل...</div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مصروفات</h3>
          <p className="text-gray-500">ابدأ بإضافة مصروف جديد</p>
        </div>
      ) : (
        <>
          {/* عرض الجدول على الشاشات الكبيرة */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-4 text-right">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-900">التاريخ</th>
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-900">الوصف</th>
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-900">الفئة</th>
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-900">المشروع</th>
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-900">التفاصيل الكمية</th>
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-900">المبلغ</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-900">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((expense) => (
                    <tr 
                      key={expense.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedExpenses.includes(expense.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={() => toggleExpenseSelection(expense.id)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {format(new Date(expense.date), 'dd MMM yyyy', { locale: ar })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                        {expense.details && (
                          <div className="text-xs text-gray-500 mt-1">{expense.details}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expense.category_name}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {expense.project_name ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-2 font-medium text-gray-900">
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
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {expense.quantity && expense.unit_price ? (
                          <div className="text-xs">
                            <div className="text-gray-600">
                              <span className="font-semibold">{expense.quantity}</span> {expense.unit || 'قطعة'}
                            </div>
                            <div className="text-gray-500">
                              @ {expense.unit_price.toLocaleString()} ر.س
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">مبلغ مباشر</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="font-bold text-gray-900">
                            {expense.amount.toLocaleString()} ر.س
                          </div>
                          {expense.tax_amount > 0 && (
                            <div className="text-xs text-gray-500">
                              + {expense.tax_amount.toLocaleString()} ضريبة
                            </div>
                          )}
                          {expense.total_amount !== expense.amount && (
                            <div className="text-xs font-semibold text-blue-600">
                              = {expense.total_amount.toLocaleString()} ر.س
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  selectedExpenses.includes(expense.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100'
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
                      <h3 className="font-semibold text-gray-900 text-base">{expense.description}</h3>
                      {expense.details && (
                        <p className="text-sm text-gray-600 mt-1">{expense.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -mt-1"
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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

      {/* نموذج إضافة مصروف */}
      {showForm && (
        <ExpenseForm 
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['expenses'] })
            queryClient.invalidateQueries({ queryKey: ['stats'] })
          }}
        />
      )}

      {/* نموذج تعديل مصروف */}
      <EditExpenseForm
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
