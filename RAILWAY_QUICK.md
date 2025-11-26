# 🎯 خطوات الرفع السريع على Railway

## ✅ ما تم تجهيزه:
- `railway.json` - إعدادات Railway
- `.env.railway` - متغيرات البيئة
- `RAILWAY_DEPLOY.md` - دليل تفصيلي
- السيرفر جاهز للنشر

---

## 🚀 ابدأ الآن (5 دقائق):

### 1️⃣ سجل دخول Railway
```
https://railway.app
→ Login with GitHub
```

### 2️⃣ ارفع المشروع على GitHub
```powershell
cd "C:\Users\naja2\Desktop\Tkamol2025\saud - Copy (4)"
git init
git add .
git commit -m "Deploy to Railway"
```

**أنشئ repository على GitHub ثم:**
```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 3️⃣ في Railway Dashboard
```
1. New Project → Deploy from GitHub
2. اختر repository الخاص بك
3. Settings → Root Directory: server
4. Settings → Variables:
   PORT = 3001
   NODE_ENV = production
   DB_PATH = /app/data/expenses.db
5. Settings → Volumes:
   Mount Path = /app/data
```

### 4️⃣ احصل على الرابط
```
Settings → Networking → Generate Domain
```

### 5️⃣ حدّث Netlify
```
https://app.netlify.com/projects/projectdv/settings
Environment Variables:
VITE_API_URL = https://your-railway-domain.railway.app/api
```

---

## 📌 ملاحظات مهمة:

- ✅ قاعدة البيانات `expenses.db` موجودة في `server/`
- ✅ CORS مفتوح (يقبل جميع الطلبات)
- ✅ Port ديناميكي (يستخدم `process.env.PORT`)
- ✅ إعدادات production جاهزة

---

**راجع `RAILWAY_DEPLOY.md` للتفاصيل الكاملة!**
