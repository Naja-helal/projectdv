const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'expenses.db');
console.log('📂 فحص قاعدة البيانات:', dbPath);

const db = new Database(dbPath, { readonly: true });

console.log('\n=== الجداول الموجودة في قاعدة البيانات ===\n');

const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all();

tables.forEach(table => {
  console.log(`\n📋 جدول: ${table.name}`);
  console.log('─'.repeat(50));
  
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
  columns.forEach(col => {
    let line = `   ${col.cid + 1}. ${col.name} (${col.type})`;
    if (col.notnull) line += ' NOT NULL';
    if (col.pk) line += ' PRIMARY KEY';
    if (col.dflt_value) line += ` DEFAULT ${col.dflt_value}`;
    console.log(line);
  });
  
  // عرض عدد السجلات
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`   📊 عدد السجلات: ${count.count}`);
  } catch (e) {
    console.log(`   ❌ خطأ في العد: ${e.message}`);
  }
});

console.log('\n\n=== ملخص الجداول ===');
console.log(`إجمالي الجداول: ${tables.length}`);
tables.forEach(t => console.log(`  - ${t.name}`));

db.close();
console.log('\n✅ تم الفحص بنجاح');
