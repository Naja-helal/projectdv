// إضافة حقول description و details لقاعدة البيانات على Railway مباشرة
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// استخدام المسار الصحيح على Railway
const dbPath = process.env.DB_PATH || '/app/data/expenses.db';

console.log(`🔧 تعديل قاعدة البيانات على: ${dbPath}`);

// التحقق من وجود الملف
if (!fs.existsSync(dbPath)) {
  console.log('⚠️ قاعدة البيانات غير موجودة!');
  process.exit(1);
}

try {
  const db = new Database(dbPath);
  
  // الحصول على الأعمدة الحالية
  const columns = db.pragma('table_info(expenses)');
  const hasDescription = columns.some(col => col.name === 'description');
  const hasDetails = columns.some(col => col.name === 'details');
  
  console.log(`\n📊 الأعمدة الحالية: ${columns.length}`);
  console.log(`   description: ${hasDescription ? '✅ موجود' : '❌ غير موجود'}`);
  console.log(`   details: ${hasDetails ? '✅ موجود' : '❌ غير موجود'}\n`);
  
  // إضافة الأعمدة إذا لم تكن موجودة
  if (!hasDescription) {
    console.log('➕ إضافة عمود description...');
    db.exec('ALTER TABLE expenses ADD COLUMN description TEXT');
    console.log('✅ تم إضافة عمود description');
  }
  
  if (!hasDetails) {
    console.log('➕ إضافة عمود details...');
    db.exec('ALTER TABLE expenses ADD COLUMN details TEXT');
    console.log('✅ تم إضافة عمود details');
  }
  
  // التحقق النهائي
  const finalColumns = db.pragma('table_info(expenses)');
  console.log(`\n✅ إجمالي الأعمدة بعد التعديل: ${finalColumns.length}`);
  
  db.close();
  console.log('🎉 تم التحديث بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
}
