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
import { paymentMethodsApi } from '@/lib/supabaseApi'
import type { PaymentMethod, CreatePaymentMethodData } from '@/types'

interface EditPaymentMethodFormProps {
  paymentMethod: PaymentMethod | null
  open: boolean
  onClose: () => void
}

export default function EditPaymentMethodForm({ paymentMethod, open, onClose }: EditPaymentMethodFormProps) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#10b981',
    icon: '',
  })

  useEffect(() => {
    if (paymentMethod) {
      setFormData({
        name: paymentMethod.name || '',
        code: paymentMethod.code || '',
        description: paymentMethod.description || '',
        color: paymentMethod.color || '#10b981',
        icon: paymentMethod.icon || '',
      })
    }
  }, [paymentMethod])

  const updateMutation = useMutation({
    mutationFn: (data: CreatePaymentMethodData) => 
      paymentMethodsApi.update(paymentMethod!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] })
      onClose()
    },
    onError: (error) => {
      console.error('خطأ في تحديث طريقة الدفع:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !paymentMethod) return
    updateMutation.mutate(formData)
  }

  const predefinedColors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', 
    '#ef4444', '#ec4899', '#84cc16', '#f97316', '#6b7280'
  ]

  const predefinedIcons = [
    '💵', '🏦', '📝', '💳', '📱', '⏰', '💰', '🏪', '💸', '🔒'
  ]

  if (!paymentMethod) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل طريقة الدفع</DialogTitle>
          <DialogDescription>تحديث معلومات طريقة الدفع</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم طريقة الدفع *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: نقداً"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-code">الرمز (اختياري)</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="مثال: CASH"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">الوصف</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف طريقة الدفع..."
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
              placeholder="💳"
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
              className="bg-gradient-to-r from-green-600 to-green-700"
            >
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
