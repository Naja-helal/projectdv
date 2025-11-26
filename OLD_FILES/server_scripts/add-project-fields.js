const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'expenses.db');
const db = new Database(dbPath);

console.log('🔄 إضافة حقل الإنفاق المتوقع لجدول المشاريع...');

try {
  // إضافة حقل الإنفاق المتوقع
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN expected_spending REAL DEFAULT 0;`);
    console.log('✅ تم إضافة حقل expected_spending');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ حقل expected_spending موجود بالفعل');
    } else {
      throw error;
    }
  }

  // تحديث الإنفاق المتوقع للمشاريع الموجودة (نفس قيمة الميزانية)
  console.log('🔄 تحديث قيم المشاريع الموجودة...');
  
  const updateStmt = db.prepare(`
    UPDATE projects 
    SET expected_spending = budget
    WHERE expected_spending = 0 OR expected_spending IS NULL
  `);
  
  const result = updateStmt.run();
  console.log(`✅ تم تحديث ${result.changes} مشروع`);
  
  console.log('\n✅ تم تحديث جدول المشاريع بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
}

db.close();
console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
