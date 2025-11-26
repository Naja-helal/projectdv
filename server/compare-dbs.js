const Database = require('better-sqlite3');

console.log('\n=== database.db ===');
try {
  const db1 = new Database('database.db');
  const tables1 = db1.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('الجداول:', tables1.length);
  tables1.forEach(t => console.log('  -', t.name));
  
  // عد السجلات
  const expenses1 = db1.prepare("SELECT COUNT(*) as count FROM expenses").get();
  const projects1 = db1.prepare("SELECT COUNT(*) as count FROM projects").get();
  console.log('\nالسجلات:');
  console.log('  - المصروفات:', expenses1.count);
  console.log('  - المشاريع:', projects1.count);
  db1.close();
} catch (err) {
  console.log('خطأ:', err.message);
}

console.log('\n=== expenses.db ===');
try {
  const db2 = new Database('expenses.db');
  const tables2 = db2.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('الجداول:', tables2.length);
  tables2.forEach(t => console.log('  -', t.name));
  
  // عد السجلات
  const expenses2 = db2.prepare("SELECT COUNT(*) as count FROM expenses").get();
  const projects2 = db2.prepare("SELECT COUNT(*) as count FROM projects").get();
  console.log('\nالسجلات:');
  console.log('  - المصروفات:', expenses2.count);
  console.log('  - المشاريع:', projects2.count);
  db2.close();
} catch (err) {
  console.log('خطأ:', err.message);
}
