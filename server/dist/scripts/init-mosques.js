"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, "../../expenses.db");
const db = new better_sqlite3_1.default(dbPath);
console.log("🕌 إنشاء نظام المساجد والتوزيع...");
try {
    // إنشاء جدول المساجد الأساسي
    db.exec(`
    CREATE TABLE IF NOT EXISTS mosques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      location TEXT,
      imam_phone TEXT,
      guard_phone TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
    // إنشاء جدول عمليات التوزيع
    db.exec(`
    CREATE TABLE IF NOT EXISTS distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mosque_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('تصوير', 'تصريف')),
      bundles_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE
    )
  `);
    // إنشاء فهارس لتحسين الأداء
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_distributions_mosque_id ON distributions(mosque_id);
    CREATE INDEX IF NOT EXISTS idx_distributions_type ON distributions(type);
    CREATE INDEX IF NOT EXISTS idx_distributions_created_at ON distributions(created_at);
    CREATE INDEX IF NOT EXISTS idx_mosques_name ON mosques(name);
  `);
    console.log("✅ تم إنشاء جداول المساجد والتوزيع");
    // إضافة الحقول الديناميكية للمساجد
    const mosqueFields = [
        {
            name: 'mosque_name',
            label: 'اسم المسجد',
            type: 'text',
            page_type: 'mosques',
            is_required: 1,
            display_order: 1
        },
        {
            name: 'mosque_location',
            label: 'موقع المسجد',
            type: 'text',
            page_type: 'mosques',
            is_required: 1,
            display_order: 2
        },
        {
            name: 'imam_phone',
            label: 'رقم الإمام',
            type: 'text',
            page_type: 'mosques',
            is_required: 0,
            display_order: 3
        },
        {
            name: 'guard_phone',
            label: 'رقم الحارس',
            type: 'text',
            page_type: 'mosques',
            is_required: 0,
            display_order: 4
        }
    ];
    // إضافة الحقول الديناميكية للتوزيع
    const distributionFields = [
        {
            name: 'distribution_type',
            label: 'نوع التوزيع',
            type: 'select',
            page_type: 'distributions',
            options: JSON.stringify(['تصوير', 'تصريف']),
            is_required: 1,
            display_order: 1
        },
        {
            name: 'mosque_selection',
            label: 'اختيار المسجد',
            type: 'mosque_select', // نوع خاص لاختيار المسجد
            page_type: 'distributions',
            is_required: 1,
            display_order: 2
        },
        {
            name: 'bundles_count',
            label: 'عدد الربطات',
            type: 'number',
            page_type: 'distributions',
            is_required: 1,
            display_order: 3,
            default_value: '1'
        },
        {
            name: 'distribution_notes',
            label: 'ملاحظات',
            type: 'textarea',
            page_type: 'distributions',
            is_required: 0,
            display_order: 4
        }
    ];
    // إدراج الحقول الديناميكية
    const insertFieldStmt = db.prepare(`
    INSERT OR IGNORE INTO dynamic_fields (
      name, label, type, page_type, options, is_required, display_order, default_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    console.log("إضافة حقول المساجد الديناميكية...");
    for (const field of mosqueFields) {
        insertFieldStmt.run(field.name, field.label, field.type, field.page_type, null, field.is_required, field.display_order, null);
    }
    console.log("إضافة حقول التوزيع الديناميكية...");
    for (const field of distributionFields) {
        insertFieldStmt.run(field.name, field.label, field.type, field.page_type, field.options || null, field.is_required, field.display_order, field.default_value || null);
    }
    // إضافة بيانات تجريبية للمساجد
    const sampleMosques = [
        {
            name: 'مسجد الحرمين الشريفين',
            location: 'حي النزهة',
            imam_phone: '0501234567',
            guard_phone: '0507654321'
        },
        {
            name: 'مسجد الفاروق',
            location: 'حي الملك فهد',
            imam_phone: '0502345678',
            guard_phone: '0508765432'
        },
        {
            name: 'مسجد الصحابة',
            location: 'حي الورود',
            imam_phone: '0503456789',
            guard_phone: '0509876543'
        }
    ];
    const insertMosqueStmt = db.prepare(`
    INSERT OR IGNORE INTO mosques (name, location, imam_phone, guard_phone)
    VALUES (?, ?, ?, ?)
  `);
    console.log("إضافة مساجد تجريبية...");
    for (const mosque of sampleMosques) {
        insertMosqueStmt.run(mosque.name, mosque.location, mosque.imam_phone, mosque.guard_phone);
    }
    // إضافة بيانات تجريبية للتوزيع
    const mosqueIds = db.prepare("SELECT id FROM mosques").all();
    if (mosqueIds.length > 0) {
        const sampleDistributions = [
            {
                mosque_id: mosqueIds[0].id,
                type: 'تصوير',
                bundles_count: 10,
                notes: 'توزيع أول للتصوير'
            },
            {
                mosque_id: mosqueIds[1].id,
                type: 'تصريف',
                bundles_count: 15,
                notes: 'توزيع تصريف للمسجد الثاني'
            },
            {
                mosque_id: mosqueIds[0].id,
                type: 'تصريف',
                bundles_count: 8,
                notes: 'توزيع إضافي'
            }
        ];
        const insertDistributionStmt = db.prepare(`
      INSERT INTO distributions (mosque_id, type, bundles_count, notes)
      VALUES (?, ?, ?, ?)
    `);
        console.log("إضافة عمليات توزيع تجريبية...");
        for (const dist of sampleDistributions) {
            insertDistributionStmt.run(dist.mosque_id, dist.type, dist.bundles_count, dist.notes);
        }
    }
    console.log("✅ تم إنشاء نظام المساجد والتوزيع بنجاح!");
    console.log("📊 البيانات التجريبية:");
    console.log(`   - ${sampleMosques.length} مساجد تجريبية`);
    console.log(`   - ${mosqueFields.length} حقول ديناميكية للمساجد`);
    console.log(`   - ${distributionFields.length} حقول ديناميكية للتوزيع`);
}
catch (error) {
    console.error("❌ خطأ في إنشاء نظام المساجد:", error);
}
finally {
    db.close();
}
//# sourceMappingURL=init-mosques.js.map