"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, "../../expenses.db");
const db = new better_sqlite3_1.default(dbPath);
console.log('🔄 تحديث قاعدة البيانات لدعم نوع الرابط URL...');
try {
    // تحديث جدول الحقول الديناميكية لدعم نوع url
    db.exec(`
    -- حذف القيود القديمة وإضافة الجديدة
    CREATE TABLE IF NOT EXISTS dynamic_fields_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'calculated', 'url')),
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
    // تحديث الحقول الموجودة من location إلى url
    const updateExisting = db.prepare(`
    UPDATE dynamic_fields 
    SET type = 'url' 
    WHERE type = 'location'
  `);
    const updatedCount = updateExisting.run().changes;
    if (updatedCount > 0) {
        console.log(`✅ تم تحديث ${updatedCount} حقل من نوع location إلى url`);
    }
    // إضافة بعض الحقول التجريبية للرابط
    const insertField = db.prepare(`
    INSERT OR IGNORE INTO dynamic_fields (name, label, type, page_type, is_required, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    // حقول للمساجد
    insertField.run('website_url', 'موقع المسجد الإلكتروني', 'url', 'mosques', 0, 10);
    insertField.run('social_media_url', 'رابط وسائل التواصل', 'url', 'mosques', 0, 11);
    // حقول للتوزيع
    insertField.run('tracking_url', 'رابط تتبع الشحنة', 'url', 'distributions', 0, 10);
    insertField.run('supplier_url', 'موقع المورد', 'url', 'distributions', 0, 11);
    // حقول للمصاريف
    insertField.run('invoice_url', 'رابط الفاتورة', 'url', 'expenses', 0, 10);
    insertField.run('receipt_url', 'رابط الإيصال', 'url', 'expenses', 0, 11);
    console.log('✅ تم إضافة حقول الروابط التجريبية');
    // عرض الحقول المضافة
    const urlFields = db.prepare(`
    SELECT name, label, page_type 
    FROM dynamic_fields 
    WHERE type = 'url' 
    ORDER BY page_type, display_order
  `).all();
    console.log('\n🔗 الحقول المضافة من نوع الرابط:');
    urlFields.forEach((field) => {
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
//# sourceMappingURL=update-url-fields.js.map