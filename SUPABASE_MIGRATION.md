# 🚀 Supabase Migration Guide

## ✅ تم إكمال التحويل:

### 1. **الإعداد**
- ✅ تم تثبيت `@supabase/supabase-js`
- ✅ تم إنشاء `web/src/lib/supabase.ts`
- ✅ تم إنشاء `web/src/lib/supabaseApi.ts`
- ✅ تم تحديث `netlify.toml`

### 2. **APIs المحولة**
- ✅ Categories API
- ✅ Expenses API
- ✅ Projects API
- ✅ Project Items API
- ✅ Units API
- ✅ Payment Methods API
- ✅ Clients API

### 3. **ما تبقى**

#### **استيراد البيانات إلى Supabase:**

1. **افتح Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/ekezjmhpdzydiczspfsm/editor
   ```

2. **استيراد من `database-export.json`:**
   
   افتح Table Editor لكل جدول وأدخل البيانات يدوياً، أو استخدم SQL:

   ```sql
   -- Categories (8 rows)
   INSERT INTO categories (name, description, color) VALUES
   ('Category 1', 'Description', '#3B82F6'),
   ...

   -- Units (10 rows)
   INSERT INTO units (name, symbol) VALUES
   ('متر', 'م'),
   ...

   -- Payment Methods (6 rows)
   INSERT INTO payment_methods (name, description, active) VALUES
   ('نقدي', 'دفع نقدي', true),
   ...
   ```

#### **تحويل الصفحات:**

استبدل استيراد API في الملفات التالية:

**قبل:**
```typescript
import { api } from '@/lib/api'
const categories = await api.categories.getAll()
```

**بعد:**
```typescript
import { categoriesApi } from '@/lib/supabaseApi'
const categories = await categoriesApi.getAll()
```

**الملفات المطلوب تحديثها:**
- `web/src/pages/CategoriesNew.tsx`
- `web/src/pages/Expenses.tsx`
- `web/src/pages/ProjectItems.tsx`
- `web/src/pages/Dashboard.tsx`
- `web/src/pages/Units.tsx`
- `web/src/pages/PaymentMethods.tsx`

---

## 🧪 **الاختبار المحلي:**

```bash
cd web
npm run dev
```

**افتح:** http://localhost:5173

---

## 🚀 **النشر على Netlify:**

### **الطريقة 1: عبر Git**
```bash
git add .
git commit -m "تحويل إلى Supabase"
git push origin main
```

Netlify سيبني ويرفع تلقائياً!

### **الطريقة 2: Netlify CLI**
```bash
npm install -g netlify-cli
cd web
npm run build
netlify deploy --prod
```

---

## 📊 **التحقق من النشر:**

1. افتح: https://projectdv.netlify.app
2. تحقق من تحميل البيانات
3. جرب إضافة/تعديل/حذف

---

## 🔑 **المتغيرات البيئية في Netlify:**

إذا لم تعمل، تحقق من:
- Site Settings → Environment Variables
- أضف:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

---

## ✅ **المميزات:**
- ❌ **حذف Railway** - لا حاجة له بعد الآن!
- ✅ **كل شي في Netlify** - Frontend فقط
- ✅ **قاعدة بيانات Supabase** - PostgreSQL قوي ومجاني
- ✅ **No Backend Server** - Serverless بالكامل

---

## 📝 **ملاحظات:**
- قاعدة البيانات المحلية `server/production.db` احتفظ بها كـ backup
- Backend Express في `server/` لم يعد يستخدم
- يمكن حذف مجلد `server/` بالكامل بعد التأكد
