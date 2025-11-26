const fs = require('fs');
const path = require('path');

// قراءة قاعدة البيانات المحلية
const localDbPath = path.join(__dirname, 'expenses.db');
const productionDbPath = process.env.DB_PATH || '/app/data/expenses.db';

console.log('📂 قراءة قاعدة البيانات المحلية...');
const dbData = fs.readFileSync(localDbPath);
console.log(`✅ تم قراءة ${dbData.length} بايت`);

// إنشاء المجلد إذا لم يكن موجوداً
const dbDir = path.dirname(productionDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✅ تم إنشاء المجلد: ${dbDir}`);
}

// نسخ قاعدة البيانات
console.log(`📝 نسخ قاعدة البيانات إلى: ${productionDbPath}`);
fs.writeFileSync(productionDbPath, dbData);
console.log('✅ تم رفع قاعدة البيانات بنجاح!');
