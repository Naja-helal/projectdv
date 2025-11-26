import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "../../expenses.db");
const db = new Database(dbPath);

console.log("📊 فحص جداول قاعدة البيانات:");

try {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();

  console.log("الجداول الموجودة:");
  tables.forEach((table: any) => {
    console.log(`  - ${table.name}`);
  });

  // التحقق من جدول dynamic_fields
  const dynamicFieldsExists = tables.some((t: any) => t.name === 'dynamic_fields');
  console.log(`\n🔍 جدول dynamic_fields: ${dynamicFieldsExists ? '✅ موجود' : '❌ غير موجود'}`);

  if (dynamicFieldsExists) {
    const fieldsCount = db.prepare("SELECT COUNT(*) as count FROM dynamic_fields").get() as { count: number };
    console.log(`   - عدد الحقول: ${fieldsCount.count}`);
  }

} catch (error) {
  console.error("❌ خطأ في فحص قاعدة البيانات:", error);
} finally {
  db.close();
}
