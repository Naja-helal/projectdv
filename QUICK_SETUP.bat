@echo off
chcp 65001 >nul
color 0A
cls

echo ╔════════════════════════════════════════════════════════════╗
echo ║  🚀 تشغيل سريع - Supabase Setup                         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📋 3 خطوات حاسمة في Supabase:
echo.
echo ┌─────────────────────────────────────────────────────────┐
echo │ 1️⃣  إنشاء الجداول (supabase-schema.sql)              │
echo └─────────────────────────────────────────────────────────┘
echo    👉 https://supabase.com/dashboard/project/ekezjmhpdzydiczspfsm/sql/new
echo    📄 انسخ محتوى: supabase-schema.sql
echo.
echo ┌─────────────────────────────────────────────────────────┐
echo │ 2️⃣  تعطيل RLS (supabase-disable-rls.sql) ⚠️ حاسم!   │
echo └─────────────────────────────────────────────────────────┘
echo    👉 نفس الرابط أعلاه
echo    📄 انسخ محتوى: supabase-disable-rls.sql
echo    ⚠️  بدون هذه الخطوة لن يعمل التطبيق!
echo.
echo ┌─────────────────────────────────────────────────────────┐
echo │ 3️⃣  إدخال البيانات (supabase-import-data.sql)        │
echo └─────────────────────────────────────────────────────────┘
echo    👉 نفس الرابط أعلاه
echo    📄 انسخ محتوى: supabase-import-data.sql
echo    ✅ سيضيف 26 سجل (تصنيفات، وحدات، إلخ)
echo.
echo ══════════════════════════════════════════════════════════════
echo.
echo 🧪 اختبار الاتصال:
echo    http://localhost:8888/test-supabase-connection.html
echo.
echo 📖 الدليل الكامل:
echo    http://localhost:8888/SETUP_GUIDE.html
echo.
echo ══════════════════════════════════════════════════════════════
echo.
pause

echo.
echo ⏳ تشغيل خادم الاختبار على http://localhost:8888
echo 📂 افتح المتصفح على الروابط أعلاه
echo.
echo [اضغط Ctrl+C لإيقاف الخادم]
echo.

python -m http.server 8888
