const Database = require('better-sqlite3');

const db = new Database('./expenses.db');

console.log('🔧 إزالة عمود type من جدول المشاريع...\n');

try {
  // التحقق من وجود عمود type
  const columns = db.pragma('table_info(projects)');
  const hasType = columns.some(col => col.name === 'type');
  
  if (!hasType) {
    console.log('✅ عمود type غير موجود - لا حاجة للتحديث');
    db.close();
    process.exit(0);
  }
  
  console.log('📋 العمود type موجود - سيتم إزالته...');
  
  // تعطيل foreign keys مؤقتاً
  db.exec('PRAGMA foreign_keys = OFF');
  
  // نسخ الجدول بدون type
  db.exec(`
    BEGIN TRANSACTION;
    
    CREATE TABLE projects_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      project_item_id INTEGER,
      client_id INTEGER DEFAULT 1,
      description TEXT,
      budget REAL DEFAULT 0,
      expected_spending REAL DEFAULT 0,
      start_date INTEGER,
      end_date INTEGER,
      status TEXT DEFAULT 'active',
      color TEXT DEFAULT '#3b82f6',
      created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
    );
    
    INSERT INTO projects_new (
      id, name, code, project_item_id, client_id, description, 
      budget, expected_spending, start_date, end_date, 
      status, color, created_at, updated_at
    )
    SELECT 
      id, name, code, project_item_id, client_id, description, 
      budget, expected_spending, start_date, end_date, 
      status, color, created_at, updated_at
    FROM projects;
    
    DROP TABLE projects;
    ALTER TABLE projects_new RENAME TO projects;
    
    COMMIT;
  `);
  
  // إعادة تفعيل foreign keys
  db.exec('PRAGMA foreign_keys = ON');
  
  console.log('\n✅ تم إزالة عمود type من جدول المشاريع بنجاح!');
  
  // عرض هيكل الجدول الجديد
  const newColumns = db.pragma('table_info(projects)');
  console.log('\n📊 هيكل جدول المشاريع الجديد:');
  newColumns.forEach(col => {
    console.log(`   - ${col.name} (${col.type})`);
  });
  
  // عدد المشاريع
  const count = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  console.log(`\n📈 عدد المشاريع: ${count.count}`);
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
}
