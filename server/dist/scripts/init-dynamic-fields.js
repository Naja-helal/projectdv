"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, "../../expenses.db");
const db = new better_sqlite3_1.default(dbPath);
// إنشاء جدول الحقول الديناميكية
db.exec(`
  CREATE TABLE IF NOT EXISTS dynamic_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'calculated', 'location')),
    page_type TEXT NOT NULL,
    options TEXT, -- JSON للخيارات
    calculation_formula TEXT,
    is_required INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    default_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, page_type)
  );
`);
// إنشاء جدول البيانات الديناميكية
db.exec(`
  CREATE TABLE IF NOT EXISTS dynamic_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_type TEXT NOT NULL,
    record_data TEXT NOT NULL, -- JSON للبيانات
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
// إضافة بعض الحقول التجريبية للمصاريف
const insertField = db.prepare(`
  INSERT OR IGNORE INTO dynamic_fields (name, label, type, page_type, is_required, display_order)
  VALUES (?, ?, ?, ?, ?, ?)
`);
// حقول تجريبية لصفحة المصاريف
insertField.run('site_name', 'اسم الموقع', 'text', 'expenses', 1, 1);
insertField.run('hosting_provider', 'مزود الاستضافة', 'select', 'expenses', 1, 2);
insertField.run('renewal_date', 'تاريخ التجديد', 'date', 'expenses', 0, 3);
insertField.run('plan_type', 'نوع الخطة', 'text', 'expenses', 0, 4);
// حقول للمساجد مع دعم الموقع
insertField.run('exact_location', 'الموقع الدقيق', 'location', 'mosques', 0, 1);
insertField.run('parking_location', 'موقف السيارات', 'location', 'mosques', 0, 2);
insertField.run('storage_location', 'موقع المستودع', 'location', 'distributions', 0, 1);
// تحديث خيارات حقل مزود الاستضافة
const updateOptions = db.prepare(`
  UPDATE dynamic_fields 
  SET options = ? 
  WHERE name = ? AND page_type = ?
`);
updateOptions.run(JSON.stringify(['Hostinger', 'GoDaddy', 'Namecheap', 'SiteGround', 'Bluehost', 'أخرى']), 'hosting_provider', 'expenses');
console.log('✅ تم إنشاء جداول الحقول الديناميكية');
console.log('✅ تم إضافة حقول تجريبية للمصاريف');
db.close();
//# sourceMappingURL=init-dynamic-fields.js.map