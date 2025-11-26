import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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
import { expenseApi, categoryApi, projectApi, projectItemApi, paymentMethodApi } from '@/lib/api'
import type { CreateExpenseData, Expense } from '@/types'

interface EditExpenseFormProps {
  expense: Expense | null
  open: boolean
  onClose: () => void
}

interface FormData {
  categoryId: string
  projectId: string
  projectItemId: string
  quantity: string
  unit_price: string
  unit: string
  amount: string
  taxRate: string
  date: string
  paymentMethod: string
  reference: string
  invoiceNumber: string
  description: string
  details: string
  notes: string
  useQuantity: boolean // للتبديل بين نظام الكمية والمبلغ المباشر
}

export default function EditExpenseForm({ expense, open, onClose }: EditExpenseFormProps) {
  const queryClient = useQueryClient()
  
  // دالة محسّنة لإزالة الأصفار البادئة - تعمل على الويب والموبايل
  const removeLeadingZeros = (value: string): string => {
    if (!value || value === '' || value === '0' || value === '0.') return value;
    // إزالة الأصفار البادئة مع الحفاظ على الأرقام العشرية
    const cleaned = value.replace(/^0+(?=\d)/, '');
    return cleaned || '0';
  };

  // دالة للتعامل مع الإدخال الفوري على الموبايل
  const handleNumericInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    const newValue = removeLeadingZeros(oldValue);
    
    if (newValue !== oldValue) {
      input.value = newValue;
      // الحفاظ على موضع المؤشر
      if (cursorPosition !== null) {
        const diff = oldValue.length - newValue.length;
        input.setSelectionRange(cursorPosition - diff, cursorPosition - diff);
      }
    }
  };
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      categoryId: '',
      projectId: '',
      projectItemId: '',
      quantity: '1',
      unit_price: '',
      unit: 'قطعة',
      amount: '',
      taxRate: '0',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      reference: '',
      invoiceNumber: '',
      description: '',
      details: '',
      notes: '',
      useQuantity: false,
    }
  })

  // جلب البيانات المرجعية
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.getProjects
  })

  // جلب جميع عناصر المشروع المستقلة
  const { data: projectItems = [] } = useQuery({
    queryKey: ['project-items'],
    queryFn: projectItemApi.getProjectItems
  })

  // جلب جميع طرق الدفع المستقلة
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodApi.getPaymentMethods
  })

  // مراقبة المشروع المختار
  const selectedProjectId = watch('projectId')

  // عند تغيير المشروع، إعادة تعيين العنصر
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue('projectId', e.target.value)
    setValue('projectItemId', '')
  }

  // تحميل بيانات المصروف عند فتح الفورم
  useEffect(() => {
    if (expense && open) {
      setValue('categoryId', String(expense.category_id))
      setValue('projectId', expense.project_id ? String(expense.project_id) : '')
      setValue('projectItemId', expense.project_item_id ? String(expense.project_item_id) : '')
      setValue('quantity', expense.quantity ? String(expense.quantity) : '1')
      setValue('unit_price', expense.unit_price ? String(expense.unit_price) : '')
      setValue('unit', expense.unit || 'قطعة')
      setValue('amount', String(expense.amount))
      setValue('taxRate', String(expense.tax_rate || 0))
      setValue('useQuantity', !!(expense.quantity && expense.unit_price))
      
      // تحويل التاريخ من timestamp إلى تنسيق date input
      const dateValue = typeof expense.date === 'number' 
        ? new Date(expense.date).toISOString().split('T')[0]
        : expense.date
      setValue('date', dateValue)
      
      setValue('paymentMethod', expense.payment_method || '')
      setValue('reference', expense.reference || '')
      setValue('invoiceNumber', expense.invoice_number || '')
      setValue('description', expense.description || '')
      setValue('details', expense.details || '')
      setValue('notes', expense.notes || '')
    }
  }, [expense, open, setValue])

  // mutation لتحديث المصروف
  const updateMutation = useMutation({
    mutationFn: (data: CreateExpenseData & { id: number }) => 
      expenseApi.updateExpense(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      reset()
      onClose()
    },
    onError: (error) => {
      console.error('خطأ في تحديث المصروف:', error)
    }
  })

  const onSubmit = (data: FormData) => {
    if (!expense) return
    
    const expenseData: CreateExpenseData & { id: number } = {
      id: expense.id,
      categoryId: parseInt(data.categoryId),
      projectId: data.projectId ? parseInt(data.projectId) : undefined,
      projectItemId: data.projectItemId ? parseInt(data.projectItemId) : undefined,
      quantity: data.useQuantity ? parseFloat(data.quantity) : undefined,
      unit_price: data.useQuantity ? parseFloat(data.unit_price) : undefined,
      unit: data.useQuantity ? data.unit : undefined,
      amount: !data.useQuantity ? parseFloat(data.amount) : parseFloat(data.quantity) * parseFloat(data.unit_price),
      taxRate: parseFloat(data.taxRate),
      date: new Date(data.date).getTime(),
      paymentMethod: data.paymentMethod || undefined,
      reference: data.reference || undefined,
      invoiceNumber: data.invoiceNumber || undefined,
      description: data.description || undefined,
      details: data.details || undefined,
      notes: data.notes || undefined,
    }

    updateMutation.mutate(expenseData)
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

  if (!expense) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg max-h-[95vh] overflow-y-auto m-0 sm:m-6 rounded-none sm:rounded-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-center">تحرير المصروف</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            تحديث تفاصيل المصروف
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-1">
          {/* الحقول الأساسية */}
          <div className="space-y-5">
            {/* الوصف */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold">الوصف</Label>
              <Input
                {...register('description')}
                type="text"
                placeholder="وصف المصروف (مثل: شراء مواد بناء)"
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
              />
            </div>

            {/* التفاصيل */}
            <div className="space-y-3">
              <Label htmlFor="details" className="text-base font-semibold">التفاصيل</Label>
              <Textarea
                {...register('details')}
                placeholder="تفاصيل إضافية عن المصروف..."
                className="text-base p-4 border-2 rounded-xl min-h-[80px] focus:border-blue-500"
                rows={3}
              />
            </div>

            {/* الفئة */}
            <div className="space-y-3">
              <Label htmlFor="categoryId" className="text-base font-semibold">الفئة *</Label>
              <select
                {...register('categoryId', { required: 'الفئة مطلوبة' })}
                className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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

            {/* المشروع */}
            <div className="space-y-3">
              <Label htmlFor="projectId" className="text-base font-semibold">المشروع (اختياري)</Label>
              <select
                {...register('projectId')}
                onChange={handleProjectChange}
                className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">بدون مشروع</option>
                {projects.filter(p => p.status === 'active').map((project) => (
                  <option key={project.id} value={project.id}>
                    📁 {project.name} {project.code && `(${project.code})`}
                  </option>
                ))}
              </select>
            </div>

            {/* عنصر المشروع */}
            {selectedProjectId && projectItems.length > 0 && (
              <div className="space-y-3">
                <Label htmlFor="projectItemId" className="text-base font-semibold">عنصر المشروع (اختياري)</Label>
                <select
                  {...register('projectItemId')}
                  className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">بدون عنصر محدد</option>
                  {projectItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* التبديل بين نظام الكمية والمبلغ المباشر */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
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
                        e.target.value = removeLeadingZeros(e.target.value);
                      }
                    })}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    step="0.01"
                    placeholder="10"
                    className="text-base p-3 border-2 rounded-lg"
                    onInput={handleNumericInput}
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
                        e.target.value = removeLeadingZeros(e.target.value);
                      }
                    })}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    step="0.01"
                    placeholder="100"
                    className="text-base p-3 border-2 rounded-lg"
                    onInput={handleNumericInput}
                    onBlur={(e) => {
                      e.target.value = removeLeadingZeros(e.target.value);
                    }}
                  />
                </div>

                {/* الوحدة */}
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-semibold">الوحدة</Label>
                  <select
                    {...register('unit')}
                    className="w-full p-3 border-2 rounded-lg text-base"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="كيس">كيس</option>
                    <option value="متر">متر</option>
                    <option value="متر مربع">متر مربع</option>
                    <option value="طن">طن</option>
                    <option value="صندوق">صندوق</option>
                    <option value="لتر">لتر</option>
                    <option value="كيلو">كيلو</option>
                    <option value="عبوة">عبوة</option>
                  </select>
                </div>

                {/* عرض المبلغ المحسوب */}
                <div className="col-span-3 p-3 bg-white rounded-lg border-2 border-green-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">المبلغ قبل الضريبة:</span>
                    <span className="text-xl font-bold text-green-600">
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
                    min: { value: 0.01, message: 'يجب أن يكون المبلغ أكبر من صفر' },
                    onChange: (e) => {
                      e.target.value = removeLeadingZeros(e.target.value);
                    }
                  })}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  step="0.01"
                  placeholder="أدخل المبلغ"
                  className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
                  onInput={handleNumericInput}
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
                    e.target.value = removeLeadingZeros(e.target.value);
                  }
                })}
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                step="0.01"
                placeholder="15"
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
                onInput={handleNumericInput}
                onBlur={(e) => {
                  e.target.value = removeLeadingZeros(e.target.value);
                }}
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
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
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
                  className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500 bg-white [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
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
                className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">اختر طريقة الدفع</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.name}>
                    {method.icon} {method.name}
                  </option>
                ))}
              </select>
            </div>

            {/* المرجع */}
            <div className="space-y-3">
              <Label htmlFor="reference" className="text-base font-semibold">المرجع</Label>
              <Input
                {...register('reference')}
                placeholder="رقم المرجع أو الشيك"
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
              />
            </div>

            {/* رقم الفاتورة */}
            <div className="space-y-3">
              <Label htmlFor="invoiceNumber" className="text-base font-semibold">رقم الفاتورة</Label>
              <Input
                {...register('invoiceNumber')}
                placeholder="رقم الفاتورة"
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
              />
            </div>

            {/* الملاحظات */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-semibold">الملاحظات</Label>
              <Textarea
                {...register('notes')}
                placeholder="أي ملاحظات إضافية..."
                rows={4}
                className="text-base p-4 border-2 rounded-xl resize-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* ملخص الحساب */}
          {calculatedAmount > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl space-y-4">
              <h4 className="font-bold text-lg text-blue-800 text-center">ملخص الحساب</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600 font-medium">المبلغ الأساسي:</span>
                  <span className="font-bold text-lg">{calculatedAmount.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600 font-medium">الضريبة ({taxRate}%):</span>
                  <span className="font-bold text-lg text-orange-600">{taxAmount.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-100 border-2 border-green-300 rounded-lg">
                  <span className="text-green-800 font-bold">الإجمالي:</span>
                  <span className="font-bold text-xl text-green-800">{totalAmount.toFixed(2)} ريال</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-6 border-t-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-4 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 min-h-[56px]"
            >
              {updateMutation.isPending ? '⏳ جاري الحفظ...' : '✅ حفظ التعديلات'}
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
