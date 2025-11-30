const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'expenses.db'));

console.log('🔄 تحديث جدول expenses لإضافة عمود unit_id...');

try {
  // التحقق من وجود العمود
  const tableInfo = db.prepare('PRAGMA table_info(expenses)').all();
  const hasUnitId = tableInfo.some(col => col.name === 'unit_id');

  if (hasUnitId) {
    console.log('✅ العمود unit_id موجود بالفعل');
  } else {
    // إضافة العمود unit_id
    db.exec(`
      ALTER TABLE expenses 
      ADD COLUMN unit_id INTEGER REFERENCES units(id);
    `);
    console.log('✅ تم إضافة عمود unit_id بنجاح');
  }

  // عرض عدد المصروفات
  const count = db.prepare('SELECT COUNT(*) as count FROM expenses').get();
  console.log(`📊 عدد المصروفات: ${count.count}`);

  console.log('\n✨ تم تحديث قاعدة البيانات بنجاح!');

} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
}
