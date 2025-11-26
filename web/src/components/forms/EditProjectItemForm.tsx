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
import { projectItemApi } from '@/lib/api'
import type { ProjectItem, CreateProjectItemData } from '@/types'

interface EditProjectItemFormProps {
  projectItem: ProjectItem | null
  open: boolean
  onClose: () => void
}

export default function EditProjectItemForm({ projectItem, open, onClose }: EditProjectItemFormProps) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#10b981',
    icon: '',
    unit: '',
  })

  useEffect(() => {
    if (projectItem) {
      setFormData({
        name: projectItem.name || '',
        code: projectItem.code || '',
        description: projectItem.description || '',
        color: projectItem.color || '#10b981',
        icon: projectItem.icon || '',
        unit: projectItem.unit || '',
      })
    }
  }, [projectItem])

  const updateMutation = useMutation({
    mutationFn: (data: CreateProjectItemData) => 
      projectItemApi.updateProjectItem(projectItem!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-items'] })
      onClose()
    },
    onError: (error: Error) => {
      console.error('خطأ في تحديث عنصر المشروع:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !projectItem) return
    updateMutation.mutate(formData)
  }

  const predefinedColors = [
    '#ef4444', '#f97316', '#06b6d4', '#10b981', '#6b7280',
    '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#84cc16'
  ]

  const predefinedIcons = [
    '🏗️', '👷', '🚜', '🚚', '📋', '🧱', '🔧', '⚙️', '🏭', '🔩',
    '🏗', '🔨', '🪛', '⛏️', '🪚', '📐', '📏', '🧰', '🛠', '⚒️'
  ]

  const predefinedUnits = [
    'قطعة', 'طن', 'متر', 'متر مربع', 'متر مكعب', 
    'كيلو', 'لتر', 'ساعة', 'يوم', 'شهر'
  ]

  if (!projectItem) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل عنصر المشروع</DialogTitle>
          <DialogDescription>تحديث معلومات عنصر المشروع</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">اسم العنصر *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: أعمال الخرسانة"
              required
              className="text-base p-4 border-2 rounded-xl min-h-[56px] focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-code">كود العنصر</Label>
            <Input
              id="edit-code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="مثال: CONC"
              className="text-base p-4 border-2 rounded-xl min-h-[56px] focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-unit">وحدة القياس</Label>
            <select
              id="edit-unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[56px] focus:border-blue-500"
            >
              <option value="">اختر وحدة القياس</option>
              {predefinedUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">الوصف</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف عنصر المشروع..."
              rows={3}
              className="text-base p-4 border-2 rounded-xl min-h-[100px] resize-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label>اللون</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>الأيقونة</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all ${
                    formData.icon === icon ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
