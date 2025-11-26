const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'expenses.db');
const db = new Database(dbPath);

console.log('🔄 إضافة حقل نوع المشروع إلى جدول المشاريع...');

try {
  // إضافة حقل project_type_id
  db.exec(`
    ALTER TABLE projects ADD COLUMN project_type_id INTEGER REFERENCES project_types(id);
  `);
  
  console.log('✅ تم إضافة حقل project_type_id بنجاح');
  
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('ℹ️ حقل project_type_id موجود بالفعل');
  } else {
    console.error('❌ خطأ:', error.message);
  }
}

db.close();
console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
