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
import { projectTypeApi } from '@/lib/api'
import type { ProjectType, CreateProjectTypeData } from '@/types'

interface EditProjectTypeFormProps {
  projectType: ProjectType | null
  open: boolean
  onClose: () => void
}

export default function EditProjectTypeForm({ projectType, open, onClose }: EditProjectTypeFormProps) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#8b5cf6',
    icon: '',
  })

  useEffect(() => {
    if (projectType) {
      setFormData({
        name: projectType.name || '',
        code: projectType.code || '',
        description: projectType.description || '',
        color: projectType.color || '#8b5cf6',
        icon: projectType.icon || '',
      })
    }
  }, [projectType])

  const updateMutation = useMutation({
    mutationFn: (data: CreateProjectTypeData) => 
      projectTypeApi.updateProjectType(projectType!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-types'] })
      onClose()
    },
    onError: (error) => {
      console.error('خطأ في تحديث نوع المشروع:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !projectType) return
    updateMutation.mutate(formData)
  }

  const predefinedColors = [
    '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#06b6d4', 
    '#ef4444', '#f97316', '#ec4899', '#6b7280', '#84cc16'
  ]

  const predefinedIcons = [
    '🏗️', '🏢', '🏭', '🏛️', '🏰', '🏟️', '🏗', '🌆', '🏙️', '🏘️',
    '⛪', '🕌', '🕍', '🏦', '🏨', '🏪', '🏫', '🏬', '🏤', '🏣'
  ]

  if (!projectType) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل نوع المشروع</DialogTitle>
          <DialogDescription>تحديث معلومات نوع المشروع</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">اسم نوع المشروع *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: إنشاءات"
              required
              className="text-base p-4 border-2 rounded-xl min-h-[56px] focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-code">الكود</Label>
            <Input
              id="edit-code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="مثال: CONST"
              className="text-base p-4 border-2 rounded-xl min-h-[56px] focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">الوصف</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف نوع المشروع..."
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
