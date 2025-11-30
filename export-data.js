// تصدير البيانات من SQLite إلى JSON لرفعها على Supabase
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'production.db');
const db = new Database(dbPath, { readonly: true });

console.log('📊 بدء تصدير البيانات من SQLite...\n');

// الجداول المطلوب تصديرها
const tables = [
  'categories',
  'clients',
  'projects', 
  'project_items',
  'expenses',
  'expected_expenses',
  'units',
  'payment_methods'
];

const exportData = {};

tables.forEach(table => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    exportData[table] = rows;
    console.log(`✅ ${table}: ${rows.length} سجل`);
  } catch (error) {
    console.error(`❌ خطأ في تصدير ${table}:`, error.message);
    exportData[table] = [];
  }
});

// حفظ البيانات في ملف JSON
const outputPath = path.join(__dirname, 'database-export.json');
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');

console.log(`\n✅ تم التصدير بنجاح إلى: ${outputPath}`);
console.log(`📦 إجمالي الجداول: ${Object.keys(exportData).length}`);
console.log(`📊 إجمالي السجلات: ${Object.values(exportData).reduce((sum, rows) => sum + rows.length, 0)}`);

db.close();
