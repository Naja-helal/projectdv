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
  
  // دالة محسّنة لإزالة الأصفار البادئة - تعمل على الويب والموبايل
  const removeLeadingZeros = (value: string): string => {
    if (!value || value === '' || value === '0' || value === '0.') return value;
    const cleaned = value.replace(/^0+(?=\d)/, '');
    return cleaned || '0';
  };

  // دالة للتعامل مع الإدخال الفوري على الموبايل
  const handleNumericInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    const newValue = removeLeadingZeros(oldValue);
    
    if (newValue !== oldValue) {
      input.value = newValue;
      if (cursorPosition !== null) {
        const diff = oldValue.length - newValue.length;
        input.setSelectionRange(cursorPosition - diff, cursorPosition - diff);
      }
    }
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
      {/* اسم العنصر */}
      <div>
        <Label htmlFor="name">اسم العنصر *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="أدخل اسم العنصر"
          className={`min-h-[56px] text-base p-4 ${errors.name ? 'border-red-500' : ''}`}
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
          className="min-h-[100px] text-base p-4"
        />
      </div>

      {/* الميزانية */}
      <div>
        <Label htmlFor="budget">الميزانية (ر.س)</Label>
        <Input
          id="budget"
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          value={formData.budget || 0}
          onChange={(e) => {
            const cleaned = removeLeadingZeros(e.target.value);
            setFormData({ ...formData, budget: parseFloat(cleaned) || 0 });
          }}
          onInput={handleNumericInput}
          onBlur={(e) => {
            e.target.value = removeLeadingZeros(e.target.value);
          }}
          placeholder="0.00"
          className={`min-h-[56px] text-base p-4 ${errors.budget ? 'border-red-500' : ''}`}
        />
        {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
      </div>

      {/* ترتيب العرض */}
      <div>
        <Label htmlFor="sort_order">ترتيب العرض</Label>
        <Input
          id="sort_order"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formData.sort_order || 0}
          onChange={(e) => {
            const cleaned = removeLeadingZeros(e.target.value);
            setFormData({ ...formData, sort_order: parseInt(cleaned) || 0 });
          }}
          onInput={handleNumericInput}
          onBlur={(e) => {
            e.target.value = removeLeadingZeros(e.target.value);
          }}
          placeholder="0"
          className="min-h-[56px] text-base p-4"
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
