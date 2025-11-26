import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { categoryApi } from '@/lib/api'
import type { Category, CreateCategoryData } from '@/types'

interface EditCategoryFormProps {
  category: Category | null
  open: boolean
  onClose: () => void
}

export default function EditCategoryForm({ category, open, onClose }: EditCategoryFormProps) {
  const queryClient = useQueryClient()
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateCategoryData>({
    defaultValues: {
      name: category?.name || '',
      code: category?.code || '',
      color: category?.color || '#3b82f6',
      icon: category?.icon || '',
      description: category?.description || '',
    }
  })

  // تحديث القيم عند تغيير الفئة
  useEffect(() => {
    if (category) {
      setValue('name', category.name)
      setValue('code', category.code || '')
      setValue('color', category.color)
      setValue('icon', category.icon || '')
      setValue('description', category.description || '')
    }
  }, [category, setValue])

  // mutation لتحديث الفئة
  const updateMutation = useMutation({
    mutationFn: (data: CreateCategoryData) => 
      categoryApi.updateCategory(category!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      reset()
      onClose()
    },
    onError: (error) => {
      console.error('خطأ في تحديث الفئة:', error)
    }
  })

  const onSubmit = (data: CreateCategoryData) => {
    if (!category) return
    updateMutation.mutate(data)
  }

  const predefinedColors = [
    '#ef4444', '#f97316', '#06b6d4', '#10b981', '#6b7280',
    '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#84cc16'
  ]

  const predefinedIcons = [
    '👷', '🚚', '🌐', '💰', '📋', '🧱', '🔧', '🚗', '🏪', '📱'
  ]

  if (!category) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg max-h-[95vh] overflow-y-auto m-0 sm:m-6 rounded-none sm:rounded-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-center">تحرير الفئة</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            تحديث تفاصيل فئة "{category.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-1">
          <div className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-semibold">اسم الفئة *</Label>
              <Input
                {...register('name', { required: 'اسم الفئة مطلوب' })}
                placeholder="مثال: اشتراكات مواقع/هوست"
                className="text-base p-4 border-2 rounded-xl min-h-[56px] focus:border-blue-500"
              />
              {errors.name && (
                <span className="text-sm text-red-600 font-medium">{errors.name.message}</span>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="code" className="text-base font-semibold">الرمز (اختياري)</Label>
              <Input
                {...register('code')}
                placeholder="مثال: hosting"
                className="text-base p-4 border-2 rounded-xl min-h-[56px] focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold">الوصف (اختياري)</Label>
              <Textarea
                {...register('description')}
                placeholder="وصف مختصر للفئة..."
                rows={3}
                className="text-base p-4 border-2 rounded-xl min-h-[100px] resize-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">اللون</Label>
              <div className="flex gap-3 flex-wrap">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-12 h-12 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: color }}
                    onClick={() => setValue('color', color)}
                  />
                ))}
              </div>
              <Input
                {...register('color')}
                type="color"
                className="w-24 h-12 border-2 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">الأيقونة</Label>
              <div className="flex gap-3 flex-wrap">
                {predefinedIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className="w-12 h-12 border-2 rounded-xl flex items-center justify-center hover:bg-gray-100 text-xl border-gray-300"
                    onClick={() => setValue('icon', icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <Input
                {...register('icon')}
                placeholder="🏷️"
                maxLength={2}
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-4 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 min-h-[56px]"
            >
              {updateMutation.isPending ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}
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
