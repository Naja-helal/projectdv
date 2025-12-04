import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { categoriesApi } from '@/lib/supabaseApi'
import type { Category, CreateCategoryData } from '@/types'

interface EditCategoryFormProps {
  category: Category | null
  open: boolean
  onClose: () => void
}

export default function EditCategoryForm({ category, open, onClose }: EditCategoryFormProps) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6',
    icon: '',
  })

  // تحديث القيم عند تغيير الفئة
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        code: category.code || '',
        description: category.description || '',
        color: category.color || '#3b82f6',
        icon: category.icon || '',
      })
    }
  }, [category])

  // mutation لتحديث الفئة
  const updateMutation = useMutation({
    mutationFn: (data: CreateCategoryData) => 
      categoriesApi.update(category!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
    onError: (error) => {
      console.error('خطأ في تحديث الفئة:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !formData.name.trim()) return
    updateMutation.mutate(formData)
  }

  const predefinedColors = [
    '#ef4444', '#f97316', '#06b6d4', '#10b981', '#6b7280',
    '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#84cc16'
  ]

  const predefinedIcons = [
    '📱', '💻', '🌐', '📡', '☁️', '🔧', '⚙️', '📊', '🏢', '🚗'
  ]

  if (!category) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل الفئة</DialogTitle>
          <DialogDescription>
            تحديث معلومات الفئة
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم الفئة *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: اشتراكات المواقع"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-code">الرمز (اختياري)</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="مثال: SUB"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">الوصف (اختياري)</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  className="w-10 h-10 rounded-xl border-2 border-muted hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
            <Input
              id="edit-color-input"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              type="color"
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
                  onClick={() => setFormData({ ...formData, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
            <Input
              id="edit-icon-input"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="📂"
              maxLength={2}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
