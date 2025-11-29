const Database = require('better-sqlite3');
const db = new Database('/app/data/expenses.db');

console.log('\n📊 فحص البيانات في قاعدة البيانات...\n');

try {
  // فحص الفئات
  const categories = db.prepare('SELECT * FROM categories').all();
  console.log('✅ Categories:', categories.length);
  categories.forEach(cat => console.log(`  - ${cat.name} (ID: ${cat.id})`));
  
  // فحص المشاريع
  const projects = db.prepare('SELECT * FROM projects').all();
  console.log('\n✅ Projects:', projects.length);
  projects.forEach(proj => console.log(`  - ${proj.name} (ID: ${proj.id})`));
  
  // فحص العملاء
  const clients = db.prepare('SELECT * FROM clients').all();
  console.log('\n✅ Clients:', clients.length);
  clients.forEach(client => console.log(`  - ${client.name} (ID: ${client.id})`));
  
  // فحص المصروفات
  const expenses = db.prepare('SELECT * FROM expenses LIMIT 5').all();
  console.log('\n✅ Expenses:', expenses.length, '(showing first 5)');
  
  // فحص الوحدات
  const units = db.prepare('SELECT * FROM units').all();
  console.log('\n✅ Units:', units.length);
  
  console.log('\n✅ قاعدة البيانات تحتوي على بيانات!');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
}

db.close();
