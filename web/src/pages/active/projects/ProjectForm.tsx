import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, projectItemsApi, clientsApi } from '@/lib/supabaseApi';
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
  
  const [formData, setFormData] = useState<CreateProjectData>({
    name: project?.name || '',
    code: project?.code || '',
    project_item_id: project?.project_item_id || undefined,
    client_id: project?.client_id || 1,
    description: project?.description || '',
    budget: project?.budget || 0,
    start_date: project?.start_date || undefined,
    end_date: project?.end_date || undefined,
    status: project?.status || 'active',
    color: project?.color || '#3b82f6',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // جلب تصنيفات المشاريع
  const { data: projectItems = [] } = useQuery({
    queryKey: ['project-items'],
    queryFn: projectItemsApi.getAll,
  });

  // جلب العملاء
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
  });

  // إنشاء أو تحديث مشروع
  const mutation = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      if (project) {
        await projectsApi.update(project.id, data);
        return { id: project.id, success: true };
      }
      return projectsApi.create(data);
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
    if (formData.budget < 0) {
      newErrors.budget = 'الميزانية يجب أن تكون رقماً موجباً';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
  };

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
      
      {/* الحقول الأساسية */}
      <div className="space-y-5">
        {/* العميل */}
        <div className="space-y-3">
          <Label htmlFor="client_id" className="text-base font-semibold">العميل *</Label>
          <select
            value={formData.client_id || 1}
            onChange={(e) => setFormData({ ...formData, client_id: Number(e.target.value) })}
            className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            {clients.map((client: any) => {
              const iconStr = typeof client.icon === 'object' && client.icon !== null 
                ? (client.icon.symbol || client.icon.name || '') 
                : (client.icon || '');
              return (
                <option key={client.id} value={client.id}>
                  {iconStr ? `${iconStr} ` : ''}{client.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* اسم المشروع */}
        <div className="space-y-3">
          <Label htmlFor="name" className="text-base font-semibold">اسم المشروع *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="أدخل اسم المشروع"
            className={`min-h-[48px] text-base border-2 rounded-xl ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-sm text-red-600 font-medium">{errors.name}</p>}
        </div>

        {/* رمز المشروع وتصنيف المشروع */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* رمز المشروع */}
          <div className="space-y-3">
            <Label htmlFor="code" className="text-base font-semibold">رمز المشروع</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="مثال: P001"
              className="min-h-[48px] text-base border-2 rounded-xl"
            />
          </div>

          {/* تصنيف المشروع */}
          <div className="space-y-3">
            <Label htmlFor="project_item_id" className="text-base font-semibold">تصنيف المشروع (اختياري)</Label>
            <select
              value={formData.project_item_id || ''}
              onChange={(e) => setFormData({ ...formData, project_item_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">اختر تصنيف المشروع</option>
              {projectItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.icon} {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* قيمة العقد */}
        <div className="space-y-3">
          <Label htmlFor="budget" className="text-base font-semibold">قيمة العقد (ر.س)</Label>
          <Input
            id="budget"
            type="text"
            inputMode="decimal"
            min="0"
            value={formData.budget}
            onChange={(e) => {
              // السماح فقط بالأرقام والنقطة العشرية
              const cleaned = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
              setFormData({ ...formData, budget: cleaned === '' ? 0 : cleaned as any });
            }}
            onBlur={(e) => {
              // عند فقدان التركيز، تحويل القيمة لرقم
              const val = parseFloat(e.target.value) || 0;
              setFormData({ ...formData, budget: val });
            }}
            placeholder="0.00"
            className={`min-h-[48px] text-base border-2 rounded-xl ${errors.budget ? 'border-red-500' : ''}`}
          />
          {errors.budget && <p className="text-sm text-red-600 font-medium">{errors.budget}</p>}
        </div>

        {/* الحالة */}
        <div className="space-y-3">
          <Label htmlFor="status" className="text-base font-semibold">الحالة</Label>
          <select
            value={formData.status}
            onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
            className="w-full p-4 border-2 rounded-xl bg-white text-base min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                  ? typeof formData.start_date === 'number' 
                    ? new Date(formData.start_date).toISOString().split('T')[0]
                    : formData.start_date.split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  start_date: e.target.value || undefined,
                })
              }
              className="min-h-[48px] text-base border-2 rounded-xl"
            />
          </div>

          {/* تاريخ النهاية */}
          <div className="space-y-3">
            <Label htmlFor="end_date" className="text-base font-semibold">تاريخ النهاية</Label>
            <Input
              id="end_date"
              type="date"
              value={
                formData.end_date 
                  ? typeof formData.end_date === 'number'
                    ? new Date(formData.end_date).toISOString().split('T')[0]
                    : formData.end_date.split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  end_date: e.target.value || undefined,
                })
              }
              className="min-h-[48px] text-base border-2 rounded-xl"
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
          className="flex-1 min-h-[48px] text-base font-semibold rounded-xl"
        >
          إلغاء
        </Button>
        <Button 
          type="submit" 
          disabled={mutation.isPending} 
          className="flex-1 min-h-[48px] text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700"
        >
          {mutation.isPending ? 'جاري الحفظ...' : project ? 'تحديث المشروع' : 'إضافة المشروع'}
        </Button>
      </div>
    </form>
  );
}
