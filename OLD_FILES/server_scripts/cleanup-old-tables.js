const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'expenses.db');
const db = new Database(dbPath);

console.log('🧹 تنظيف الجداول القديمة...');

try {
  // حذف جدول project_items_old إذا كان موجوداً
  try {
    db.exec('DROP TABLE IF EXISTS project_items_old');
    console.log('✅ تم حذف جدول project_items_old');
  } catch (error) {
    console.log('ℹ️ جدول project_items_old غير موجود');
  }

  // حذف أي جداول قديمة أخرى
  const oldTables = [
    'project_items_backup',
    'old_project_items',
    'temp_project_items'
  ];

  oldTables.forEach(table => {
    try {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
      console.log(`✅ تم حذف جدول ${table}`);
    } catch (error) {
      // تجاهل الأخطاء
    }
  });

  console.log('\n✅ تم تنظيف قاعدة البيانات بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
  console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
}
