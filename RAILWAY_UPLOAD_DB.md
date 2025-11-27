# رفع قاعدة البيانات إلى Railway

## الطريقة الأسهل: استخدام Railway CLI

### 1. تثبيت Railway CLI
```powershell
npm i -g @railway/cli
```

### 2. تسجيل الدخول
```powershell
railway login
```

### 3. ربط المشروع
```powershell
cd server
railway link
```

### 4. رفع قاعدة البيانات
```powershell
# نسخ قاعدة البيانات المحلية إلى Railway
railway run cp ../server/expenses.db /app/expenses.db
```

## أو: رفع ملف مباشر

### استخدم هذا الأمر لرفع قاعدة البيانات:
```powershell
railway up expenses.db
```

## البديل: استخدام Volume في Railway

1. اذهب إلى Railway Dashboard
2. افتح مشروعك
3. اذهب إلى Settings > Volumes
4. أضف Volume جديد: `/app/data`
5. ارفع ملف `expenses-to-upload.db` إلى Volume
6. غير `DB_PATH` في Variables إلى: `/app/data/expenses.db`

## التحقق من النجاح

بعد الرفع، تحقق من قاعدة البيانات في Railway:
```powershell
railway run node -e "const db = require('better-sqlite3')('./expenses.db'); console.log(db.prepare('SELECT COUNT(*) FROM expenses').get());"
```
