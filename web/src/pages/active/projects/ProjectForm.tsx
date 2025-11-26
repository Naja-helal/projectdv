import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectApi, projectTypeApi } from '@/lib/api';
import { Project, CreateProjectData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProjectFormProps {
  project?: Project;
  onSuccess: () => void;
}

export default function ProjectForm({ project, onSuccess }: ProjectFormProps) {
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
  
  const [formData, setFormData] = useState<CreateProjectData>({
    name: project?.name || '',
    code: project?.code || '',
    type: project?.type || 'استراتيجية',
    description: project?.description || '',
    budget: project?.budget || 0,
    expected_spending: project?.expected_spending || 0,
    start_date: project?.start_date || undefined,
    end_date: project?.end_date || undefined,
    status: project?.status || 'active',
    color: project?.color || '#3b82f6',
    project_type_id: project?.project_type_id || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // جلب أنواع المشاريع
  const { data: projectTypes = [] } = useQuery({
    queryKey: ['project-types'],
    queryFn: projectTypeApi.getProjectTypes,
  });

  // إنشاء أو تحديث مشروع
  const mutation = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      if (project) {
        await projectApi.updateProject(project.id, data);
        return { id: project.id, success: true };
      }
      return projectApi.createProject(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('خطأ في حفظ المشروع:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من صحة البيانات
    const newErrors: Record<string, string> = {};
    if (!formData.name) {
      newErrors.name = 'اسم المشروع مطلوب';
    }
    if (!formData.type) {
      newErrors.type = 'نوع المشروع مطلوب';
    }
    if (formData.budget < 0) {
      newErrors.budget = 'الميزانية يجب أن تكون رقماً موجباً';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
  };

  const projectTypesOld = [
    'استراتيجية',
    'تطويرية',
    'تنظيمية',
    'تجريبية',
    'استثمارية',
    'بحثية',
    'خدمية',
    'بنية تحتية',
  ];

  const statusOptions = [
    { value: 'active', label: 'نشط' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'on_hold', label: 'متوقف مؤقتاً' },
    { value: 'cancelled', label: 'ملغي' },
  ];

  const colorOptions = [
    { value: '#3b82f6', label: 'أزرق' },
    { value: '#10b981', label: 'أخضر' },
    { value: '#f59e0b', label: 'برتقالي' },
    { value: '#ef4444', label: 'أحمر' },
    { value: '#8b5cf6', label: 'بنفسجي' },
    { value: '#ec4899', label: 'وردي' },
    { value: '#06b6d4', label: 'سماوي' },
    { value: '#84cc16', label: 'أخضر فاتح' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-1">
      {/* الحقول الأساسية */}
      <div className="space-y-5">
        {/* اسم المشروع */}
        <div className="space-y-3">
          <Label htmlFor="name" className="text-base font-semibold">اسم المشروع *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="أدخل اسم المشروع"
            className={`min-h-[56px] text-base p-4 border-2 rounded-xl ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-sm text-red-600 font-medium">{errors.name}</p>}
        </div>

        {/* رمز المشروع ونوع المشروع */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* رمز المشروع */}
          <div className="space-y-3">
            <Label htmlFor="code" className="text-base font-semibold">رمز المشروع</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="مثال: P001"
              className="min-h-[56px] text-base p-4 border-2 rounded-xl"
            />
          </div>

          {/* نوع المشروع */}
          <div className="space-y-3">
            <Label htmlFor="type" className="text-base font-semibold">نوع المشروع *</Label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className={`w-full p-5 border-2 rounded-xl bg-white text-base min-h-[56px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${errors.type ? 'border-red-500' : ''}`}
            >
              <option value="">اختر نوع المشروع</option>
              {projectTypesOld.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-sm text-red-600 font-medium">{errors.type}</p>}
          </div>
        </div>

        {/* تصنيف المشروع */}
        <div className="space-y-3">
          <Label htmlFor="project_type_id" className="text-base font-semibold">تصنيف المشروع</Label>
          <select
            value={formData.project_type_id || ''}
            onChange={(e) => setFormData({ ...formData, project_type_id: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full p-5 border-2 rounded-xl bg-white text-base min-h-[56px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">اختر التصنيف</option>
            {projectTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.icon} {type.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">يستخدم للإحصائيات والتقارير</p>
        </div>

        {/* قيمة العقد والإنفاق المتوقع */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* قيمة العقد (الميزانية) */}
          <div className="space-y-3">
            <Label htmlFor="budget" className="text-base font-semibold">قيمة العقد (ر.س)</Label>
            <Input
              id="budget"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={formData.budget}
              onChange={(e) => {
                const cleaned = removeLeadingZeros(e.target.value);
                setFormData({ ...formData, budget: parseFloat(cleaned) || 0 });
              }}
              onInput={handleNumericInput}
              onBlur={(e) => {
                e.target.value = removeLeadingZeros(e.target.value);
              }}
              placeholder="0.00"
              className={`min-h-[56px] text-base p-4 border-2 rounded-xl ${errors.budget ? 'border-red-500' : ''}`}
            />
            {errors.budget && <p className="text-sm text-red-600 font-medium">{errors.budget}</p>}
          </div>

          {/* الإنفاق المتوقع */}
          <div className="space-y-3">
            <Label htmlFor="expected_spending" className="text-base font-semibold">الإنفاق المتوقع (ر.س)</Label>
            <Input
              id="expected_spending"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={formData.expected_spending}
              onChange={(e) => {
                const cleaned = removeLeadingZeros(e.target.value);
                setFormData({ ...formData, expected_spending: parseFloat(cleaned) || 0 });
              }}
              onInput={handleNumericInput}
              onBlur={(e) => {
                e.target.value = removeLeadingZeros(e.target.value);
              }}
              placeholder="0.00"
              className="min-h-[56px] text-base p-4 border-2 rounded-xl"
            />
          </div>
        </div>

        {/* الوصف */}
        <div className="space-y-3">
          <Label htmlFor="status" className="text-base font-semibold">الحالة</Label>
          <select
            value={formData.status}
            onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
            className="w-full p-5 border-2 rounded-xl bg-white text-base min-h-[56px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* التواريخ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* تاريخ البداية */}
          <div className="space-y-3">
            <Label htmlFor="start_date" className="text-base font-semibold">تاريخ البداية</Label>
            <Input
              id="start_date"
              type="date"
              value={
                formData.start_date
                  ? new Date(formData.start_date).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  start_date: e.target.value ? new Date(e.target.value).getTime() : undefined,
                })
              }
              className="min-h-[56px] text-base p-4 border-2 rounded-xl"
            />
          </div>

          {/* تاريخ النهاية */}
          <div className="space-y-3">
            <Label htmlFor="end_date" className="text-base font-semibold">تاريخ النهاية</Label>
            <Input
              id="end_date"
              type="date"
              value={
                formData.end_date ? new Date(formData.end_date).toISOString().split('T')[0] : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  end_date: e.target.value ? new Date(e.target.value).getTime() : undefined,
                })
              }
              className="min-h-[56px] text-base p-4 border-2 rounded-xl"
            />
          </div>
        </div>

        {/* اللون */}
        <div className="space-y-3">
          <Label htmlFor="color" className="text-base font-semibold">لون المشروع</Label>
          <div className="flex gap-3 mt-2 flex-wrap">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 ${
                  formData.color === option.value ? 'border-gray-800 scale-110 ring-2 ring-offset-2' : 'border-gray-300'
                }`}
                style={{ backgroundColor: option.value }}
                onClick={() => setFormData({ ...formData, color: option.value })}
                title={option.label}
              />
            ))}
          </div>
        </div>

        {/* الوصف */}
        <div className="space-y-3">
          <Label htmlFor="description" className="text-base font-semibold">الوصف</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="أدخل وصفاً للمشروع (اختياري)"
            rows={4}
            className="text-base resize-none border-2 rounded-xl"
          />
        </div>
      </div>

      {/* أزرار الحفظ والإلغاء */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={mutation.isPending}
          className="flex-1 min-h-[56px] text-base font-semibold rounded-xl"
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 min-h-[56px] text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700"
        >
          {mutation.isPending ? 'جاري الحفظ...' : project ? 'تحديث المشروع' : 'إضافة المشروع'}
        </Button>
      </div>
    </form>
  );
}
