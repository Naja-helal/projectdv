const Database = require('better-sqlite3');
const db = new Database('expenses-production.db');

console.log('📊 فحص expenses-production.db:\n');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(`الجداول (${tables.length}):`, tables.map(t => t.name).join(', '));

const hasClients = tables.some(t => t.name === 'clients');
const hasProjects = tables.some(t => t.name === 'projects');
const hasProjectItems = tables.some(t => t.name === 'project_items');
const hasExpectedExpenses = tables.some(t => t.name === 'expected_expenses');

console.log('\n📋 الجداول المهمة:');
if (hasClients) {
  const count = db.prepare('SELECT COUNT(*) as c FROM clients').get();
  console.log(`✅ clients - عدد العملاء: ${count.c}`);
  if (count.c > 0) {
    const sample = db.prepare('SELECT id, name FROM clients LIMIT 3').all();
    sample.forEach(c => console.log(`   - ${c.name}`));
  }
} else {
  console.log('❌ clients غير موجود');
}

if (hasProjects) {
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get();
  console.log(`✅ projects - عدد المشاريع: ${count.c}`);
} else {
  console.log('❌ projects غير موجود');
}

if (hasProjectItems) {
  const count = db.prepare('SELECT COUNT(*) as c FROM project_items').get();
  console.log(`✅ project_items - عدد التصنيفات: ${count.c}`);
} else {
  console.log('❌ project_items غير موجود');
}

if (hasExpectedExpenses) {
  const count = db.prepare('SELECT COUNT(*) as c FROM expected_expenses').get();
  console.log(`✅ expected_expenses - عدد الإنفاق المتوقع: ${count.c}`);
} else {
  console.log('❌ expected_expenses غير موجود');
}

db.close();
