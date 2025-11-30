#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbFile = 'expenses.db';
const dbPath = path.join(__dirname, dbFile);

console.log('📤 رفع قاعدة البيانات المنظفة إلى Railway\n');

// التحقق من وجود الملف
if (!fs.existsSync(dbPath)) {
  console.error('❌ ملف قاعدة البيانات غير موجود:', dbPath);
  process.exit(1);
}

const stats = fs.statSync(dbPath);
console.log(`✅ تم العثور على قاعدة البيانات:`);
console.log(`   📁 الملف: ${dbFile}`);
console.log(`   📦 الحجم: ${(stats.size / 1024).toFixed(2)} KB\n`);

// قراءة قاعدة البيانات كـ base64
console.log('🔄 تحويل قاعدة البيانات إلى base64...');
const dbBuffer = fs.readFileSync(dbPath);
const dbBase64 = dbBuffer.toString('base64');

// إنشاء سكريبت مؤقت لإعادة بناء قاعدة البيانات على Railway
const uploadScript = `
echo "${dbBase64}" | base64 -d > expenses.db
echo "✅ تم رفع قاعدة البيانات بنجاح"
ls -lh expenses.db
`;

const scriptPath = path.join(__dirname, 'railway-upload.sh');
fs.writeFileSync(scriptPath, uploadScript);

console.log('✅ تم إنشاء سكريبت الرفع\n');

console.log('📝 خطوات الرفع:');
console.log('1. افتح Terminal في Railway:');
console.log('   railway shell');
console.log('\n2. نفذ الأوامر التالية:');
console.log(`   cat > expenses.db.b64 << 'EOF'`);
console.log(`   ${dbBase64.substring(0, 100)}...`);
console.log(`   EOF`);
console.log(`   base64 -d expenses.db.b64 > expenses.db`);
console.log(`   rm expenses.db.b64`);
console.log(`   ls -lh expenses.db`);

console.log('\n✅ أو استخدم الطريقة السهلة:');
console.log('   1. railway shell');
console.log('   2. الصق السكريبت من ملف railway-upload.sh\n');

// حفظ base64 في ملف
const base64File = path.join(__dirname, 'expenses.db.b64');
fs.writeFileSync(base64File, dbBase64);
console.log(`💾 تم حفظ: ${path.basename(base64File)}\n`);
