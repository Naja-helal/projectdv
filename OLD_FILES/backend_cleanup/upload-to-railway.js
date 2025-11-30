const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const https = require('https');

// معلومات Railway من ملف .env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN || 'قم بإضافة RAILWAY_TOKEN في ملف .env';
const PROJECT_ID = process.env.RAILWAY_PROJECT_ID || 'قم بإضافة RAILWAY_PROJECT_ID في ملف .env';

const dbPath = path.join(__dirname, 'expenses-to-upload-cleaned.db');

console.log('🚀 رفع قاعدة البيانات إلى Railway...\n');

if (!fs.existsSync(dbPath)) {
  console.error('❌ لم يتم العثور على ملف قاعدة البيانات:', dbPath);
  process.exit(1);
}

console.log('📂 الملف:', path.basename(dbPath));
console.log('📦 الحجم:', (fs.statSync(dbPath).size / 1024).toFixed(2), 'KB\n');

// هنا يمكنك إضافة كود رفع الملف إلى Railway
// أو استخدام Railway CLI مباشرة

console.log('📝 طريقة الرفع اليدوي:');
console.log('\n1️⃣ باستخدام Railway CLI:');
console.log('   railway link');
console.log('   railway up');
console.log('\n2️⃣ باستخدام SSH إلى السيرفر:');
console.log('   railway connect');
console.log('   # ثم ارفع الملف يدوياً');
console.log('\n3️⃣ باستخدام Volume في Railway:');
console.log('   - أنشئ Volume جديد');
console.log('   - ارفع قاعدة البيانات إليه');
console.log('   - اربط Volume بالسيرفر');

console.log('\n✅ أسهل طريقة: استخدم Railway Dashboard لرفع الملف مباشرة');
console.log('   https://railway.app/dashboard\n');
