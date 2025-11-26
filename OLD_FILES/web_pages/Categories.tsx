import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { categoryApi } from '@/lib/api'

interface CreateCategoryData {
  name: string;
  code?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export default function Categories() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  // جلب الفئات
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories
  })

  // نموذج إضافة فئة
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateCategoryData>()

  // إضافة فئة جديدة
  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryData) => categoryApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      reset()
      setShowForm(false)
    },
    onError: (error) => {
      console.error('خطأ في إضافة الفئة:', error)
    }
  })

  const onSubmit = (data: CreateCategoryData) => {
    createMutation.mutate(data)
  }

  const predefinedColors = [
    '#ef4444', '#f97316', '#06b6d4', '#10b981', '#6b7280',
    '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#84cc16'
  ]

  const predefinedIcons = [
    '👷', '🚚', '🌐', '💰', '📋', '🧱', '🔧', '🚗', '🏪', '📱'
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل الفئات...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>خطأ في تحميل الفئات</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">الفئات</h1>
          <p className="text-muted-foreground mt-2">
            إدارة فئات المصروفات ({categories.length} فئة)
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          ➕ إضافة فئة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    {category.code && (
                      <p className="text-xs text-muted-foreground">{category.code}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {category.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {category.description}
                </p>
              )}

              <div className="text-xs text-muted-foreground">
                تم الإنشاء: {new Date(category.created_at * 1000).toLocaleDateString('ar-SA')}
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🏷️</div>
                <h3 className="text-lg font-semibold mb-2">لا توجد فئات</h3>
                <p className="text-muted-foreground mb-4">
                  أضف الفئة الأولى لتصنيف المصروفات
                </p>
                <Button onClick={() => setShowForm(true)}>
                  إضافة فئة جديدة
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* نموذج إضافة فئة */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة فئة جديدة</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الفئة الجديدة
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الفئة *</Label>
              <Input
                {...register('name', { required: 'اسم الفئة مطلوب' })}
                placeholder="مثال: اشتراكات مواقع/هوست"
              />
              {errors.name && (
                <span className="text-sm text-destructive">{errors.name.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">الرمز (اختياري)</Label>
              <Input
                {...register('code')}
                placeholder="مثال: hosting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                {...register('description')}
                placeholder="وصف مختصر للفئة..."
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
                    className="w-8 h-8 rounded-full border-2 border-muted"
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
                defaultValue="#3b82f6"
                className="w-20 h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>الأيقونة</Label>
              <div className="flex gap-2 flex-wrap">
                {predefinedIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className="w-8 h-8 border rounded flex items-center justify-center hover:bg-muted"
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
                placeholder="🏷️"
                maxLength={2}
              />
            </div>

            <DialogFooter>
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
              >
                {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ الفئة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
