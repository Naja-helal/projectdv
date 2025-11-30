const Database = require('better-sqlite3');
const db = new Database('expenses.db');

console.log('🔍 فحص أعمدة جدول expenses في قاعدة البيانات:\n');

const columns = db.pragma('table_info(expenses)');

console.log('الأعمدة الموجودة:');
console.log('================');
columns.forEach(col => {
  console.log(`✓ ${col.name.padEnd(20)} - نوع: ${col.type}`);
});

console.log('\n');
console.log('🔍 التحقق من الحقول المطلوبة:');
console.log('================================');
const hasDescription = columns.some(c => c.name === 'description');
const hasDetails = columns.some(c => c.name === 'details');

console.log(hasDescription ? '✅ حقل description موجود' : '❌ حقل description غير موجود');
console.log(hasDetails ? '✅ حقل details موجود' : '❌ حقل details غير موجود');

console.log('\n📊 إجمالي الأعمدة:', columns.length);

db.close();
