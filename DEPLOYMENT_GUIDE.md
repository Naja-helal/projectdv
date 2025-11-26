# 🚀 دليل النشر على Netlify

هذا الدليل يشرح خطوات نشر التطبيق على Netlify بشكل كامل.

## 📋 المتطلبات الأساسية

1. حساب على [Netlify](https://netlify.com)
2. حساب على [GitHub](https://github.com) (اختياري لكن موصى به)
3. حساب على منصة استضافة السيرفر (Railway, Render, أو VPS)

---

## 🎯 الخطوة 1: إعداد المشروع

### 1.1 تحديث رابط API

قبل النشر، يجب تحديث رابط API في ملف `.env.production`:

```bash
# في مجلد web/.env.production
VITE_API_URL=https://your-backend-api.com/api
```

⚠️ **مهم**: استبدل `https://your-backend-api.com/api` برابط السيرفر الحقيقي بعد نشره.

---

## 🌐 الخطوة 2: نشر Frontend على Netlify

### الطريقة 1: النشر المباشر (من الكمبيوتر)

#### 2.1 تثبيت Netlify CLI
```bash
npm install -g netlify-cli
```

#### 2.2 تسجيل الدخول
```bash
netlify login
```

#### 2.3 البناء والنشر
```bash
# من المجلد الرئيسي
cd web
npm install
npm run build

# النشر
netlify deploy --prod --dir=dist
```

---

### الطريقة 2: النشر من GitHub (موصى بها)

#### 2.1 رفع المشروع على GitHub

```bash
# في المجلد الرئيسي
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repository.git
git push -u origin main
```

#### 2.2 ربط Netlify بـ GitHub

1. اذهب إلى [Netlify Dashboard](https://app.netlify.com)
2. اضغط على "Add new site" → "Import an existing project"
3. اختر "GitHub" وحدد الريبو
4. ستكتشف Netlify الإعدادات تلقائياً من `netlify.toml`:
   - **Base directory**: `web`
   - **Build command**: `npm run build`
   - **Publish directory**: `web/dist`
5. اضغط "Deploy site"

#### 2.3 إعداد متغيرات البيئة في Netlify

1. اذهب إلى Site settings → Environment variables
2. أضف المتغير:
   - **Key**: `VITE_API_URL`
   - **Value**: رابط السيرفر (مثال: `https://your-api.railway.app/api`)

---

## 🖥️ الخطوة 3: نشر Backend (السيرفر)

لديك عدة خيارات لنشر السيرفر:

### الخيار 1: Railway.app (سهل وسريع)

1. اذهب إلى [Railway.app](https://railway.app)
2. اضغط "New Project" → "Deploy from GitHub repo"
3. اختر المجلد `server`
4. سيتم رفعه تلقائياً
5. احصل على الـ URL من Dashboard

### الخيار 2: Render.com (مجاني)

1. اذهب إلى [Render.com](https://render.com)
2. اضغط "New" → "Web Service"
3. اربط GitHub repo واختر مجلد `server`
4. إعدادات البناء:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. انشر واحصل على URL

### الخيار 3: VPS (للخبراء)

إذا كان لديك VPS، استخدم PM2:

```bash
# على السيرفر
cd server
npm install --production
npm run build
pm2 start dist/index.js --name expense-tracker-api
pm2 save
pm2 startup
```

---

## 🔄 الخطوة 4: ربط Frontend بـ Backend

بعد نشر السيرفر:

1. احصل على رابط API (مثلاً: `https://your-api.railway.app`)
2. حدّث في Netlify:
   - **Environment variables** → `VITE_API_URL` = `https://your-api.railway.app/api`
3. أعد النشر (Redeploy)

---

## ✅ الخطوة 5: اختبار التطبيق

1. افتح رابط Netlify (مثال: `https://yourapp.netlify.app`)
2. تأكد من:
   - ✅ الصفحات تفتح بشكل صحيح
   - ✅ تسجيل الدخول يعمل
   - ✅ البيانات تُحمّل من السيرفر
   - ✅ الإحصائيات تظهر

---

## 🛠️ الأوامر المفيدة

### بناء محلي للاختبار
```bash
# Frontend
cd web
npm run build
npm run preview  # اختبار البناء محلياً

# Backend
cd server
npm run build
npm run start    # تشغيل الإنتاج محلياً
```

### تحديث بعد التعديلات
```bash
git add .
git commit -m "Update features"
git push origin main
# Netlify سيعيد النشر تلقائياً
```

---

## 🔐 الأمان والحماية

### 1. متغيرات البيئة الحساسة
لا ترفع ملفات `.env` على GitHub. استخدم:

```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. CORS في السيرفر
تأكد من إعداد CORS بشكل صحيح في `server/src/index.ts`:

```typescript
app.use(cors({
  origin: ['https://yourapp.netlify.app'],
  credentials: true
}));
```

### 3. قاعدة البيانات
- للإنتاج، استخدم قاعدة بيانات خارجية (PostgreSQL على Railway أو Supabase)
- أو استخدم SQLite مع volume mounting على Railway/Render

---

## 📊 المراقبة والتتبع

### مراقبة Netlify
- Analytics: في Dashboard
- Logs: في Deploys → Deploy log
- Errors: في Functions → Logs (إذا استخدمت)

### مراقبة السيرفر
- Railway: Metrics في Dashboard
- Render: Metrics + Logs
- VPS: استخدم PM2 logs: `pm2 logs expense-tracker-api`

---

## 🐛 حل المشاكل الشائعة

### المشكلة: "API not responding"
**الحل**: تحقق من:
1. رابط API صحيح في Environment variables
2. السيرفر يعمل (افتح `https://your-api.com/api/health`)
3. CORS مفعّل بشكل صحيح

### المشكلة: "404 on page refresh"
**الحل**: تأكد من وجود `netlify.toml` مع redirects

### المشكلة: "Build failed"
**الحل**: تحقق من:
1. نسخة Node.js صحيحة (20)
2. جميع dependencies مثبتة
3. لا توجد أخطاء TypeScript

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Logs في Netlify/Railway
2. راجع [Netlify Docs](https://docs.netlify.com)
3. تحقق من Console في المتصفح (F12)

---

## 🎉 تم بنجاح!

الآن تطبيقك يعمل على الإنتاج! 🚀

- Frontend: `https://yourapp.netlify.app`
- Backend API: `https://your-api.railway.app`

**ملاحظات إضافية:**
- للحصول على نطاق مخصص، اذهب إلى Netlify → Domain settings
- قم بتفعيل HTTPS تلقائياً من Netlify
- راجع Analytics بشكل دوري
