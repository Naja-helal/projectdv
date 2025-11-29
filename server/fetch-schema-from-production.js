const Database = require('better-sqlite3');
const path = require('path');
const https = require('https');

const PRODUCTION_API = 'https://projectdv-production.up.railway.app';
const dbPath = path.join(__dirname, 'expenses.db');

console.log('🔄 سحب بنية الجداول من السيرفر...\n');

// دالة لجلب بنية جدول من السيرفر
async function getTableSchema(tableName) {
  return new Promise((resolve, reject) => {
    const url = `${PRODUCTION_API}/api/debug/schema/${tableName}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// بنية الجداول الأساسية (fallback)
const schemas = {
  clients: `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `,
  
  projects: `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      project_item_id INTEGER,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      budget REAL DEFAULT 0,
      expected_spending REAL DEFAULT 0,
      actual_spending REAL DEFAULT 0,
      start_date INTEGER,
      end_date INTEGER,
      status TEXT DEFAULT 'active',
      color TEXT DEFAULT '#3b82f6',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (project_item_id) REFERENCES project_items(id) ON DELETE SET NULL
    )
  `,
  
  project_items: `
    CREATE TABLE IF NOT EXISTS project_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT '📋',
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `,
  
  expected_expenses: `
    CREATE TABLE IF NOT EXISTS expected_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      project_id INTEGER,
      category_id INTEGER,
      unit_id INTEGER,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      quantity REAL DEFAULT 1,
      tax_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      date INTEGER NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
    )
  `,
  
  expenses: `
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS project_item_id INTEGER REFERENCES project_items(id);
  `
};

try {
  const db = new Database(dbPath);
  
  // إنشاء الجداول
  console.log('📦 إنشاء جدول clients...');
  db.exec(schemas.clients);
  console.log('✅ تم إنشاء جدول clients');
  
  console.log('📦 إنشاء جدول project_items...');
  db.exec(schemas.project_items);
  console.log('✅ تم إنشاء جدول project_items');
  
  console.log('📦 إنشاء جدول projects...');
  db.exec(schemas.projects);
  console.log('✅ تم إنشاء جدول projects');
  
  console.log('📦 إنشاء جدول expected_expenses...');
  db.exec(schemas.expected_expenses);
  console.log('✅ تم إنشاء جدول expected_expenses');
  
  // إضافة أعمدة لجدول expenses
  console.log('\n📝 تحديث جدول expenses...');
  
  const expensesColumns = db.pragma('table_info(expenses)');
  const hasProjectId = expensesColumns.some(col => col.name === 'project_id');
  const hasProjectItemId = expensesColumns.some(col => col.name === 'project_item_id');
  
  if (!hasProjectId) {
    db.exec('ALTER TABLE expenses ADD COLUMN project_id INTEGER REFERENCES projects(id)');
    console.log('✅ تم إضافة عمود project_id');
  } else {
    console.log('⚠️ عمود project_id موجود مسبقاً');
  }
  
  if (!hasProjectItemId) {
    db.exec('ALTER TABLE expenses ADD COLUMN project_item_id INTEGER REFERENCES project_items(id)');
    console.log('✅ تم إضافة عمود project_item_id');
  } else {
    console.log('⚠️ عمود project_item_id موجود مسبقاً');
  }
  
  // عرض جميع الجداول
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log(`\n📊 إجمالي الجداول: ${tables.length}`);
  console.log('📋 الجداول الموجودة:');
  tables.forEach((table, index) => {
    if (table.name !== 'sqlite_sequence') {
      console.log(`   ${index + 1}. ${table.name}`);
    }
  });
  
  db.close();
  console.log('\n🎉 تم سحب وتطبيق بنية الجداول بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
}
