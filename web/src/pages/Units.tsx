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
import { unitsApi } from '@/lib/supabaseApi'
import EditUnitForm from '@/components/forms/EditUnitForm'
import type { Unit } from '@/types'

interface CreateUnitData {
  name: string
  code?: string
  description?: string
  color?: string
  icon?: string
}

export default function Units() {
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const queryClient = useQueryClient()

  // جلب الوحدات
  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ['units'],
    queryFn: unitsApi.getAll
  })

  // نموذج إضافة وحدة
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUnitData>()

  // إضافة وحدة جديدة
  const createMutation = useMutation({
    mutationFn: (data: CreateUnitData) => unitsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      reset()
      setShowForm(false)
    },
    onError: (error) => {
      console.error('خطأ في إضافة الوحدة:', error)
    }
  })

  // حذف وحدة
  const deleteMutation = useMutation({
    mutationFn: (id: number) => unitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
    }
  })

  const onSubmit = (data: CreateUnitData) => {
    createMutation.mutate(data)
  }

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit)
    setShowEditForm(true)
  }

  const handleDelete = (id: number, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الوحدة "${name}"؟`)) {
      deleteMutation.mutate(id)
    }
  }

  const predefinedColors = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', 
    '#ef4444', '#ec4899', '#84cc16', '#f97316', '#6b7280'
  ]

  const predefinedIcons = [
    '📏', '📦', '🎒', '⬛', '🥤', '⚖️', '🏋️', '🗃️', '📊', '📐'
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل الوحدات...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>خطأ في تحميل الوحدات</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">📏 الوحدات</h1>
          <p className="text-muted-foreground mt-2">
            إدارة وحدات القياس ({units.length} وحدة)
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          ➕ إضافة وحدة جديدة
        </Button>
      </div>

      {/* إحصائيات بسيطة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0">
          <CardContent className="p-4 text-white">
            <div className="text-2xl font-bold">{units.length}</div>
            <div className="text-sm text-blue-100">إجمالي الوحدات</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0">
          <CardContent className="p-4 text-white">
            <div className="text-2xl font-bold">{units.filter(u => u.icon).length}</div>
            <div className="text-sm text-green-100">بأيقونات</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0">
          <CardContent className="p-4 text-white">
            <div className="text-2xl font-bold">{units.filter(u => u.color).length}</div>
            <div className="text-sm text-purple-100">بألوان مخصصة</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0">
          <CardContent className="p-4 text-white">
            <div className="text-2xl font-bold">{units.filter(u => u.description).length}</div>
            <div className="text-sm text-orange-100">بوصف</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {units.map((unit) => (
          <Card key={unit.id} className="hover:shadow-lg transition-all duration-200 border-2">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-md"
                    style={{ backgroundColor: unit.color || '#3b82f6' }}
                  >
                    {unit.icon || '📏'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{unit.name}</h3>
                    {unit.code && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {unit.code}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(unit)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(unit.id, unit.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
              
              {unit.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {unit.description}
                </p>
              )}

              <div className="text-xs text-muted-foreground pt-3 border-t">
                تم الإنشاء: {new Date(unit.created_at).toLocaleDateString('ar-SA')}
              </div>
            </CardContent>
          </Card>
        ))}

        {units.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📏</div>
                <h3 className="text-lg font-semibold mb-2">لا توجد وحدات</h3>
                <p className="text-muted-foreground mb-4">
                  أضف أول وحدة قياس للاستخدام في المصروفات
                </p>
                <Button onClick={() => setShowForm(true)}>
                  إضافة وحدة جديدة
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* نموذج إضافة وحدة */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة وحدة جديدة</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الوحدة الجديدة
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الوحدة *</Label>
                <Input
                  {...register('name', { required: 'اسم الوحدة مطلوب' })}
                  placeholder="مثال: متر، كيلو، قطعة"
                />
                {errors.name && (
                  <span className="text-sm text-destructive">{errors.name.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">الرمز (اختياري)</Label>
                <Input
                  {...register('code')}
                  placeholder="مثال: M، KG، PCS"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                {...register('description')}
                placeholder="وصف مختصر للوحدة..."
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
                defaultValue="#3b82f6"
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
                placeholder="📏"
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
                className="bg-gradient-to-r from-blue-600 to-blue-700"
              >
                {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ الوحدة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* نموذج تعديل وحدة */}
      <EditUnitForm
        unit={selectedUnit}
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSuccess={() => {
          setShowEditForm(false)
          setSelectedUnit(null)
        }}
      />
    </div>
  )
}
