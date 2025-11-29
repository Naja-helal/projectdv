"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = require("path");
console.log('🔧 إصلاح Foreign Key constraints...');
const dbPath = (0, path_1.join)(process.cwd(), 'expenses.db');
const db = new better_sqlite3_1.default(dbPath);
try {
    console.log('1. حذف جدول bramawi_values القديم...');
    db.exec('DROP TABLE IF EXISTS bramawi_values');
    console.log('2. إنشاء جدول bramawi_values جديد بـ foreign keys صحيحة...');
    db.exec(`
    CREATE TABLE bramawi_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      field_id INTEGER NOT NULL,
      value TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (record_id) REFERENCES bramawi_records(id) ON DELETE CASCADE,
      FOREIGN KEY (field_id) REFERENCES bramawi_fields(id) ON DELETE CASCADE,
      UNIQUE(record_id, field_id)
    )
  `);
    console.log('3. إضافة الفهارس...');
    db.exec('CREATE INDEX IF NOT EXISTS idx_bramawi_values_record ON bramawi_values(record_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_bramawi_values_field ON bramawi_values(field_id)');
    console.log('4. حذف جدول النسخ الاحتياطي...');
    db.exec('DROP TABLE IF EXISTS bramawi_fields_backup');
    console.log('✅ تم إصلاح Foreign Key constraints بنجاح!');
}
catch (error) {
    console.error('❌ خطأ في إصلاح قاعدة البيانات:', error);
}
finally {
    db.close();
}
//# sourceMappingURL=fix-foreign-keys.js.map