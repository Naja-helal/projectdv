const Database = require('better-sqlite3');
const db = new Database('./database.db');

try {
  console.log('بدء إضافة نوع حقل الهاتف...');

  // إضافة نوع phone للحقول المسموحة
  db.exec(`
    DROP TABLE IF EXISTS dynamic_fields_temp;
    
    CREATE TABLE dynamic_fields_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'calculated', 'url', 'phone')),
      page_type TEXT NOT NULL,
      options TEXT,
      is_required BOOLEAN DEFAULT FALSE,
      display_order INTEGER DEFAULT 1,
      default_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    INSERT INTO dynamic_fields_temp SELECT * FROM dynamic_fields;
    DROP TABLE dynamic_fields;
    ALTER TABLE dynamic_fields_temp RENAME TO dynamic_fields;
  `);

  // إضافة حقل هاتف للمساجد
  const insertField = db.prepare(`
    INSERT OR IGNORE INTO dynamic_fields 
    (name, label, type, page_type, is_required, display_order, default_value)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // إضافة حقل هاتف إضافي للمسجد
  insertField.run('emergency_phone', 'هاتف الطوارئ', 'phone', 'mosques', 0, 4, '');

  console.log('تم إضافة نوع الهاتف بنجاح');

  // عرض النتائج
  const fields = db.prepare('SELECT * FROM dynamic_fields WHERE page_type = ? ORDER BY display_order').all('mosques');
  console.log('\nحقول المساجد المحدثة:');
  console.table(fields);

} catch (error) {
  console.error('خطأ:', error.message);
} finally {
  db.close();
}
