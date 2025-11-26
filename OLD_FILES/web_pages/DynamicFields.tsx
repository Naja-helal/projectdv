import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Plus, Settings, Trash2, Edit, DollarSign } from 'lucide-react'
import { getApiUrl } from '@/lib/api';

// أنواع البيانات
interface DynamicField {
  id: number
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'calculated' | 'url' | 'phone'
  page_type: string
  options?: string[]
  calculation_formula?: string
  is_required: boolean
  display_order: number
  default_value?: string
  created_at: string
}

interface CreateDynamicFieldData {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'calculated' | 'url' | 'phone'
  page_type: string
  options?: string[]
  calculation_formula?: string
  is_required: boolean
  display_order: number
  default_value?: string
}

export default function DynamicFields() {
  // استخراج نوع الصفحة من URL إذا كان متوفراً
  const urlParams = new URLSearchParams(window.location.search)
  const initialPage = urlParams.get('tab') || 'expenses'
  
  // دالة لإزالة الأصفار البادئة من الأرقام
  const removeLeadingZeros = (value: string): string => {
    if (!value || value === '' || value === '0' || value === '0.') return value;
    const cleaned = value.replace(/^0+(?=\d)/, '');
    return cleaned || '0';
  };
  
  const [showForm, setShowForm] = useState(false)
  const [editingField, setEditingField] = useState<DynamicField | null>(null)
  const [selectedPage, setSelectedPage] = useState<string>(initialPage)
  const [formData, setFormData] = useState<CreateDynamicFieldData>({
    name: '',
    label: '',
    type: 'text',
    page_type: initialPage,
    is_required: false,
    display_order: 0
  })

  const queryClient = useQueryClient()

  // الصفحات المتاحة
  const pageTypes = [
    { id: 'expenses', name: 'المصاريف', icon: DollarSign, color: 'bg-red-100 text-red-700' },
    { id: 'mosques', name: 'المساجد', icon: Settings, color: 'bg-blue-100 text-blue-700' }
  ]

  // جلب الحقول حسب نوع الصفحة
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['dynamic-fields', selectedPage],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/dynamic-fields/${selectedPage}`))
      if (!response.ok) {
        throw new Error('فشل في جلب الحقول')
      }
      return await response.json() as DynamicField[]
    }
  })

  // إضافة حقل جديد
  const createMutation = useMutation({
    mutationFn: async (data: CreateDynamicFieldData) => {
      const response = await fetch(getApiUrl('/dynamic-fields'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في إنشاء الحقل')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-fields'] })
      resetForm()
      setShowForm(false)
    }
  })

  // تحديث حقل
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CreateDynamicFieldData> }) => {
      const response = await fetch(getApiUrl(`/dynamic-fields/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في تحديث الحقل')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-fields'] })
      resetForm()
      setShowForm(false)
      setEditingField(null)
    }
  })

  // حذف حقل
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(getApiUrl(`/dynamic-fields/${id}`), {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في حذف الحقل')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-fields'] })
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      type: 'text',
      page_type: selectedPage,
      is_required: false,
      display_order: 0
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (field: DynamicField) => {
    setEditingField(field)
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      page_type: field.page_type,
      options: field.options,
      calculation_formula: field.calculation_formula,
      is_required: field.is_required,
      display_order: field.display_order,
      default_value: field.default_value
    })
    setShowForm(true)
  }

  const handleDelete = (field: DynamicField) => {
    if (confirm(`هل أنت متأكد من حذف الحقل "${field.label}"؟`)) {
      deleteMutation.mutate(field.id)
    }
  }

  const getPageInfo = (pageId: string) => {
    return pageTypes.find(p => p.id === pageId) || pageTypes[0]
  }

  // دالة لترجمة أنواع الحقول إلى العربية
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'نص'
      case 'number': return 'رقم'
      case 'date': return 'تاريخ'
      case 'select': return 'قائمة اختيار'
      case 'calculated': return 'محسوب'
      case 'url': return 'رابط'
      case 'phone': return 'هاتف'
      default: return type
    }
  }

  const addOption = () => {
    const newOptions = [...(formData.options || []), '']
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])]
    newOptions[index] = value
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const removeOption = (index: number) => {
    const newOptions = [...(formData.options || [])]
    newOptions.splice(index, 1)
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6" dir="rtl">
      {/* Header مع تدرج */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الحقول الديناميكية ⚙️</h1>
              <p className="text-purple-100 text-lg">
                إنشاء وإدارة الحقول المخصصة ({fields.length} حقل)
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-purple-700 hover:bg-purple-50 gap-2 w-full sm:w-auto min-h-[56px] text-base font-bold py-3 px-6 rounded-xl shadow-lg border-2 border-white/20 flex items-center justify-center"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة حقل جديد</span>
          </button>
        </div>
      </div>

      {/* الإحصائيات - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-0 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/20 rounded-full p-2">
              <span className="text-2xl">📝</span>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-1">
              <span className="text-sm font-medium">#</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{fields.length}</p>
            <p className="text-sm text-blue-100">إجمالي الحقول</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg border-0 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/20 rounded-full p-2">
              <span className="text-2xl">✅</span>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-1">
              <span className="text-sm font-medium">مطلوب</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{fields.filter(f => f.is_required).length}</p>
            <p className="text-sm text-green-100">الحقول المطلوبة</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg border-0 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/20 rounded-full p-2">
              <span className="text-2xl">🔧</span>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-1">
              <span className="text-sm font-medium">محسوب</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{fields.filter(f => f.type === 'calculated').length}</p>
            <p className="text-sm text-purple-100">الحقول المحسوبة</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg border-0 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/20 rounded-full p-2">
              <span className="text-2xl">📋</span>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-1">
              <span className="text-sm font-medium">صفحات</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{pageTypes.length}</p>
            <p className="text-sm text-orange-100">الصفحات المتاحة</p>
          </div>
        </div>
      </div>

      {/* اختيار نوع الصفحة */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <span className="text-xl">📄</span>
            </div>
            <h2 className="text-lg font-bold">اختر نوع الصفحة</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pageTypes.map((page) => {
              const IconComponent = page.icon
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPage(page.id)
                    setFormData(prev => ({ ...prev, page_type: page.id }))
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedPage === page.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-3 rounded-xl ${selectedPage === page.id ? 'bg-indigo-100 text-indigo-600' : page.color}`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-lg">{page.name}</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPage === page.id ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {fields.filter(f => f.page_type === page.id).length} حقل
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* عرض الحقول للصفحة المحددة */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-200">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              {(() => {
                const pageInfo = getPageInfo(selectedPage)
                const IconComponent = pageInfo.icon
                return <IconComponent className="h-6 w-6" />
              })()}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                حقول صفحة {getPageInfo(selectedPage).name}
              </h2>
              <p className="text-purple-100 text-sm">
                {fields.length} {fields.length === 1 ? 'حقل' : fields.length === 2 ? 'حقلان' : 'حقول'} ديناميكي
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">لا توجد حقول محددة</h3>
              <p className="mb-4">
                ابدأ بإضافة الحقول المخصصة لصفحة {getPageInfo(selectedPage).name}
              </p>
              <Button onClick={() => setShowForm(true)}>
                إضافة أول حقل
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields
                .sort((a, b) => a.display_order - b.display_order)
                .map((field) => (
                  <div key={field.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <span className="text-purple-600 font-bold text-sm">#{field.display_order || 1}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{field.label}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              field.type === 'calculated' ? 'bg-purple-100 text-purple-800' :
                              field.type === 'select' ? 'bg-blue-100 text-blue-800' :
                              field.type === 'number' ? 'bg-green-100 text-green-800' :
                              field.type === 'date' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getTypeLabel(field.type)}
                            </span>
                            {field.is_required && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                مطلوب
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(field)}
                          disabled={updateMutation.isPending}
                          className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(field)}
                          disabled={deleteMutation.isPending}
                          className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-gray-800">{field.name}</code>
                        <span className="text-gray-600 text-sm font-medium">اسم الحقل:</span>
                      </div>
                      
                      {field.default_value && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="bg-blue-100 px-3 py-1 rounded text-sm font-medium text-blue-800">{field.default_value}</span>
                          <span className="text-gray-600 text-sm font-medium">القيمة الافتراضية:</span>
                        </div>
                      )}
                      
                      {field.calculation_formula && (
                        <div className="flex justify-between items-start py-2 border-b border-gray-100">
                          <code className="bg-purple-100 px-3 py-1 rounded text-sm font-mono text-purple-800 flex-1 ml-3">{field.calculation_formula}</code>
                          <span className="text-gray-600 text-sm font-medium">صيغة الحساب:</span>
                        </div>
                      )}
                      
                      {field.options && field.options.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-600 text-sm font-medium">الخيارات المتاحة:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {field.options.map((option, i) => (
                              <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* نموذج إضافة/تعديل الحقل */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-full max-w-2xl max-h-[95vh] overflow-hidden m-0 sm:m-6 rounded-none sm:rounded-2xl">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 -m-6 mb-0">
            <DialogTitle className="text-xl font-bold text-center">
              {editingField ? '✏️ تعديل الحقل' : '➕ إضافة حقل جديد'} 
            </DialogTitle>
            <p className="text-center text-purple-100 text-sm mt-1">
              لصفحة {getPageInfo(selectedPage).name}
            </p>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* اسم الحقل */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700">🔤 اسم الحقل (بالإنجليزية)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="site_name"
                  required
                  className="text-base p-4 border-2 border-gray-200 rounded-xl min-h-[48px] focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-right"
                />
                <p className="text-xs text-gray-500">
                  يستخدم في قاعدة البيانات (بدون مسافات أو رموز)
                </p>
              </div>

              {/* العنوان */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700">🏷️ العنوان (بالعربية)</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="اسم الموقع"
                  required
                  className="text-base p-4 border-2 border-gray-200 rounded-xl min-h-[48px] focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* نوع الحقل */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700">⚙️ نوع الحقل</Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full text-base p-4 border-2 border-gray-200 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white text-right"
                >
                  <option value="text">📝 نص</option>
                  <option value="number">🔢 رقم</option>
                  <option value="date">📅 تاريخ</option>
                  <option value="select">📋 قائمة اختيار</option>
                  <option value="url">🔗 رابط</option>
                  <option value="phone">📱 هاتف</option>
                </select>
              </div>

              {/* ترتيب العرض */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700">🔢 ترتيب العرض</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => {
                    const cleaned = removeLeadingZeros(e.target.value);
                    setFormData(prev => ({ ...prev, display_order: parseInt(cleaned) || 0 }));
                  }}
                  onBlur={(e) => {
                    e.target.value = removeLeadingZeros(e.target.value);
                  }}
                  placeholder="0"
                  className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-emerald-500"
                />
              </div>
            </div>

            {/* القيمة الافتراضية */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700">💡 القيمة الافتراضية (اختيارية)</Label>
              <Input
                value={formData.default_value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, default_value: e.target.value }))}
                placeholder="القيمة التي ستظهر مسبقاً"
                className="text-base p-4 border-2 border-gray-200 rounded-xl min-h-[48px] focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-right"
              />
            </div>

            {/* الحقل مطلوب */}
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
              <input
                type="checkbox"
                id="required"
                checked={formData.is_required}
                onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                className="w-5 h-5 text-purple-600 rounded border-2 border-gray-300 focus:ring-purple-500"
              />
              <Label htmlFor="required" className="text-base font-bold cursor-pointer text-purple-800">
                ✅ هذا الحقل مطلوب
              </Label>
            </div>

            {/* خيارات القائمة (للنوع select) */}
            {formData.type === 'select' && (
              <div className="space-y-2">
                <Label>خيارات القائمة</Label>
                <div className="space-y-2">
                  {(formData.options || []).map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`الخيار ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة خيار
                  </Button>
                </div>
              </div>
            )}

            {/* أزرار التحكم */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-purple-100">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingField(null)
                  resetForm()
                }}
                className="flex-1 py-4 text-lg font-bold rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[56px] transition-colors"
              >
                ❌ إلغاء
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 py-4 text-lg font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending ? 
                  '⏳ جاري الحفظ...' : 
                  editingField ? '✏️ تحديث الحقل' : '➕ حفظ الحقل'
                }
              </button>
            </div>
          </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
