const Database = require('better-sqlite3');
const path = require('path');

// فتح قاعدة البيانات
const dbPath = path.join(__dirname, 'expenses.db');
const db = new Database(dbPath);

console.log('🔧 بدء إصلاح نوع حقل date...\n');

try {
  // التحقق من نوع حقل date
  const columns = db.pragma('table_info(expenses)');
  const dateColumn = columns.find(col => col.name === 'date');
  
  console.log('📋 معلومات حقل date الحالي:');
  console.log(`   النوع: ${dateColumn.type}`);
  console.log('');
  
  if (dateColumn.type === 'INTEGER') {
    console.log('✅ حقل date بالفعل من نوع INTEGER، لا داعي للتغيير');
    process.exit(0);
  }
  
  // حذف الجدول المؤقت إذا كان موجوداً
  db.exec('DROP TABLE IF EXISTS expenses_temp');
  console.log('✅ تم حذف الجدول المؤقت إذا كان موجوداً');
  
  // تعطيل foreign keys
  db.exec('PRAGMA foreign_keys = OFF');
  console.log('✅ تم تعطيل foreign keys');
  
  // إنشاء جدول جديد مع date كـ INTEGER
  console.log('📝 إنشاء جدول جديد مع date كـ INTEGER...');
  db.exec(`
    CREATE TABLE expenses_temp (
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
  
  // نسخ البيانات مع تحويل date إلى INTEGER إذا لزم الأمر
  console.log('📦 نسخ البيانات مع تحويل التواريخ...');
  db.exec(`
    INSERT INTO expenses_temp (
      id, date, amount, description, details, notes,
      category_id, project_id, project_item_id,
      unit_id, quantity, unit_price,
      tax_rate, tax_amount, total_amount, created_at, updated_at
    )
    SELECT 
      id,
      CASE 
        WHEN typeof(date) = 'integer' THEN date
        WHEN date LIKE '____-__-__' THEN strftime('%s', date) * 1000
        ELSE CAST(date AS INTEGER)
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
  
  const count = db.prepare('SELECT COUNT(*) as count FROM expenses_temp').get();
  console.log(`✅ تم نسخ ${count.count} صف`);
  
  // حذف الجدول القديم
  console.log('🗑️ حذف الجدول القديم...');
  db.exec('DROP TABLE expenses');
  console.log('✅ تم حذف الجدول القديم');
  
  // إعادة تسمية الجدول الجديد
  console.log('📝 إعادة تسمية الجدول الجديد...');
  db.exec('ALTER TABLE expenses_temp RENAME TO expenses');
  console.log('✅ تم إعادة تسمية الجدول');
  
  // تفعيل foreign keys
  db.exec('PRAGMA foreign_keys = ON');
  console.log('✅ تم تفعيل foreign keys');
  
  // التحقق من النتيجة
  const newColumns = db.pragma('table_info(expenses)');
  const newDateColumn = newColumns.find(col => col.name === 'date');
  console.log('\n📋 نوع حقل date بعد الإصلاح:', newDateColumn.type);
  
  console.log('\n🎉 تم إصلاح نوع حقل date بنجاح!');
  
} catch (error) {
  console.error('❌ حدث خطأ:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  db.close();
}
