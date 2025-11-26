const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "expenses.db");

// التحقق من وجود ملف قاعدة البيانات
if (!fs.existsSync(dbPath)) {
  console.log("⚠️ قاعدة البيانات غير موجودة بعد. سيتم إنشاؤها عند أول تشغيل.");
  process.exit(0);
}

const db = new Database(dbPath);

console.log("🔧 إضافة حقول الوصف والتفاصيل لجدول المصروفات...");

try {
  // التحقق من وجود جدول expenses
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'").all();
  
  if (tables.length === 0) {
    console.log("⚠️ جدول expenses غير موجود بعد. سيتم إنشاؤه عند أول تشغيل.");
    db.close();
    process.exit(0);
  }
  
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
  db.close();
} catch (error) {
  console.error("❌ خطأ:", error.message);
  db.close();
  // لا نوقف العملية في حالة الخطأ لأن الجدول قد يكون غير موجود بعد
  process.exit(0);
}
