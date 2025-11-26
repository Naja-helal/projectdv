import { useState } from 'react'
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
import type { CreateCategoryData } from '@/types'

interface AddCategoryFormProps {
  open: boolean
  onClose: () => void
}

export default function AddCategoryForm({ open, onClose }: AddCategoryFormProps) {
  const queryClient = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#3b82f6',
    icon: '',
    description: '',
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryData) => categoryApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setFormData({
        name: '',
        code: '',
        color: '#3b82f6',
        icon: '',
        description: '',
      })
      setErrors({})
      onClose()
    },
    onError: (error) => {
      console.error('خطأ في إنشاء الفئة:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // التحقق من الحقول المطلوبة
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'اسم الفئة مطلوب'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    createMutation.mutate(formData)
  }

  const predefinedColors = [
    '#ef4444', '#f97316', '#06b6d4', '#10b981', '#6b7280',
    '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#84cc16'
  ]

  const predefinedIcons = [
    '👷', '🚚', '🌐', '💰', '📋', '🧱', '🔧', '🚗', '🏪', '📱'
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg max-h-[95vh] overflow-y-auto m-0 sm:m-6 rounded-none sm:rounded-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-center">إضافة فئة جديدة</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            أدخل تفاصيل الفئة الجديدة
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 px-1">
          {/* رسالة تنبيه عامة للأخطاء */}
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-base font-bold text-red-700 mb-2">يرجى تصحيح الأخطاء التالية:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field} className="font-medium">{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-semibold">اسم الفئة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: اشتراكات مواقع/هوست"
                className={`text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-sm text-red-600 font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="code" className="text-base font-semibold">الرمز (اختياري)</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="مثال: hosting"
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للفئة..."
                rows={3}
                className="text-base p-4 border-2 rounded-xl resize-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">اللون</Label>
              <div className="flex gap-3 flex-wrap">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-12 h-12 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
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
                    className={`w-12 h-12 border-2 rounded-xl flex items-center justify-center hover:bg-gray-100 text-xl ${formData.icon === icon ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🏷️"
                maxLength={2}
                className="text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || !formData.name.trim()}
              className="w-full py-4 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 min-h-[56px]"
            >
              {createMutation.isPending ? '⏳ جاري الحفظ...' : '✅ حفظ الفئة'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  name: '',
                  code: '',
                  color: '#3b82f6',
                  icon: '',
                  description: '',
                })
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
