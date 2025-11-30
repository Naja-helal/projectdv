import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/supabaseApi';
import { Client, CreateClientData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditClientFormProps {
  client: Client;
  onSuccess: () => void;
}

export default function EditClientForm({ client, onSuccess }: EditClientFormProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateClientData>({
    name: client.name,
    code: client.code || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    contact_person: client.contact_person || '',
    tax_number: client.tax_number || '',
    notes: client.notes || '',
    color: client.color || '#3b82f6',
    icon: client.icon || '👤',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // تحديث عميل
  const mutation = useMutation({
    mutationFn: (data: Partial<CreateClientData>) => clientsApi.update(client.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث العميل:', error);
      if (error.message?.includes('UNIQUE') || error.message?.includes('موجود')) {
        setErrors({ code: 'رمز العميل موجود مسبقاً' });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من صحة البيانات
    const newErrors: Record<string, string> = {};
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'اسم العميل مطلوب';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
  };

  const iconOptions = [
    '👤', '🏢', '🏭', '🏪', '🏛️', '🏦', '🏨', '🏗️',
    '👨‍💼', '👩‍💼', '👔', '💼', '🎯', '⭐', '🌟', '✨'
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
    { value: '#f97316', label: 'برتقالي داكن' },
    { value: '#14b8a6', label: 'تركوازي' },
    { value: '#6366f1', label: 'نيلي' },
    { value: '#64748b', label: 'رمادي' },
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
      
      {/* المعلومات الأساسية */}
      <div className="space-y-5">
        {/* اسم العميل */}
        <div className="space-y-3">
          <Label htmlFor="name" className="text-base font-semibold">
            اسم العميل *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="أدخل اسم العميل"
            className={`min-h-[48px] text-base border-2 rounded-xl ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-sm text-red-600 font-medium">{errors.name}</p>}
        </div>

        {/* رمز العميل */}
        <div className="space-y-3">
          <Label htmlFor="code" className="text-base font-semibold">
            رمز العميل
          </Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="مثال: CLT-001"
            className={`min-h-[48px] text-base border-2 rounded-xl ${errors.code ? 'border-red-500' : ''}`}
          />
          {errors.code && <p className="text-sm text-red-600 font-medium">{errors.code}</p>}
          <p className="text-xs text-gray-500">رمز فريد للعميل (اختياري)</p>
        </div>

        {/* معلومات الاتصال */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* رقم الهاتف */}
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-base font-semibold">
              رقم الهاتف
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="05xxxxxxxx"
              className="min-h-[48px] text-base border-2 rounded-xl"
              dir="ltr"
            />
          </div>

          {/* البريد الإلكتروني */}
          <div className="space-y-3">
            <Label htmlFor="email" className="text-base font-semibold">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="client@example.com"
              className="min-h-[48px] text-base border-2 rounded-xl"
              dir="ltr"
            />
          </div>
        </div>

        {/* العنوان */}
        <div className="space-y-3">
          <Label htmlFor="address" className="text-base font-semibold">
            العنوان
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="أدخل عنوان العميل"
            className="min-h-[48px] text-base border-2 rounded-xl"
          />
        </div>

        {/* اسم جهة الاتصال */}
        <div className="space-y-3">
          <Label htmlFor="contact_person" className="text-base font-semibold">
            اسم جهة الاتصال
          </Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="اسم الشخص المسؤول عن التواصل"
            className="min-h-[48px] text-base border-2 rounded-xl"
          />
        </div>

        {/* الرقم الضريبي */}
        <div className="space-y-3">
          <Label htmlFor="tax_number" className="text-base font-semibold">
            الرقم الضريبي
          </Label>
          <Input
            id="tax_number"
            value={formData.tax_number}
            onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
            placeholder="أدخل الرقم الضريبي للعميل"
            className="min-h-[48px] text-base border-2 rounded-xl"
            dir="ltr"
          />
        </div>

        {/* ملاحظات */}
        <div className="space-y-3">
          <Label htmlFor="notes" className="text-base font-semibold">
            ملاحظات
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="أضف ملاحظات عن العميل..."
            className="min-h-[100px] text-base border-2 rounded-xl resize-none"
            rows={4}
          />
        </div>

        {/* الأيقونة واللون */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* اختيار الأيقونة */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">الأيقونة</Label>
            <div className="grid grid-cols-8 gap-2 p-3 border-2 rounded-xl bg-gray-50">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-2xl p-2 rounded-lg transition-all hover:scale-110 ${
                    formData.icon === icon
                      ? 'bg-blue-500 ring-2 ring-blue-300 shadow-lg'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* اختيار اللون */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">اللون</Label>
            <div className="grid grid-cols-4 gap-2 p-3 border-2 rounded-xl bg-gray-50">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: option.value })}
                  className={`h-12 rounded-lg transition-all hover:scale-105 ${
                    formData.color === option.value
                      ? 'ring-4 ring-offset-2 ring-blue-400 shadow-lg'
                      : 'hover:ring-2 ring-gray-300'
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* معاينة */}
        <div className="p-4 border-2 rounded-xl bg-gray-50">
          <Label className="text-base font-semibold mb-3 block">معاينة البطاقة</Label>
          <div 
            className="p-4 bg-white rounded-lg shadow-sm border-r-4 flex items-center gap-3"
            style={{ borderRightColor: formData.color }}
          >
            <span className="text-3xl">{formData.icon}</span>
            <div>
              <p className="font-bold text-lg">{formData.name || 'اسم العميل'}</p>
              {formData.code && <p className="text-sm text-gray-500">{formData.code}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2">
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 py-6 text-lg font-bold rounded-xl min-h-[56px]"
        >
          {mutation.isPending ? '⏳ جاري الحفظ...' : '✅ حفظ التعديلات'}
        </Button>
      </div>
    </form>
  );
}
