const fs = require('fs');
const path = require('path');

console.log('📤 رفع قاعدة البيانات إلى Railway Volume...');

const sourceDb = path.join(__dirname, 'expenses.db');
const targetDb = '/app/data/expenses.db';

try {
  // قراءة قاعدة البيانات المحلية
  console.log('📖 قراءة قاعدة البيانات المحلية:', sourceDb);
  const data = fs.readFileSync(sourceDb);
  console.log(`✅ تم قراءة ${data.length} بايت`);
  
  // إنشاء المجلد إذا لم يكن موجوداً
  const targetDir = path.dirname(targetDb);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('✅ تم إنشاء المجلد:', targetDir);
  }
  
  // كتابة قاعدة البيانات في Volume
  console.log('✍️ كتابة قاعدة البيانات في:', targetDb);
  fs.writeFileSync(targetDb, data);
  
  // التحقق من الحجم
  const uploadedSize = fs.statSync(targetDb).size;
  console.log(`✅ تم رفع قاعدة البيانات بنجاح! (${uploadedSize} بايت)`);
  
  if (uploadedSize === data.length) {
    console.log('✅ تطابق الحجم - النسخ ناجح 100%');
  } else {
    console.log('⚠️ الحجم غير متطابق!');
  }
  
  console.log('\n🎉 اكتمل رفع قاعدة البيانات بنجاح!');
} catch (error) {
  console.error('❌ خطأ في رفع قاعدة البيانات:', error.message);
  process.exit(1);
}
