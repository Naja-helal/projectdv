import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { categoriesApi, projectsApi, paymentMethodsApi, unitsApi, expectedExpensesApi } from '@/lib/supabaseApi'
import type { CreateExpenseData } from '@/types'

interface ExpectedExpenseFormProps {
  open?: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormData {
  categoryId: string
  projectId: string
  projectItemId: string
  quantity: string
  unit_price: string
  unit_id: string
  amount: string
  taxRate: string
  date: string
  paymentMethod: string
  description: string
  details: string
  notes: string
  useQuantity: boolean // للتبديل بين نظام الكمية والمبلغ المباشر
}

export default function ExpectedExpenseForm({ open, onClose }: ExpectedExpenseFormProps) {
  const queryClient = useQueryClient()
  
  // دالة لإزالة الأصفار البادئة من الأرقام
  const removeLeadingZeros = (value: string): string => {
    if (!value || value === '' || value === '0' || value === '0.') return value;
    // إزالة الأصفار البادئة مع الحفاظ على الأرقام العشرية
    const cleaned = value.replace(/^0+(?=\d)/, '');
    return cleaned || '0';
  };
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      categoryId: '',
      projectId: '',
      projectItemId: '',
      quantity: '1',
      unit_price: '',
      unit_id: '',
      amount: '',
      taxRate: '0',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      description: '',
      details: '',
      notes: '',
      useQuantity: false,
    }
  })

  // جلب البيانات المرجعية
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll
  })

  // جلب جميع طرق الدفع المستقلة
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodsApi.getAll
  })

  // جلب جميع الوحدات
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: unitsApi.getAll
  })

  // mutation لإضافة الإنفاق المتوقع
  const createMutation = useMutation({
    mutationFn: expectedExpensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      reset()
      onClose()
    },
    onError: (error) => {
      console.error('خطأ في إضافة الإنفاق المتوقع:', error)
    }
  })

  const onSubmit = (data: FormData) => {
    console.log("🔵 ExpectedExpenseForm - بيانات الفورم:", data);
    
    const expenseData: CreateExpenseData = {
      categoryId: parseInt(data.categoryId),
      projectId: data.projectId ? parseInt(data.projectId) : undefined,
      projectItemId: data.projectItemId ? parseInt(data.projectItemId) : undefined,
      quantity: data.useQuantity ? parseFloat(data.quantity) : undefined,
      unit_price: data.useQuantity ? parseFloat(data.unit_price) : undefined,
      unit_id: data.useQuantity && data.unit_id ? parseInt(data.unit_id) : undefined,
      amount: !data.useQuantity ? parseFloat(data.amount) : parseFloat(data.quantity) * parseFloat(data.unit_price),
      taxRate: parseFloat(data.taxRate),
      date: new Date(data.date).getTime(),
      paymentMethodId: data.paymentMethod ? parseInt(data.paymentMethod) : undefined,
      description: data.description || undefined,
      details: data.details || undefined,
      notes: data.notes || undefined,
    }

    console.log("📤 البيانات المرسلة للسيرفر:", expenseData);
    console.log("💳 paymentMethodId:", expenseData.paymentMethodId);

    createMutation.mutate(expenseData)
  }

  const useQuantityMode = watch('useQuantity')
  const watchedQuantity = watch('quantity')
  const watchedUnitPrice = watch('unit_price')
  const watchedAmount = watch('amount')
  const watchedTaxRate = watch('taxRate')
  
  // حساب المبلغ والضريبة والإجمالي
  const calculatedAmount = useQuantityMode 
    ? (parseFloat(watchedQuantity) || 0) * (parseFloat(watchedUnitPrice) || 0)
    : (parseFloat(watchedAmount) || 0)
  
  const taxRate = parseFloat(watchedTaxRate) || 0
  const taxAmount = (calculatedAmount * taxRate / 100)
  const totalAmount = calculatedAmount + taxAmount

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg max-h-[95vh] overflow-y-auto m-0 sm:m-6 rounded-none sm:rounded-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-center">إضافة إنفاق متوقع جديد</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            أدخل تفاصيل الإنفاق المتوقع الجديد
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-1">
          {/* رسالة تنبيه عامة للأخطاء */}
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-base font-bold text-red-700 mb-2">يرجى تصحيح الأخطاء التالية:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field} className="font-medium">{error.message || 'هذا الحقل مطلوب'}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* الحقول الأساسية */}
          <div className="space-y-5">
            {/* حقل الوصف مخفي - محفوظ للاستخدام المستقبلي */}
            <input type="hidden" {...register('description')} value="" />

            {/* الفئة - الحقل الأول */}
            <div className="space-y-3">
              <Label htmlFor="categoryId" className="text-base font-semibold">الفئة *</Label>
              <select
                {...register('categoryId', { required: 'الفئة مطلوبة' })}
                className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="">اختر الفئة</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <span className="text-sm text-red-600 font-medium">{errors.categoryId.message}</span>
              )}
            </div>

            {/* التفاصيل - الحقل الثاني */}
            <div className="space-y-3">
              <Label htmlFor="details" className="text-base font-semibold">التفاصيل</Label>
              <Textarea
                {...register('details')}
                placeholder="تفاصيل إضافية عن الإنفاق المتوقع..."
                className="text-base p-4 border-2 rounded-xl min-h-[80px] focus:border-purple-500"
                rows={3}
              />
            </div>

            {/* المشروع */}
            <div className="space-y-3">
              <Label htmlFor="projectId" className="text-base font-semibold">المشروع (اختياري)</Label>
              <select
                {...register('projectId')}
                className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="">بدون مشروع</option>
                {projects.filter(p => p.status === 'active').map((project) => (
                  <option key={project.id} value={project.id}>
                    📁 {project.name} {project.code && `(${project.code})`}
                  </option>
                ))}
              </select>
            </div>

            {/* التبديل بين نظام الكمية والمبلغ المباشر */}
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <input
                {...register('useQuantity')}
                type="checkbox"
                id="useQuantity"
                className="w-5 h-5 rounded border-gray-300"
              />
              <Label htmlFor="useQuantity" className="text-base font-semibold cursor-pointer">
                استخدام نظام الكمية × سعر الوحدة
              </Label>
            </div>

            {/* نظام الكمية */}
            {useQuantityMode ? (
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                {/* الكمية */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-semibold">الكمية *</Label>
                  <Input
                    {...register('quantity', { 
                      required: useQuantityMode,
                      onChange: (e) => {
                        // السماح فقط بالأرقام والنقطة العشرية
                        e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                        e.target.value = removeLeadingZeros(e.target.value);
                      }
                    })}
                    type="text"
                    inputMode="decimal"
                    placeholder="10"
                    className="text-base p-3 border-2 rounded-lg"
                    onBlur={(e) => {
                      e.target.value = removeLeadingZeros(e.target.value);
                    }}
                  />
                </div>

                {/* سعر الوحدة */}
                <div className="space-y-2">
                  <Label htmlFor="unit_price" className="text-sm font-semibold">سعر الوحدة *</Label>
                  <Input
                    {...register('unit_price', { 
                      required: useQuantityMode,
                      onChange: (e) => {
                        // السماح فقط بالأرقام والنقطة العشرية
                        e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                        e.target.value = removeLeadingZeros(e.target.value);
                      }
                    })}
                    type="text"
                    inputMode="decimal"
                    placeholder="250"
                    className="text-base p-3 border-2 rounded-lg"
                    onBlur={(e) => {
                      e.target.value = removeLeadingZeros(e.target.value);
                    }}
                  />
                </div>

                {/* الوحدة */}
                <div className="space-y-2">
                  <Label htmlFor="unit_id" className="text-sm font-semibold">الوحدة</Label>
                  <select
                    {...register('unit_id')}
                    className="w-full p-3 border-2 rounded-lg text-base"
                  >
                    <option value="">اختر الوحدة...</option>
                    {units.map((unit: any) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.icon} {unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* عرض المبلغ المحسوب */}
                <div className="col-span-3 p-3 bg-white rounded-lg border-2 border-purple-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">المبلغ قبل الضريبة:</span>
                    <span className="text-xl font-bold text-purple-600">
                      {calculatedAmount.toFixed(2)} ر.س
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({watchedQuantity || 0} × {watchedUnitPrice || 0})
                  </div>
                </div>
              </div>
            ) : (
              /* المبلغ المباشر */
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-base font-semibold">المبلغ (ريال) *</Label>
                <Input
                  {...register('amount', { 
                    required: !useQuantityMode, 
                    validate: (value) => {
                      const num = parseFloat(value);
                      if (isNaN(num) || num <= 0) return 'يجب أن يكون المبلغ أكبر من صفر';
                      return true;
                    },
                    onChange: (e) => {
                      // السماح فقط بالأرقام والنقطة العشرية
                      e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                      e.target.value = removeLeadingZeros(e.target.value);
                    }
                  })}
                  type="text"
                  inputMode="decimal"
                  placeholder="أدخل المبلغ (مثال: 1.50 أو 100.609)"
                  className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-purple-500"
                  onBlur={(e) => {
                    e.target.value = removeLeadingZeros(e.target.value);
                  }}
                />
                {errors.amount && (
                  <span className="text-sm text-red-600 font-medium">{errors.amount.message}</span>
                )}
              </div>
            )}

            {/* معدل الضريبة */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="taxRate" className="text-base font-semibold">معدل الضريبة (%)</Label>
                <span className="text-sm text-gray-500">اختياري</span>
              </div>
              <Input
                {...register('taxRate', {
                  onChange: (e) => {
                    // السماح فقط بالأرقام والنقطة العشرية
                    e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    e.target.value = removeLeadingZeros(e.target.value);
                  }
                })}
                type="text"
                inputMode="decimal"
                onBlur={(e) => {
                  e.target.value = removeLeadingZeros(e.target.value);
                }}
                placeholder="15"
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-purple-500"
              />
              {taxAmount > 0 && (
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="text-sm font-medium text-gray-600">قيمة الضريبة:</span>
                  <span className="text-lg font-bold text-yellow-700">{taxAmount.toFixed(2)} ر.س</span>
                </div>
              )}
            </div>

            {/* الإجمالي النهائي */}
            {totalAmount > 0 && (
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <div className="flex justify-between items-center text-white">
                  <span className="text-lg font-bold">💰 الإجمالي النهائي:</span>
                  <span className="text-2xl font-extrabold">{totalAmount.toFixed(2)} ر.س</span>
                </div>
              </div>
            )}

            {/* التاريخ */}
            <div className="space-y-3">
              <Label htmlFor="date" className="text-base font-semibold">📅 التاريخ *</Label>
              <div className="relative">
                <Input
                  {...register('date', { required: 'التاريخ مطلوب' })}
                  type="date"
                  className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-purple-500 bg-white [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{
                    colorScheme: 'light',
                    fontSize: '16px' // منع الزوم في iOS
                  }}
                />
              </div>
              {errors.date && (
                <span className="text-sm text-red-600 font-medium">{errors.date.message}</span>
              )}
            </div>

            {/* طريقة الدفع */}
            <div className="space-y-3">
              <Label htmlFor="paymentMethod" className="text-base font-semibold">💳 طريقة الدفع</Label>
              <select
                {...register('paymentMethod')}
                className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="">اختر طريقة الدفع</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.icon} {method.name}
                  </option>
                ))}
              </select>
            </div>

            {/* الملاحظات */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-semibold">الملاحظات</Label>
              <Textarea
                {...register('notes')}
                placeholder="أي ملاحظات إضافية..."
                rows={4}
                className="text-base p-4 border-2 rounded-xl resize-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* ملخص الحساب */}
          {calculatedAmount > 0 && (
            <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-xl space-y-4">
              <h4 className="font-bold text-lg text-purple-800 text-center">ملخص الحساب</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600 font-medium">المبلغ الأساسي:</span>
                  <span className="font-bold text-lg">{calculatedAmount.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600 font-medium">الضريبة ({taxRate}%):</span>
                  <span className="font-bold text-lg text-orange-600">{taxAmount.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-100 border-2 border-purple-300 rounded-lg">
                  <span className="text-purple-800 font-bold">الإجمالي:</span>
                  <span className="font-bold text-xl text-purple-800">{totalAmount.toFixed(2)} ريال</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-6 border-t-2">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-4 text-lg font-bold rounded-xl bg-purple-600 hover:bg-purple-700 min-h-[56px]"
            >
              {createMutation.isPending ? '⏳ جاري الحفظ...' : '✅ حفظ الإنفاق المتوقع'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onClose()
              }}
              className="w-full py-4 text-lg font-bold rounded-xl border-2 min-h-[56px]"
            >
              ❌ إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
