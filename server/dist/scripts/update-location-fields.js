"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, "../../expenses.db");
const db = new better_sqlite3_1.default(dbPath);
console.log('🔄 تحديث قاعدة البيانات لدعم نوع الموقع...');
try {
    // تحديث جدول الحقول الديناميكية لدعم نوع location
    db.exec(`
    -- حذف القيود القديمة وإضافة الجديدة
    CREATE TABLE IF NOT EXISTS dynamic_fields_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'calculated', 'location')),
      page_type TEXT NOT NULL,
      options TEXT,
      calculation_formula TEXT,
      is_required INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      default_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, page_type)
    );

    -- نسخ البيانات الموجودة
    INSERT OR IGNORE INTO dynamic_fields_new 
    SELECT * FROM dynamic_fields;

    -- حذف الجدول القديم واستبداله
    DROP TABLE IF EXISTS dynamic_fields;
    ALTER TABLE dynamic_fields_new RENAME TO dynamic_fields;
  `);
    console.log('✅ تم تحديث جدول الحقول الديناميكية بنجاح');
    // إضافة بعض الحقول التجريبية للموقع
    const insertField = db.prepare(`
    INSERT OR IGNORE INTO dynamic_fields (name, label, type, page_type, is_required, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    // حقول للمساجد
    insertField.run('exact_location', 'الموقع الدقيق', 'location', 'mosques', 0, 1);
    insertField.run('parking_location', 'موقف السيارات', 'location', 'mosques', 0, 2);
    // حقول للتوزيع
    insertField.run('storage_location', 'موقع المستودع', 'location', 'distributions', 0, 1);
    insertField.run('delivery_location', 'موقع التسليم', 'location', 'distributions', 0, 2);
    // حقول للمصاريف
    insertField.run('office_location', 'موقع المكتب', 'location', 'expenses', 0, 5);
    console.log('✅ تم إضافة حقول الموقع التجريبية');
    // عرض الحقول المضافة
    const locationFields = db.prepare(`
    SELECT name, label, page_type 
    FROM dynamic_fields 
    WHERE type = 'location' 
    ORDER BY page_type, display_order
  `).all();
    console.log('\n📍 الحقول المضافة من نوع الموقع:');
    locationFields.forEach((field) => {
        console.log(`  - ${field.label} (${field.name}) - صفحة: ${field.page_type}`);
    });
}
catch (error) {
    console.error('❌ خطأ في تحديث قاعدة البيانات:', error);
}
finally {
    db.close();
    console.log('\n🎉 تم إكمال تحديث قاعدة البيانات!');
}
//# sourceMappingURL=update-location-fields.js.map