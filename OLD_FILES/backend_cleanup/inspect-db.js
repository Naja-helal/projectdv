const Database = require('better-sqlite3');
const db = new Database('./expenses.db');

console.log('🔍 فحص قاعدة البيانات...\n');

// فحص الجداول
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('📋 الجداول:');
tables.forEach(t => console.log(`  - ${t.name}`));

// فحص الـ Views
const views = db.prepare("SELECT name FROM sqlite_master WHERE type='view'").all();
console.log('\n👁️ الـ Views:');
views.forEach(v => console.log(`  - ${v.name}`));

// فحص الـ Triggers
const triggers = db.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type='trigger'").all();
console.log('\n⚡ الـ Triggers:');
triggers.forEach(t => console.log(`  - ${t.name} (على جدول ${t.tbl_name})`));

// فحص الـ Indexes
const indexes = db.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'").all();
console.log('\n🔑 الـ Indexes:');
indexes.forEach(i => console.log(`  - ${i.name} (على جدول ${i.tbl_name})`));

// البحث عن أي شيء يحتوي على project_items_old
const all = db.prepare("SELECT type, name, sql FROM sqlite_master WHERE sql LIKE '%project_items_old%'").all();
console.log('\n⚠️ كائنات تحتوي على project_items_old:');
if (all.length === 0) {
  console.log('  - لا يوجد');
} else {
  all.forEach(item => {
    console.log(`  - ${item.type}: ${item.name}`);
    console.log(`    SQL: ${item.sql.substring(0, 100)}...`);
  });
}

db.close();
