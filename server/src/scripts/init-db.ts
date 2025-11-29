import Database from "better-sqlite3";
import path from "path";

// إنشاء قاعدة البيانات
const dbPath = path.join(__dirname, "../../expenses.db");
const db = new Database(dbPath);

console.log("🗄️ إنشاء قاعدة البيانات...");

// إنشاء جدول الفئات
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT,
    description TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    updated_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

// إنشاء جدول المورّدين
db.exec(`
  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    updated_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

// إنشاء جدول العملاء
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
    created_at INTEGER DEFAULT (strftime('%s','now')),
    updated_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

// إنشاء جدول المصروفات
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    vendor_id INTEGER,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'SAR',
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    date INTEGER NOT NULL,
    payment_method TEXT,
    reference TEXT,
    invoice_number TEXT,
    notes TEXT,
    extra TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at INTEGER DEFAULT (strftime('%s','now')),
    updated_at INTEGER DEFAULT (strftime('%s','now')),
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
  );
`);

// إنشاء جدول الحقول المخصصة
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity TEXT NOT NULL,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    type TEXT NOT NULL,
    options TEXT,
    required INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    UNIQUE(entity, key)
  );
`);

// إنشاء جدول قيم الحقول المخصصة
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    field_key TEXT NOT NULL,
    value TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    updated_at INTEGER DEFAULT (strftime('%s','now')),
    UNIQUE(entity, entity_id, field_key)
  );
`);

// إنشاء جدول حقول البرماوي الديناميكية
db.exec(`
  CREATE TABLE IF NOT EXISTS bramawi_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'calculated', 'fixed')),
    label TEXT NOT NULL,
    options TEXT, -- JSON للخيارات في حالة select
    calculation_formula TEXT, -- صيغة الحساب للحقول المحسوبة
    dependent_fields TEXT, -- JSON للحقول المرتبطة
    fixed_value TEXT, -- القيمة الثابتة للحقول الثابتة
    is_required INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    updated_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

// إنشاء جدول بيانات البرماوي
db.exec(`
  CREATE TABLE IF NOT EXISTS bramawi_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid')),
    payment_date INTEGER,
    notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    updated_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

// إنشاء جدول قيم حقول البرماوي
db.exec(`
  CREATE TABLE IF NOT EXISTS bramawi_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    field_id INTEGER NOT NULL,
    value TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    updated_at INTEGER DEFAULT (strftime('%s','now')),
    FOREIGN KEY (record_id) REFERENCES bramawi_records(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES bramawi_fields(id) ON DELETE CASCADE,
    UNIQUE(record_id, field_id)
  );
`);

// إضافة الحقول الأساسية للبرماوي
db.exec(`
  INSERT OR IGNORE INTO bramawi_fields (name, type, label, display_order, is_required) VALUES 
  ('num_bundles', 'number', 'عدد الربطات', 1, 1),
  ('unit_price', 'number', 'القيمة الفردية', 2, 1),
  ('total_amount', 'calculated', 'المبلغ الإجمالي', 3, 0);
`);

// تحديث صيغة الحساب للمبلغ الإجمالي
db.exec(`
  UPDATE bramawi_fields 
  SET calculation_formula = 'num_bundles * unit_price',
      dependent_fields = '["num_bundles", "unit_price"]'
  WHERE name = 'total_amount';
`);

// إنشاء فهارس للأداء
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
  CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
  CREATE INDEX IF NOT EXISTS idx_custom_values_entity ON custom_values(entity, entity_id);
  CREATE INDEX IF NOT EXISTS idx_bramawi_records_status ON bramawi_records(payment_status);
  CREATE INDEX IF NOT EXISTS idx_bramawi_records_date ON bramawi_records(created_at);
  CREATE INDEX IF NOT EXISTS idx_bramawi_values_record ON bramawi_values(record_id);
`);

console.log("✅ تم إنشاء جميع الجداول والفهارس بنجاح!");

db.close();
