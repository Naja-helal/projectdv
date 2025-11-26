const Database = require('better-sqlite3');
const db = new Database('./database.db');

try {
  console.log('بدء إنشاء الجداول...');

  // إنشاء جدول الحقول الديناميكية
  db.exec(`
    CREATE TABLE IF NOT EXISTS dynamic_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'calculated', 'url')),
      page_type TEXT NOT NULL,
      options TEXT,
      is_required BOOLEAN DEFAULT FALSE,
      display_order INTEGER DEFAULT 1,
      default_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // إنشاء جدول البيانات الديناميكية
  db.exec(`
    CREATE TABLE IF NOT EXISTS dynamic_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      page_type TEXT NOT NULL,
      field_name TEXT NOT NULL,
      field_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(record_id, page_type, field_name)
    );
  `);

  console.log('تم إنشاء الجداول بنجاح');
  
  // إضافة بعض الحقول التجريبية للمساجد
  const insertField = db.prepare(`
    INSERT OR IGNORE INTO dynamic_fields 
    (name, label, type, page_type, is_required, display_order, default_value)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // إضافة حقل رابط خريطة المسجد
  insertField.run('mosque_map', 'رابط خريطة المسجد', 'url', 'mosques', 0, 1, '');
  
  // إضافة حقل موقع المسجد على الإنترنت
  insertField.run('mosque_website', 'موقع المسجد الإلكتروني', 'url', 'mosques', 0, 2, '');
  
  // إضافة حقل رقم إضافي
  insertField.run('additional_phone', 'رقم إضافي', 'text', 'mosques', 0, 3, '');

  console.log('تم إضافة الحقول التجريبية');

  // عرض النتائج
  const fields = db.prepare('SELECT * FROM dynamic_fields WHERE page_type = ?').all('mosques');
  console.log('\nالحقول المضافة للمساجد:');
  console.table(fields);

  // عرض جميع الحقول
  const allFields = db.prepare('SELECT * FROM dynamic_fields ORDER BY page_type, display_order').all();
  console.log('\nجميع الحقول الديناميكية:');
  console.table(allFields);

} catch (error) {
  console.error('خطأ:', error.message);
} finally {
  db.close();
}
