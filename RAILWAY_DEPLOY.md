# 🚂 دليل النشر على Railway.app

## 📋 الخطوات السريعة

### 1️⃣ إنشاء حساب على Railway
1. اذهب إلى: https://railway.app
2. اضغط **"Login with GitHub"**
3. أذن لـ Railway بالوصول لحسابك

---

### 2️⃣ رفع المشروع على GitHub

```powershell
# في المجلد الرئيسي للمشروع
cd "C:\Users\naja2\Desktop\Tkamol2025\saud - Copy (4)"

# تهيئة Git
git init
git add .
git commit -m "Initial commit - Railway deployment"

# إنشاء repository على GitHub ثم:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

### 3️⃣ إنشاء مشروع على Railway

1. في لوحة Railway، اضغط **"New Project"**
2. اختر **"Deploy from GitHub repo"**
3. اختر repository الذي رفعته
4. Railway سيكتشف المشروع تلقائياً

---

### 4️⃣ إعدادات المشروع (مهم!)

#### أ) Root Directory
```
Settings → Service → Root Directory
اكتب: server
```

#### ب) Environment Variables
```
Settings → Variables → Add Variable

PORT = 3001
NODE_ENV = production
DB_PATH = /app/data/expenses.db
```

#### ج) Volume (للحفاظ على قاعدة البيانات)
```
Settings → Volumes → New Volume

Volume Name: expenses-data
Mount Path: /app/data
```

---

### 5️⃣ رفع قاعدة البيانات

بعد أول Deploy، ارفع قاعدة البيانات:

```powershell
# ثبّت Railway CLI
npm install -g @railway/cli

# تسجيل الدخول
railway login

# اربط المشروع
railway link

# ارفع قاعدة البيانات
railway run bash -c "mkdir -p /app/data"
railway run upload server/expenses.db /app/data/expenses.db
```

**أو استخدم SSH:**
```bash
railway ssh
mkdir -p /app/data
# ثم ارفع الملف عبر SFTP
```

---

### 6️⃣ الحصول على رابط API

```
1. اذهب إلى Settings → Networking
2. اضغط "Generate Domain"
3. ستحصل على رابط مثل:
   https://your-project-name.up.railway.app
```

---

### 7️⃣ تحديث الواجهة على Netlify

```powershell
# حدّث متغير البيئة في Netlify:
1. اذهب إلى: https://app.netlify.com/projects/projectdv/settings
2. Environment variables → Edit
3. VITE_API_URL = https://your-project-name.up.railway.app/api
4. احفظ → Redeploy
```

---

## ✅ التحقق من النشر

### اختبر API:
```
https://your-project-name.up.railway.app/api/health
```

يجب أن يرجع:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## 🔄 التحديثات المستقبلية

كل ما عليك فعله:
```powershell
git add .
git commit -m "وصف التحديث"
git push
```

Railway سينشر التحديث تلقائياً! ✨

---

## 📊 المراقبة

في لوحة Railway:
- **Deployments**: تاريخ النشر
- **Metrics**: استخدام الموارد
- **Logs**: سجل الأخطاء والتشغيل

---

## 🆓 الخطة المجانية

Railway يعطيك:
- **5$ شهرياً** مجاناً (≈ 500 ساعة تشغيل)
- كافي تماماً لمشروعك
- بعدها يمكن ربط بطاقة للحصول على 5$ إضافية

---

## 🐛 حل المشاكل

### ❌ Build فشل
**الحل:**
```
راجع Logs في Railway
تأكد من Root Directory = server
تأكد من وجود package.json
```

### ❌ قاعدة البيانات فارغة
**الحل:**
```
تأكد من Volume مربوط
تأكد من DB_PATH صحيح
ارفع expenses.db يدوياً
```

### ❌ CORS Error
**الحل:**
```
تأكد من CORS settings في server/src/index.ts
يجب أن يسمح بـ Netlify domain
```

---

## 🎉 تم بنجاح!

الآن لديك:
- ✅ Frontend على Netlify
- ✅ Backend على Railway
- ✅ قاعدة بيانات دائمة
- ✅ Deploy تلقائي
- ✅ مجاني 100%!
