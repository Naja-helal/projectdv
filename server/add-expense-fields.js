const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "expenses.db");
const db = new Database(dbPath);

console.log("🔧 إضافة حقول الوصف والتفاصيل لجدول المصروفات...");

try {
  // التحقق من وجود العمود description
  const columns = db.pragma("table_info(expenses)");
  const hasDescription = columns.some(col => col.name === 'description');
  const hasDetails = columns.some(col => col.name === 'details');
  
  if (!hasDescription) {
    console.log("➕ إضافة عمود description...");
    db.exec("ALTER TABLE expenses ADD COLUMN description TEXT");
    console.log("✅ تم إضافة عمود description");
  } else {
    console.log("✓ عمود description موجود بالفعل");
  }
  
  if (!hasDetails) {
    console.log("➕ إضافة عمود details...");
    db.exec("ALTER TABLE expenses ADD COLUMN details TEXT");
    console.log("✅ تم إضافة عمود details");
  } else {
    console.log("✓ عمود details موجود بالفعل");
  }
  
  console.log("✅ تم تحديث جدول المصروفات بنجاح!");
} catch (error) {
  console.error("❌ خطأ:", error.message);
  process.exit(1);
}

db.close();
