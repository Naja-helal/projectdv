import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link } from "lucide-react";

interface UrlFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// دالة للتحقق من صحة الرابط
function isValidUrl(url: string) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    // إذا لم يحتوي على http/https، أضفه
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      try {
        new URL('https://' + url);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

// دالة لفتح الرابط
function openUrl(url: string) {
  if (!url) return;
  
  let finalUrl = url;
  // إضافة https إذا لم يكن موجود
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    finalUrl = 'https://' + url;
  }
  
  window.open(finalUrl, '_blank');
}

export function UrlField({ 
  value, 
  onChange, 
  placeholder = "أدخل الرابط (مثال: example.com)", 
  disabled = false,
  className = ""
}: UrlFieldProps) {
  const isValid = isValidUrl(value);
  
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="text-base p-4 pl-12 pr-4 border-2 rounded-xl min-h-[48px] focus:border-blue-500"
            dir="ltr"
          />
          <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
        </div>
        
        {value && isValid && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openUrl(value)}
            className="flex items-center gap-2 shrink-0 min-h-[48px] px-4 font-semibold border-2 rounded-xl"
          >
            <ExternalLink className="h-4 w-4" />
            🔗 فتح الرابط
          </Button>
        )}
      </div>
      
      {/* معاينة حالة الرابط */}
      {value && (
        <div className="text-sm font-medium flex items-center gap-2 p-2 rounded-lg bg-gray-50">
          <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
          {isValid ? '✅ رابط صالح' : '❌ رابط غير صالح'}
        </div>
      )}
    </div>
  );
}

// مكون لعرض الرابط فقط (للقراءة)
interface UrlDisplayProps {
  value: string;
  label?: string;
  className?: string;
}

export function UrlDisplay({ value, label, className = "" }: UrlDisplayProps) {
  if (!value) return null;
  
  const isValid = isValidUrl(value);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="text-base font-semibold text-gray-700">{label}</div>
      )}
      <div className="p-4 bg-gray-50 rounded-xl border-2 space-y-3">
        <div className="flex items-start gap-3">
          <Link className="h-5 w-5 text-blue-600 shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-600 mb-1">الرابط:</div>
            <div 
              className="text-sm text-blue-600 font-mono bg-white p-2 rounded border break-all" 
              dir="ltr"
              style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
            >
              {value}
            </div>
          </div>
        </div>
        {isValid && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => openUrl(value)}
            className="w-full min-h-[48px] px-4 text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl"
          >
            <ExternalLink className="h-4 w-4 ml-2" />
            🔗 فتح الرابط
          </Button>
        )}
      </div>
    </div>
  );
}

// للتوافق مع الكود الموجود، نصدر أيضاً بالأسماء القديمة
export { UrlField as LocationField, UrlDisplay as LocationDisplay };
