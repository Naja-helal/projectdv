"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
// الاتصال بقاعدة البيانات
const dbPath = path_1.default.join(__dirname, "../../expenses.db");
const db = new better_sqlite3_1.default(dbPath);
console.log("🧹 تنظيف قاعدة البيانات من البيانات المكررة...");
// حذف جميع الحقول الموجودة أولاً
db.exec(`DELETE FROM bramawi_fields`);
console.log("✨ تم حذف جميع الحقول القديمة");
// إضافة الحقول الأساسية من جديد (بدون تكرار)
db.exec(`
  INSERT INTO bramawi_fields (name, type, label, display_order, is_required) VALUES 
  ('num_bundles', 'number', 'عدد الربطات', 1, 1),
  ('unit_price', 'number', 'القيمة الفردية', 2, 1),
  ('total_amount', 'calculated', 'المبلغ الإجمالي', 3, 0);
`);
console.log("✅ تم إضافة الحقول الأساسية الثلاثة فقط");
// تحديث صيغة الحساب للمبلغ الإجمالي
db.exec(`
  UPDATE bramawi_fields 
  SET calculation_formula = 'num_bundles * unit_price',
      dependent_fields = '["num_bundles", "unit_price"]'
  WHERE name = 'total_amount';
`);
console.log("📊 تم تحديث صيغة الحساب للمبلغ الإجمالي");
// عرض الحقول الحالية
const fields = db.prepare("SELECT * FROM bramawi_fields ORDER BY display_order").all();
console.log("📋 الحقول الحالية:");
fields.forEach((field) => {
    console.log(`  ${field.display_order}. ${field.label} (${field.name}) - نوع: ${field.type}`);
});
db.close();
console.log("✅ تم تنظيف قاعدة البيانات بنجاح!");
//# sourceMappingURL=clean-bramawi.js.map