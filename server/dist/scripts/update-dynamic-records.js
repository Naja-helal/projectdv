"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, "../../expenses.db");
const db = new better_sqlite3_1.default(dbPath);
console.log('🔄 تحديث جدول dynamic_records...');
try {
    // التحقق من وجود عمود record_id
    const tableInfo = db.prepare("PRAGMA table_info(dynamic_records)").all();
    const hasRecordId = tableInfo.some((col) => col.name === 'record_id');
    if (!hasRecordId) {
        console.log('إضافة عمود record_id...');
        db.exec(`
      ALTER TABLE dynamic_records ADD COLUMN record_id INTEGER;
    `);
        // إنشاء index للأداء
        db.exec(`
      CREATE INDEX IF NOT EXISTS idx_dynamic_records_page_record 
      ON dynamic_records(page_type, record_id);
    `);
        console.log('✅ تم إضافة عمود record_id بنجاح');
    }
    else {
        console.log('✅ عمود record_id موجود مسبقاً');
    }
    // عرض بنية الجدول النهائية
    const finalTableInfo = db.prepare("PRAGMA table_info(dynamic_records)").all();
    console.log('\n📋 بنية جدول dynamic_records:');
    finalTableInfo.forEach((col) => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
}
catch (error) {
    console.error('❌ خطأ في تحديث الجدول:', error);
}
finally {
    db.close();
    console.log('\n🎉 تم إكمال تحديث الجدول!');
}
//# sourceMappingURL=update-dynamic-records.js.map