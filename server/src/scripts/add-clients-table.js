const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../expenses.db');
const db = new Database(dbPath);

console.log('🔧 بدء تحديث قاعدة البيانات...\n');

try {
  // 1. إنشاء جدول العملاء
  console.log('📦 إنشاء جدول العملاء...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      address TEXT,
      contact_person TEXT,
      tax_number TEXT,
      notes TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT '👤',
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
    )
  `);
  console.log('✅ تم إنشاء جدول العملاء\n');

  // 2. إضافة عميل تجريبي
  console.log('📝 إضافة عميل تجريبي افتراضي...');
  const clientExists = db.prepare('SELECT COUNT(*) as count FROM clients WHERE id = 1').get();
  if (clientExists.count === 0) {
    db.exec(`
      INSERT INTO clients (id, name, code, phone, color, icon, notes) 
      VALUES (1, 'عميل تجريبي', 'CLT-DEFAULT', '0500000000', '#9ca3af', '🏢', 'عميل افتراضي للمشاريع التجريبية والقديمة')
    `);
    console.log('✅ تم إضافة العميل التجريبي\n');
  } else {
    console.log('ℹ️  العميل التجريبي موجود مسبقاً\n');
  }

  // 3. التحقق من وجود client_id في جدول المشاريع
  console.log('🔍 التحقق من عمود client_id في جدول المشاريع...');
  const columns = db.pragma('table_info(projects)');
  const hasClientId = columns.some(col => col.name === 'client_id');

  if (!hasClientId) {
    console.log('➕ إضافة عمود client_id...');
    // SQLite لا يدعم إضافة عمود REFERENCES مع DEFAULT
    // نضيف العمود بدون REFERENCES أولاً
    db.exec('ALTER TABLE projects ADD COLUMN client_id INTEGER DEFAULT 1');
    console.log('✅ تم إضافة عمود client_id\n');

    // 4. ربط المشاريع الحالية بالعميل التجريبي
    console.log('🔗 ربط المشاريع الحالية بالعميل التجريبي...');
    db.exec('UPDATE projects SET client_id = 1 WHERE client_id IS NULL');
    console.log('✅ تم ربط جميع المشاريع بالعميل التجريبي\n');
  } else {
    console.log('ℹ️  عمود client_id موجود مسبقاً\n');
  }

  // 5. عرض ملخص
  const clientsCount = db.prepare('SELECT COUNT(*) as count FROM clients').get();
  const projectsCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  const linkedProjects = db.prepare('SELECT COUNT(*) as count FROM projects WHERE client_id IS NOT NULL').get();

  console.log('📊 ملخص التحديث:');
  console.log(`   • عدد العملاء: ${clientsCount.count}`);
  console.log(`   • عدد المشاريع: ${projectsCount.count}`);
  console.log(`   • المشاريع المرتبطة بعميل: ${linkedProjects.count}\n`);

  console.log('🎉 تم تحديث قاعدة البيانات بنجاح!');

} catch (error) {
  console.error('❌ خطأ في تحديث قاعدة البيانات:', error);
  process.exit(1);
} finally {
  db.close();
}
