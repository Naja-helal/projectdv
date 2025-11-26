# ملف بناء سريع وتشغيل للمشروع كامل
# 🚀 Build and Run Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "     🚀 بناء وتشغيل المشروع الكامل" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. تثبيت Dependencies
Write-Host "📦 الخطوة 1: تثبيت Dependencies..." -ForegroundColor Yellow
Write-Host ""

# Root
Write-Host "تثبيت dependencies الرئيسية..." -ForegroundColor Gray
npm install

# Server
Write-Host "تثبيت dependencies السيرفر..." -ForegroundColor Gray
cd server
npm install
cd ..

# Web
Write-Host "تثبيت dependencies الواجهة..." -ForegroundColor Gray
cd web
npm install
cd ..

Write-Host ""
Write-Host "✅ تم تثبيت جميع Dependencies بنجاح!" -ForegroundColor Green
Write-Host ""

# 2. بناء المشروع
Write-Host "🔨 الخطوة 2: بناء المشروع..." -ForegroundColor Yellow
Write-Host ""

# Build Server
Write-Host "بناء السيرفر..." -ForegroundColor Gray
cd server
npm run build
cd ..

# Build Web
Write-Host "بناء الواجهة..." -ForegroundColor Gray
cd web
npm run build
cd ..

Write-Host ""
Write-Host "✅ تم بناء المشروع بنجاح!" -ForegroundColor Green
Write-Host ""

# 3. تشغيل
Write-Host "🚀 الخطوة 3: تشغيل المشروع..." -ForegroundColor Yellow
Write-Host ""
Write-Host "السيرفر سيعمل على: http://localhost:3001" -ForegroundColor Cyan
Write-Host "الواجهة ستعمل على: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "اضغط Ctrl+C لإيقاف التشغيل" -ForegroundColor Red
Write-Host ""

# تشغيل كلاهما
npm run start
