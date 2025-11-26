import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { expenseApi, categoryApi } from '@/lib/api'
import type { Expense, CreateExpenseData, ExpenseFormData } from '@/types'

interface EditExpenseFormProps {
  expense: Expense | null
  open: boolean
  onClose: () => void
}

export default function EditExpenseForm({ expense, open, onClose }: EditExpenseFormProps) {
  const queryClient = useQueryClient()
  
  // دالة لإزالة الأصفار البادئة من الأرقام
  const removeLeadingZeros = (value: string): string => {
    if (!value || value === '' || value === '0' || value === '0.') return value;
    const cleaned = value.replace(/^0+(?=\d)/, '');
    return cleaned || '0';
  };
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ExpenseFormData>()

  // جلب البيانات المرجعية
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories
  })

  // تحديث القيم عند تغيير المصروف
  useEffect(() => {
    if (expense) {
      setValue('categoryId', expense.category_id)
      setValue('amount', expense.amount)
      setValue('taxRate', expense.tax_rate || 0)
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
  }, [expense, setValue])

  // مراقبة المبلغ ومعدل الضريبة لحساب الإجمالي
  const amount = watch('amount')
  const taxRate = watch('taxRate')
  
  const taxAmount = amount && taxRate ? (amount * (taxRate / 100)) : 0
  const totalAmount = (amount || 0) + taxAmount

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

  const onSubmit = (data: ExpenseFormData) => {
    if (!expense) return
    
    // تحويل التاريخ من string إلى timestamp
    const dateValue = new Date(data.date).getTime()
    
    const submitData: CreateExpenseData & { id: number } = {
      ...data,
      id: expense.id,
      date: dateValue,
    }
    
    updateMutation.mutate(submitData)
  }

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
                {...register('categoryId', { 
                  required: 'الفئة مطلوبة',
                  valueAsNumber: true 
                })}
                className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">اختر الفئة</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <span className="text-sm text-red-600 font-medium">{errors.categoryId.message}</span>
              )}
            </div>

            {/* المبلغ */}
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base font-semibold">المبلغ (ريال) *</Label>
              <Input
                {...register('amount', { 
                  required: 'المبلغ مطلوب',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'المبلغ يجب أن يكون أكبر من صفر' },
                  onChange: (e) => {
                    e.target.value = removeLeadingZeros(e.target.value);
                  }
                })}
                type="number"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                step="0.01"
                placeholder="أدخل المبلغ"
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
                onBlur={(e) => {
                  e.target.value = removeLeadingZeros(e.target.value);
                }}
              />
              {errors.amount && (
                <span className="text-sm text-red-600 font-medium">{errors.amount.message}</span>
              )}
            </div>

            {/* معدل الضريبة */}
            <div className="space-y-3">
              <Label htmlFor="taxRate" className="text-base font-semibold">معدل الضريبة (%)</Label>
              <Input
                {...register('taxRate', { 
                  valueAsNumber: true,
                  onChange: (e) => {
                    e.target.value = removeLeadingZeros(e.target.value);
                  }
                })}
                type="number"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
                onBlur={(e) => {
                  e.target.value = removeLeadingZeros(e.target.value);
                }}
              />
            </div>

            {/* الملاحظات */}
            <div className="space-y-3">
              <Label htmlFor="date" className="text-base font-semibold">التاريخ *</Label>
              <Input
                {...register('date', { 
                  required: 'التاريخ مطلوب'
                })}
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
              />
              {errors.date && (
                <span className="text-sm text-red-600 font-medium">{errors.date.message}</span>
              )}
            </div>

            {/* طريقة الدفع */}
            <div className="space-y-3">
              <Label htmlFor="paymentMethod" className="text-base font-semibold">طريقة الدفع</Label>
              <select
                {...register('paymentMethod')}
                className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">اختر طريقة الدفع</option>
                <option value="نقدي">💵 نقدي</option>
                <option value="بنك">🏦 تحويل بنكي</option>
                <option value="شيك">📝 شيك</option>
                <option value="بطاقة ائتمان">💳 بطاقة ائتمان</option>
                <option value="محفظة إلكترونية">📱 محفظة إلكترونية</option>
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
          </div>

          {/* الملاحظات */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-semibold">الملاحظات</Label>
            <Textarea
              {...register('notes')}
              placeholder="ملاحظات إضافية..."
              rows={3}
              className="text-base p-4 border-2 rounded-xl resize-none focus:border-blue-500"
            />
          </div>

          {/* ملخص المبالغ */}
          {amount && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-5 rounded-xl border-2 border-blue-100">
              <h3 className="text-lg font-bold text-center mb-3 text-gray-800">💰 ملخص المبالغ</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-base">
                  <span className="font-medium">المبلغ الأساسي:</span>
                  <span className="font-bold text-blue-600">{amount} ريال</span>
                </div>
                {taxRate && taxRate > 0 && (
                  <div className="flex justify-between items-center text-base">
                    <span className="font-medium">الضريبة ({taxRate}%):</span>
                    <span className="font-bold text-orange-600">{taxAmount.toFixed(2)} ريال</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-lg border-t-2 border-gray-300 pt-3">
                  <span>الإجمالي:</span>
                  <span className="text-green-600 text-xl">{totalAmount.toFixed(2)} ريال</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onClose()
              }}
              className="w-full sm:w-auto min-h-[48px] text-base font-semibold border-2 hover:bg-gray-50"
            >
              ❌ إلغاء
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto min-h-[48px] text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateMutation.isPending ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
