import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "../../expenses.db");
const db = new Database(dbPath);

console.log("🌱 إضافة البيانات الأساسية...");

// إضافة الفئات الأساسية
const categories = [
  { name: "عمالة", code: "labor", color: "#ef4444", icon: "👷" },
  { name: "لوجستك", code: "logistics", color: "#f97316", icon: "🚚" },
  { name: "اشتراكات مواقع/هوست", code: "hosting", color: "#06b6d4", icon: "🌐" },
  { name: "رواتب", code: "salaries", color: "#10b981", icon: "💰" },
  { name: "مصاريف عامة", code: "general", color: "#6b7280", icon: "📋" },
  { name: "مواد خام", code: "materials", color: "#8b5cf6", icon: "🧱" },
  { name: "معدات", code: "equipment", color: "#f59e0b", icon: "🔧" },
  { name: "مواصلات", code: "transport", color: "#ec4899", icon: "🚗" },
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, code, color, icon) 
  VALUES (?, ?, ?, ?)
`);

for (const cat of categories) {
  insertCategory.run(cat.name, cat.code, cat.color, cat.icon);
}

// إضافة الحقول المخصصة للاشتراكات
const customFields = [
  {
    entity: "expense",
    name: "اسم الموقع",
    key: "site_name",
    type: "text",
    required: 0,
    sort_order: 1
  },
  {
    entity: "expense",
    name: "مزود الاستضافة",
    key: "hosting_provider",
    type: "select",
    options: JSON.stringify(["Hostinger", "GoDaddy", "Namecheap", "SiteGround", "Bluehost", "أخرى"]),
    required: 0,
    sort_order: 2
  },
  {
    entity: "expense",
    name: "تاريخ التجديد",
    key: "renewal_date",
    type: "date",
    required: 0,
    sort_order: 3
  },
  {
    entity: "expense",
    name: "الخطة",
    key: "plan_type",
    type: "text",
    required: 0,
    sort_order: 4
  },
  {
    entity: "expense",
    name: "الدومين",
    key: "domain_name",
    type: "text",
    required: 0,
    sort_order: 5
  },
  {
    entity: "expense",
    name: "رقم العقد",
    key: "contract_number",
    type: "text",
    required: 0,
    sort_order: 6
  }
];

const insertCustomField = db.prepare(`
  INSERT OR IGNORE INTO custom_fields (entity, name, key, type, options, required, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const field of customFields) {
  insertCustomField.run(
    field.entity,
    field.name,
    field.key,
    field.type,
    field.options || null,
    field.required,
    field.sort_order
  );
}

// إضافة مورّد تجريبي
const insertVendor = db.prepare(`
  INSERT OR IGNORE INTO vendors (name, contact, email)
  VALUES (?, ?, ?)
`);

insertVendor.run("Hostinger", "دعم فني", "support@hostinger.com");

console.log("✅ تم إضافة البيانات الأساسية بنجاح!");

// عرض إحصائيات
const stats = {
  categories: db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number },
  customFields: db.prepare("SELECT COUNT(*) as count FROM custom_fields").get() as { count: number },
  vendors: db.prepare("SELECT COUNT(*) as count FROM vendors").get() as { count: number }
};

console.log("📊 الإحصائيات:");
console.log(`   - الفئات: ${stats.categories.count}`);
console.log(`   - الحقول المخصصة: ${stats.customFields.count}`);
console.log(`   - المورّدين: ${stats.vendors.count}`);

db.close();
