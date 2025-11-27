const Database = require('better-sqlite3');
const path = require('path');

// فتح قاعدة البيانات
const dbPath = path.join(__dirname, 'expenses.db');
const db = new Database(dbPath);

console.log('🗑️ بدء حذف أعمدة vendor_id و status من جدول expenses...\n');

try {
  // التحقق من وجود الأعمدة
  const columns = db.pragma('table_info(expenses)');
  const hasVendorId = columns.some(col => col.name === 'vendor_id');
  const hasStatus = columns.some(col => col.name === 'status');
  
  if (!hasVendorId && !hasStatus) {
    console.log('✅ الأعمدة غير موجودة أصلاً، لا داعي للحذف');
    process.exit(0);
  }
  
  console.log('📋 الأعمدة الحالية:');
  columns.forEach(col => console.log(`   - ${col.name} (${col.type})`));
  console.log('');
  
  // حذف الجدول المؤقت إذا كان موجوداً من محاولة سابقة
  db.exec('DROP TABLE IF EXISTS expenses_new');
  console.log('✅ تم حذف الجدول المؤقت إذا كان موجوداً');
  
  // تعطيل foreign keys
  db.exec('PRAGMA foreign_keys = OFF');
  console.log('✅ تم تعطيل foreign keys');
  
  // إنشاء جدول جديد بدون vendor_id و status
  console.log('📝 إنشاء جدول جديد بدون vendor_id و status...');
  db.exec(`
    CREATE TABLE expenses_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      details TEXT,
      notes TEXT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      project_id INTEGER REFERENCES projects(id),
      project_item_id INTEGER REFERENCES project_items(id),
      unit_id INTEGER REFERENCES units(id),
      quantity REAL DEFAULT 1,
      unit_price REAL,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);
  console.log('✅ تم إنشاء الجدول الجديد');
  
  // نسخ البيانات (بدون vendor_id و status)
  console.log('📦 نسخ البيانات من الجدول القديم...');
  const result = db.exec(`
    INSERT INTO expenses_new (
      id, date, amount, description, details, notes,
      category_id, project_id, project_item_id,
      unit_id, quantity, unit_price,
      tax_rate, tax_amount, total_amount, created_at, updated_at
    )
    SELECT 
      id, 
      CASE 
        WHEN typeof(date) = 'integer' THEN date 
        ELSE strftime('%s', date) * 1000
      END as date,
      amount, 
      description, 
      details, 
      notes,
      category_id, 
      project_id, 
      project_item_id,
      unit_id, 
      quantity, 
      unit_price,
      tax_rate, 
      tax_amount, 
      total_amount, 
      CASE 
        WHEN typeof(created_at) = 'integer' THEN created_at 
        ELSE strftime('%s', created_at) * 1000
      END as created_at,
      CASE 
        WHEN typeof(updated_at) = 'integer' THEN updated_at 
        ELSE strftime('%s', updated_at) * 1000
      END as updated_at
    FROM expenses
  `);
  
  // حساب عدد الصفوف المنسوخة
  const count = db.prepare('SELECT COUNT(*) as count FROM expenses_new').get();
  console.log(`✅ تم نسخ ${count.count} صف`);
  
  // حذف الجدول القديم
  console.log('🗑️ حذف الجدول القديم...');
  db.exec('DROP TABLE expenses');
  console.log('✅ تم حذف الجدول القديم');
  
  // إعادة تسمية الجدول الجديد
  console.log('📝 إعادة تسمية الجدول الجديد...');
  db.exec('ALTER TABLE expenses_new RENAME TO expenses');
  console.log('✅ تم إعادة تسمية الجدول');
  
  // تفعيل foreign keys
  db.exec('PRAGMA foreign_keys = ON');
  console.log('✅ تم تفعيل foreign keys');
  
  // التحقق من النتيجة
  console.log('\n📋 الأعمدة بعد الحذف:');
  const newColumns = db.pragma('table_info(expenses)');
  newColumns.forEach(col => console.log(`   - ${col.name} (${col.type})`));
  
  console.log('\n🎉 تم حذف أعمدة vendor_id و status بنجاح!');
  
} catch (error) {
  console.error('❌ حدث خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
}
