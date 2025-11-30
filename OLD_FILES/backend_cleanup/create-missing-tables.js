const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'expenses.db');
const db = new Database(dbPath);

console.log('🔄 إنشاء الجداول المفقودة...\n');

try {
  // إنشاء جدول projects
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      project_item_id INTEGER,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      budget REAL DEFAULT 0,
      start_date INTEGER,
      end_date INTEGER,
      status TEXT DEFAULT 'active',
      color TEXT DEFAULT '#3b82f6',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (project_item_id) REFERENCES project_items(id) ON DELETE SET NULL
    );
  `);
  console.log('✅ تم إنشاء جدول projects');

  // إنشاء جدول expected_expenses
  db.exec(`
    CREATE TABLE IF NOT EXISTS expected_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      project_id INTEGER,
      category_id INTEGER,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date INTEGER NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);
  console.log('✅ تم إنشاء جدول expected_expenses');

  console.log('\n🎉 تم إنشاء جميع الجداول المفقودة بنجاح!');
  
  // عرض جميع الجداول
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log(`\n📊 إجمالي الجداول: ${tables.length}`);
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
}
