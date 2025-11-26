import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UrlField, UrlDisplay } from '@/components/LocationField';
import { getApiUrl } from '@/lib/api';

interface DynamicField {
  id: number;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'calculated' | 'url' | 'phone';
  page_type: string;
  options?: string[];
  is_required: boolean;
  display_order: number;
  default_value?: string;
}

interface DynamicFieldsRendererProps {
  pageType: string;
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  errors?: Record<string, string>;
  className?: string;
}

export function DynamicFieldsRenderer({ 
  pageType, 
  values, 
  onChange, 
  errors = {}, 
  className = "" 
}: DynamicFieldsRendererProps) {
  // جلب الحقول الديناميكية للصفحة المحددة
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['dynamic-fields', pageType],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/dynamic-fields/${pageType}`));
      if (!response.ok) {
        throw new Error('فشل في جلب الحقول');
      }
      return await response.json() as DynamicField[];
    }
  });

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!fields.length) {
    return null;
  }

  // ترتيب الحقول حسب display_order
  const sortedFields = [...fields].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className={`space-y-6 ${className}`}>
      <h4 className="font-bold text-lg text-gray-700 flex items-center gap-2">
        ⚙️ حقول إضافية
      </h4>
      <div className="grid grid-cols-1 gap-6">
        {sortedFields.map((field) => (
          <DynamicFieldInput
            key={field.id}
            field={field}
            value={values[field.name] || field.default_value || ''}
            onChange={(value) => onChange(field.name, value)}
            error={errors[field.name]}
          />
        ))}
      </div>
    </div>
  );
}

// مكون لحقل واحد
interface DynamicFieldInputProps {
  field: DynamicField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

function DynamicFieldInput({ field, value, onChange, error }: DynamicFieldInputProps) {
  // دالة لإزالة الأصفار البادئة من الأرقام
  const removeLeadingZeros = (value: string): string => {
    if (!value || value === '' || value === '0' || value === '0.') return value;
    const cleaned = value.replace(/^0+(?=\d)/, '');
    return cleaned || '0';
  };
  
  const renderInput = () => {
    switch (field.type) {
      case 'url':
        return (
          <UrlField
            value={value || ''}
            onChange={onChange}
            placeholder={`أدخل ${field.label}`}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`أدخل ${field.label} (مثل: 0501234567)`}
            required={field.is_required}
            className={`text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500 ${error ? 'border-red-500' : ''}`}
            inputMode="tel"
            dir="ltr"
          />
        );

      case 'select':
        if (!field.options || field.options.length === 0) {
          return (
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`أدخل ${field.label}`}
              required={field.is_required}
              className={error ? 'border-destructive' : ''}
            />
          );
        }
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full text-base p-4 border-2 rounded-xl min-h-[48px] bg-background focus:border-blue-500 ${error ? 'border-red-500' : ''}`}
            required={field.is_required}
          >
            <option value="">اختر {field.label}...</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            className={`text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500 ${error ? 'border-red-500' : ''}`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => {
              const cleaned = removeLeadingZeros(e.target.value);
              onChange(cleaned);
            }}
            onBlur={(e) => {
              e.target.value = removeLeadingZeros(e.target.value);
            }}
            placeholder={`أدخل ${field.label}`}
            required={field.is_required}
            className={`text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500 ${error ? 'border-red-500' : ''}`}
            inputMode="decimal"
          />
        );

      case 'text':
      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`أدخل ${field.label}`}
            required={field.is_required}
            className={`text-base p-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500 ${error ? 'border-red-500' : ''}`}
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={field.name} className="text-base font-semibold flex items-center gap-2">
        ⚡ {field.label}
        {field.is_required && <span className="text-red-600 text-lg">*</span>}
      </Label>
      {renderInput()}
      {error && (
        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
          ❌ {error}
        </p>
      )}
    </div>
  );
}

// مكون لعرض البيانات فقط (للقراءة)
interface DynamicFieldsDisplayProps {
  pageType: string;
  values: Record<string, any>;
  className?: string;
}

export function DynamicFieldsDisplay({ pageType, values, className = "" }: DynamicFieldsDisplayProps) {
  const { data: fields = [] } = useQuery({
    queryKey: ['dynamic-fields', pageType],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/dynamic-fields/${pageType}`));
      if (!response.ok) throw new Error('فشل في جلب الحقول');
      return await response.json() as DynamicField[];
    }
  });

  const fieldsWithValues = fields.filter(field => values[field.name]);
  
  if (!fieldsWithValues.length) return null;

  return (
    <div className={`space-y-5 ${className}`}>
      <h4 className="font-bold text-lg text-gray-700 flex items-center gap-2">
        📋 معلومات إضافية
      </h4>
      <div className="grid grid-cols-1 gap-4">
        {fieldsWithValues.map((field) => (
          <div key={field.id} className="p-4 bg-gray-50 rounded-xl border-2">
            <DynamicFieldDisplay
              field={field}
              value={values[field.name]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// مكون لعرض حقل واحد
interface DynamicFieldDisplayItemProps {
  field: DynamicField;
  value: any;
}

function DynamicFieldDisplay({ field, value }: DynamicFieldDisplayItemProps) {
  if (!value) return null;

  // دالة للتحقق إذا كان النص يبدو كرقم هاتف
  const isPhoneNumber = (text: string): boolean => {
    const phoneRegex = /^(\+966|966|05)\d{8,9}$|^\d{9,10}$/;
    return phoneRegex.test(text.replace(/\s|-/g, ''));
  };

  // دالة لتحويل رقم الهاتف إلى رابط واتساب
  const formatWhatsAppLink = (phoneNumber: string): string => {
    let cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '966' + cleanNumber.substring(1);
    } else if (!cleanNumber.startsWith('966')) {
      cleanNumber = '966' + cleanNumber;
    }
    
    return `https://wa.me/${cleanNumber}`;
  };

  const renderValue = () => {
    switch (field.type) {
      case 'url':
        return (
          <UrlDisplay 
            value={value} 
            label={field.label}
          />
        );

      case 'phone':
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">{field.label}</div>
            <a
              href={formatWhatsAppLink(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 hover:underline transition-colors text-sm font-medium flex items-center gap-1"
              title={`فتح واتساب مع ${value}`}
            >
              📱 {value}
            </a>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">{field.label}</div>
            <div className="text-sm">{new Date(value).toLocaleDateString('ar')}</div>
          </div>
        );

      default:
        // إذا كان النص يبدو كرقم هاتف، اعرضه كرابط واتساب
        if (typeof value === 'string' && isPhoneNumber(value)) {
          return (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">{field.label}</div>
              <a
                href={formatWhatsAppLink(value)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 hover:underline transition-colors text-sm font-medium"
                title={`فتح واتساب مع ${value}`}
              >
                {value}
              </a>
            </div>
          );
        }
        
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">{field.label}</div>
            <div className="text-sm">{value}</div>
          </div>
        );
    }
  };

  return renderValue();
}
