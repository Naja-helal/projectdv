import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/lib/api';
import { ProjectItem, CreateProjectItemData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProjectItemFormProps {
  projectId: number;
  item?: ProjectItem;
  onSuccess: () => void;
}

export default function ProjectItemForm({ projectId, item, onSuccess }: ProjectItemFormProps) {
  const queryClient = useQueryClient();
  
  // دالة لإزالة الأصفار البادئة من الأرقام
  const removeLeadingZeros = (value: string): string => {
    if (!value || value === '' || value === '0' || value === '0.') return value;
    const cleaned = value.replace(/^0+(?=\d)/, '');
    return cleaned || '0';
  };
  
  const [formData, setFormData] = useState<CreateProjectItemData>({
    project_id: projectId,
    name: item?.name || '',
    description: item?.description || '',
    budget: item?.budget || 0,
    sort_order: item?.sort_order || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // إنشاء أو تحديث عنصر
  const mutation = useMutation({
    mutationFn: async (data: CreateProjectItemData) => {
      if (item) {
        await projectApi.updateProjectItem(item.id, data);
        return { id: item.id, success: true };
      }
      return projectApi.createProjectItem(projectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('خطأ في حفظ العنصر:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من صحة البيانات
    const newErrors: Record<string, string> = {};
    if (!formData.name) {
      newErrors.name = 'اسم العنصر مطلوب';
    }
    if (formData.budget !== undefined && formData.budget < 0) {
      newErrors.budget = 'الميزانية يجب أن تكون رقماً موجباً';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      
      {/* اسم العنصر */}
      <div>
        <Label htmlFor="name">اسم العنصر *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="أدخل اسم العنصر"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* الوصف */}
      <div>
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="أدخل وصفاً للعنصر (اختياري)"
          rows={3}
        />
      </div>

      {/* الميزانية */}
      <div>
        <Label htmlFor="budget">الميزانية (ر.س)</Label>
        <Input
          id="budget"
          type="text"
          inputMode="decimal"
          min="0"
          value={formData.budget || 0}
          onChange={(e) => {
            // السماح فقط بالأرقام والنقطة العشرية
            const cleaned = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            const value = cleaned === '' ? 0 : parseFloat(cleaned) || 0;
            setFormData({ ...formData, budget: value });
          }}
          onBlur={(e) => {
            const cleaned = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            e.target.value = cleaned;
          }}
          placeholder="0.00"
          className={errors.budget ? 'border-red-500' : ''}
        />
        {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
      </div>

      {/* ترتيب العرض */}
      <div>
        <Label htmlFor="sort_order">ترتيب العرض</Label>
        <Input
          id="sort_order"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min="0"
          value={formData.sort_order || 0}
          onChange={(e) => {
            const cleaned = removeLeadingZeros(e.target.value);
            setFormData({ ...formData, sort_order: parseInt(cleaned) || 0 });
          }}
          onBlur={(e) => {
            e.target.value = removeLeadingZeros(e.target.value);
          }}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">الأرقام الأصغر تظهر أولاً</p>
      </div>

      {/* أزرار الحفظ والإلغاء */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={mutation.isPending}>
          إلغاء
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'جاري الحفظ...' : item ? 'تحديث' : 'إضافة'}
        </Button>
      </div>
    </form>
  );
}
