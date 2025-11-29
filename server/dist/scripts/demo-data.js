"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, "../../expenses.db");
const db = new better_sqlite3_1.default(dbPath);
console.log("🎯 إضافة بيانات تجريبية...");
// بيانات مصروفات تجريبية
const sampleExpenses = [
    {
        categoryId: 3, // اشتراكات مواقع/هوست
        amount: 299.99,
        taxRate: 15,
        date: Date.now() - (7 * 24 * 60 * 60 * 1000), // منذ أسبوع
        paymentMethod: "بطاقة ائتمان",
        reference: "HOST-2024-001",
        invoiceNumber: "INV-001",
        notes: "تجديد استضافة الموقع الرئيسي",
        extra: JSON.stringify({
            site_name: "example.com",
            hosting_provider: "Hostinger",
            renewal_date: "2025-09-11",
            plan_type: "Business",
            domain_name: "example.com"
        })
    },
    {
        categoryId: 1, // عمالة
        amount: 2500.00,
        taxRate: 0,
        date: Date.now() - (3 * 24 * 60 * 60 * 1000), // منذ 3 أيام
        paymentMethod: "تحويل بنكي",
        reference: "EMP-001",
        notes: "راتب مطور واجهات أمامية - سبتمبر 2024",
    },
    {
        categoryId: 2, // لوجستك
        amount: 150.50,
        taxRate: 15,
        date: Date.now() - (1 * 24 * 60 * 60 * 1000), // منذ يوم
        paymentMethod: "نقدي",
        reference: "SHIP-001",
        notes: "شحن أجهزة للموقع الجديد",
    },
    {
        categoryId: 3, // اشتراكات مواقع/هوست أخرى
        amount: 89.99,
        taxRate: 15,
        date: Date.now() - (5 * 24 * 60 * 60 * 1000), // منذ 5 أيام
        paymentMethod: "بطاقة ائتمان",
        reference: "CLOUD-001",
        invoiceNumber: "CF-2024-001",
        notes: "اشتراك شهري في Cloudflare Pro",
        extra: JSON.stringify({
            site_name: "api.example.com",
            hosting_provider: "Cloudflare",
            renewal_date: "2024-10-11",
            plan_type: "Pro"
        })
    },
    {
        categoryId: 5, // مصاريف عامة
        amount: 45.00,
        taxRate: 15,
        date: Date.now() - (2 * 24 * 60 * 60 * 1000), // منذ يومين
        paymentMethod: "محفظة إلكترونية",
        reference: "OFF-001",
        notes: "قرطاسية ولوازم مكتبية",
    }
];
const insertExpense = db.prepare(`
  INSERT INTO expenses
    (category_id, amount, currency, tax_rate, tax_amount, total_amount,
     date, payment_method, reference, invoice_number, notes, extra)
  VALUES (?, ?, 'SAR', ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const expense of sampleExpenses) {
    const taxAmount = +(expense.amount * (expense.taxRate / 100)).toFixed(2);
    const totalAmount = +(expense.amount + taxAmount).toFixed(2);
    const info = insertExpense.run(expense.categoryId, expense.amount, expense.taxRate, taxAmount, totalAmount, expense.date, expense.paymentMethod, expense.reference, expense.invoiceNumber || null, expense.notes, expense.extra || null);
    // إضافة الحقول المخصصة إذا وجدت
    if (expense.extra) {
        const extraData = JSON.parse(expense.extra);
        const customStmt = db.prepare(`
      INSERT INTO custom_values (entity, entity_id, field_key, value)
      VALUES ('expense', ?, ?, ?)
    `);
        for (const [key, value] of Object.entries(extraData)) {
            customStmt.run(info.lastInsertRowid, key, String(value));
        }
    }
}
// إضافة مورّد إضافي
const insertVendor = db.prepare(`
  INSERT OR IGNORE INTO vendors (name, contact, email, phone)
  VALUES (?, ?, ?, ?)
`);
insertVendor.run("Cloudflare", "دعم فني", "support@cloudflare.com", "+1-888-274-7552");
insertVendor.run("شركة الشحن السريع", "أحمد محمد", "info@fastship.sa", "+966501234567");
console.log("✅ تم إضافة البيانات التجريبية بنجاح!");
// عرض الإحصائيات النهائية
const finalStats = {
    categories: db.prepare("SELECT COUNT(*) as count FROM categories").get(),
    vendors: db.prepare("SELECT COUNT(*) as count FROM vendors").get(),
    expenses: db.prepare("SELECT COUNT(*) as count FROM expenses").get(),
    customFields: db.prepare("SELECT COUNT(*) as count FROM custom_fields").get(),
    customValues: db.prepare("SELECT COUNT(*) as count FROM custom_values").get(),
    totalAmount: db.prepare("SELECT SUM(total_amount) as total FROM expenses").get()
};
console.log("📊 إحصائيات النظام النهائية:");
console.log(`   - الفئات: ${finalStats.categories.count}`);
console.log(`   - المورّدين: ${finalStats.vendors.count}`);
console.log(`   - المصروفات: ${finalStats.expenses.count}`);
console.log(`   - الحقول المخصصة: ${finalStats.customFields.count}`);
console.log(`   - قيم الحقول المخصصة: ${finalStats.customValues.count}`);
console.log(`   - إجمالي المصروفات: ${finalStats.totalAmount.total?.toFixed(2) || '0.00'} ريال`);
db.close();
//# sourceMappingURL=demo-data.js.map