import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { paymentMethodApi } from '@/lib/api'

interface CreatePaymentMethodData {
  name: string
  code?: string
  description?: string
  color?: string
  icon?: string
}

export default function PaymentMethods() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  // جلب طرق الدفع
  const { data: paymentMethods = [], isLoading, error } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodApi.getPaymentMethods
  })

  // نموذج إضافة طريقة دفع
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePaymentMethodData>()

  // إضافة طريقة دفع جديدة
  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentMethodData) => paymentMethodApi.createPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      reset()
      setShowForm(false)
    },
    onError: (error) => {
      console.error('خطأ في إضافة طريقة الدفع:', error)
    }
  })

  // حذف طريقة دفع
  const deleteMutation = useMutation({
    mutationFn: (id: number) => paymentMethodApi.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    }
  })

  const onSubmit = (data: CreatePaymentMethodData) => {
    createMutation.mutate(data)
  }

  const handleDelete = (id: number, name: string) => {
    if (confirm(`هل أنت متأكد من حذف طريقة الدفع "${name}"؟`)) {
      deleteMutation.mutate(id)
    }
  }

  const predefinedColors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', 
    '#ef4444', '#ec4899', '#84cc16', '#f97316', '#6b7280'
  ]

  const predefinedIcons = [
    '💵', '🏦', '📝', '💳', '📱', '⏰', '💰', '🏪', '💸', '🔒'
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل طرق الدفع...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>خطأ في تحميل طرق الدفع</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">💳 طرق الدفع</h1>
          <p className="text-muted-foreground mt-2">
            إدارة طرق الدفع ({paymentMethods.length} طريقة)
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
        >
          ➕ إضافة طريقة دفع
        </Button>
      </div>

      {/* إحصائيات بسيطة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0">
          <CardContent className="p-4 text-white">
            <div className="text-2xl font-bold">{paymentMethods.length}</div>
            <div className="text-sm text-blue-100">إجمالي الطرق</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0">
          <CardContent className="p-4 text-white">
            <div className="text-2xl font-bold">{paymentMethods.filter(m => m.icon).length}</div>
            <div className="text-sm text-green-100">بأيقونات</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0">
          <CardContent className="p-4 text-white">
            <div className="text-2xl font-bold">{paymentMethods.filter(m => m.color).length}</div>
            <div className="text-sm text-purple-100">بألوان مخصصة</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0">
          <CardContent className="p-4 text-white">
            <div className="text-2xl font-bold">{paymentMethods.filter(m => m.code).length}</div>
            <div className="text-sm text-orange-100">برمز</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paymentMethods.map((method) => (
          <Card key={method.id} className="hover:shadow-lg transition-all duration-200 border-2">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-md"
                    style={{ backgroundColor: method.color || '#10b981' }}
                  >
                    {method.icon || '💳'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{method.name}</h3>
                    {method.code && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {method.code}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(method.id, method.name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  🗑️
                </Button>
              </div>
              
              {method.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {method.description}
                </p>
              )}

              <div className="text-xs text-muted-foreground pt-3 border-t">
                تم الإنشاء: {new Date(method.created_at).toLocaleDateString('ar-SA')}
              </div>
            </CardContent>
          </Card>
        ))}

        {paymentMethods.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-lg font-semibold mb-2">لا توجد طرق دفع</h3>
                <p className="text-muted-foreground mb-4">
                  أضف أول طريقة دفع
                </p>
                <Button onClick={() => setShowForm(true)}>
                  إضافة طريقة دفع
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* نموذج إضافة طريقة دفع */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة طريقة دفع جديدة</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل طريقة الدفع الجديدة
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم طريقة الدفع *</Label>
                <Input
                  {...register('name', { required: 'اسم طريقة الدفع مطلوب' })}
                  placeholder="مثال: نقداً"
                />
                {errors.name && (
                  <span className="text-sm text-destructive">{errors.name.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">الرمز (اختياري)</Label>
                <Input
                  {...register('code')}
                  placeholder="مثال: CASH"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                {...register('description')}
                placeholder="وصف مختصر لطريقة الدفع..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>اللون</Label>
              <div className="flex gap-2 flex-wrap">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-10 h-10 rounded-xl border-2 border-muted hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      const input = document.getElementById('color-input') as HTMLInputElement
                      if (input) input.value = color
                    }}
                  />
                ))}
              </div>
              <Input
                id="color-input"
                {...register('color')}
                type="color"
                defaultValue="#10b981"
                className="w-24 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>الأيقونة</Label>
              <div className="flex gap-2 flex-wrap">
                {predefinedIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className="w-10 h-10 border-2 rounded-xl flex items-center justify-center hover:bg-muted text-xl hover:scale-110 transition-transform"
                    onClick={() => {
                      const input = document.getElementById('icon-input') as HTMLInputElement
                      if (input) input.value = icon
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <Input
                id="icon-input"
                {...register('icon')}
                placeholder="💳"
                maxLength={2}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset()
                  setShowForm(false)
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-green-700"
              >
                {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ طريقة الدفع'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
