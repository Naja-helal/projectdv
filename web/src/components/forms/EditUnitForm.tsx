import { useEffect, useState } from 'react'
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
import { unitApi } from '@/lib/api'
import type { Unit } from '@/types'

interface EditUnitFormProps {
  unit: Unit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface FormData {
  name: string
  code: string
  description: string
  color: string
  icon: string
}

export default function EditUnitForm({ unit, open, onOpenChange, onSuccess }: EditUnitFormProps) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6',
    icon: '📏',
  })

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name || '',
        code: unit.code || '',
        description: unit.description || '',
        color: unit.color || '#3b82f6',
        icon: unit.icon || '📏',
      })
    }
  }, [unit])

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => 
      unitApi.updateUnit(unit!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      onSuccess()
    },
    onError: (error) => {
      console.error('خطأ في تحديث الوحدة:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !unit) return
    updateMutation.mutate(formData)
  }

  const predefinedColors = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', 
    '#ef4444', '#ec4899', '#84cc16', '#f97316', '#6b7280'
  ]

  const predefinedIcons = [
    '📏', '📦', '🎒', '⬛', '🥤', '⚖️', '🏋️', '🗃️', '📊', '📐'
  ]

  if (!unit) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الوحدة</DialogTitle>
          <DialogDescription>تحديث معلومات الوحدة</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">اسم الوحدة *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: متر، كيلو، قطعة"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-code">الكود</Label>
            <Input
              id="edit-code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="مثال: M، KG، PCS"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">الوصف</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف الوحدة..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>اللون</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-20 h-10"
            />
          </div>

          <div className="space-y-2">
            <Label>الأيقونة</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {predefinedIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center text-2xl ${
                    formData.icon === icon ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <Input
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="📏"
              maxLength={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
