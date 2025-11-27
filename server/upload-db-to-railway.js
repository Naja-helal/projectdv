const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// قراءة قاعدة البيانات المحلية
const localDbPath = path.join(__dirname, 'expenses.db');

if (!fs.existsSync(localDbPath)) {
  console.error('❌ قاعدة البيانات المحلية غير موجودة:', localDbPath);
  process.exit(1);
}

// نسخ قاعدة البيانات إلى مجلد التصدير
const exportPath = path.join(__dirname, 'expenses-to-upload.db');
fs.copyFileSync(localDbPath, exportPath);

console.log('✅ تم تجهيز قاعدة البيانات للرفع في:', exportPath);
console.log('\n📋 الخطوات التالية:');
console.log('1. اذهب إلى Railway Dashboard: https://railway.app');
console.log('2. افتح مشروعك');
console.log('3. اذهب إلى Data > Connect to Database');
console.log('4. استخدم أداة مثل TablePlus أو DBeaver للاتصال بقاعدة بيانات Railway');
console.log('5. استورد الملف: expenses-to-upload.db');
console.log('\nأو استخدم Railway CLI:');
console.log('railway run node server/restore-db-from-file.js');
