const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'expenses.db');
const db = new Database(dbPath);

console.log('🔧 إصلاح جدول expenses...\n');

try {
  // بداية المعاملة
  db.exec('BEGIN TRANSACTION');

  // 1. إنشاء جدول مؤقت بالهيكل الصحيح
  console.log('1️⃣ إنشاء جدول مؤقت...');
  db.exec(`
    CREATE TABLE expenses_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      category_id INTEGER NOT NULL,
      vendor_id INTEGER,
      project_item_id INTEGER,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'SAR',
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      unit TEXT DEFAULT 'قطعة',
      date INTEGER NOT NULL,
      payment_method TEXT,
      reference TEXT,
      invoice_number TEXT,
      notes TEXT,
      extra TEXT,
      status TEXT DEFAULT 'confirmed',
      created_at INTEGER DEFAULT (strftime('%s','now')),
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT,
      FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
      FOREIGN KEY(project_item_id) REFERENCES project_items(id) ON DELETE SET NULL
    )
  `);

  // 2. نسخ البيانات
  console.log('2️⃣ نسخ البيانات...');
  db.exec(`
    INSERT INTO expenses_new 
      (id, project_id, category_id, vendor_id, project_item_id, 
       amount, currency, tax_rate, tax_amount, total_amount,
       quantity, unit_price, unit,
       date, payment_method, reference, invoice_number, notes, extra, status,
       created_at, updated_at)
    SELECT 
      id, project_id, category_id, vendor_id, project_item_id,
      amount, currency, tax_rate, tax_amount, total_amount,
      COALESCE(quantity, 1), COALESCE(unit_price, amount), COALESCE(unit, 'قطعة'),
      date, payment_method, reference, invoice_number, notes, extra, status,
      created_at, updated_at
    FROM expenses
  `);

  // 3. حذف الجدول القديم
  console.log('3️⃣ حذف الجدول القديم...');
  db.exec('DROP TABLE expenses');

  // 4. إعادة تسمية الجدول الجديد
  console.log('4️⃣ إعادة تسمية الجدول...');
  db.exec('ALTER TABLE expenses_new RENAME TO expenses');

  // 5. إعادة إنشاء الـ indexes إذا كانت موجودة
  console.log('5️⃣ إعادة إنشاء الفهارس...');
  db.exec('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id)');

  // إتمام المعاملة
  db.exec('COMMIT');

  console.log('\n✅ تم إصلاح جدول expenses بنجاح!');
  console.log('✅ تم تحديث foreign key لـ project_item_id إلى project_items');
  
} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
  console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
}
