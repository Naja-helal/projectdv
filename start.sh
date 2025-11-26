#!/bin/bash
# ملف بناء سريع وتشغيل للمشروع كامل
# 🚀 Build and Run Script

echo "================================================"
echo "     🚀 بناء وتشغيل المشروع الكامل"
echo "================================================"
echo ""

# 1. تثبيت Dependencies
echo "📦 الخطوة 1: تثبيت Dependencies..."
echo ""

# Root
echo "تثبيت dependencies الرئيسية..."
npm install

# Server
echo "تثبيت dependencies السيرفر..."
cd server
npm install
cd ..

# Web
echo "تثبيت dependencies الواجهة..."
cd web
npm install
cd ..

echo ""
echo "✅ تم تثبيت جميع Dependencies بنجاح!"
echo ""

# 2. بناء المشروع
echo "🔨 الخطوة 2: بناء المشروع..."
echo ""

# Build Server
echo "بناء السيرفر..."
cd server
npm run build
cd ..

# Build Web
echo "بناء الواجهة..."
cd web
npm run build
cd ..

echo ""
echo "✅ تم بناء المشروع بنجاح!"
echo ""

# 3. تشغيل
echo "🚀 الخطوة 3: تشغيل المشروع..."
echo ""
echo "السيرفر سيعمل على: http://localhost:3001"
echo "الواجهة ستعمل على: http://localhost:3000"
echo ""
echo "اضغط Ctrl+C لإيقاف التشغيل"
echo ""

# تشغيل كلاهما
npm run start
