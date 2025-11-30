# 🚀 النشر السريع على Netlify

## الخطوة 1: بناء المشروع
```powershell
cd web
npm install
npm run build
```

## الخطوة 2: تثبيت Netlify CLI
```powershell
npm install -g netlify-cli
```

## الخطوة 3: تسجيل الدخول
```powershell
netlify login
```

## الخطوة 4: النشر
```powershell
# للنشر النهائي
netlify deploy --prod --dir=dist
```

---

## أو: النشر التلقائي من GitHub

1. ارفع المشروع على GitHub
2. اذهب إلى [app.netlify.com](https://app.netlify.com)
3. اضغط "New site from Git"
4. اختر Repository
5. الإعدادات ستكون جاهزة تلقائياً ✅

**هام:** أضف `VITE_API_URL` في Environment Variables:
```
VITE_API_URL=https://salary.soqiamakkah.com/api
```

---

📖 **للمزيد من التفاصيل:** راجع `NETLIFY_DEPLOY.md`
