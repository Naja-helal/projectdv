"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, "../../expenses.db");
const db = new better_sqlite3_1.default(dbPath);
console.log("📊 فحص جداول قاعدة البيانات:");
try {
    const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
    console.log("الجداول الموجودة:");
    tables.forEach((table) => {
        console.log(`  - ${table.name}`);
    });
    // التحقق من جدول dynamic_fields
    const dynamicFieldsExists = tables.some((t) => t.name === 'dynamic_fields');
    console.log(`\n🔍 جدول dynamic_fields: ${dynamicFieldsExists ? '✅ موجود' : '❌ غير موجود'}`);
    if (dynamicFieldsExists) {
        const fieldsCount = db.prepare("SELECT COUNT(*) as count FROM dynamic_fields").get();
        console.log(`   - عدد الحقول: ${fieldsCount.count}`);
    }
}
catch (error) {
    console.error("❌ خطأ في فحص قاعدة البيانات:", error);
}
finally {
    db.close();
}
//# sourceMappingURL=check-db.js.map