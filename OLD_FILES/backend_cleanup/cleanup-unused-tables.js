const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'expenses.db');
const backupPath = path.join(__dirname, `expenses-backup-${Date.now()}.db`);

console.log('🧹 تنظيف قاعدة البيانات من الجداول الغير مستخدمة\n');

// إنشاء نسخة احتياطية
console.log('📦 إنشاء نسخة احتياطية...');
fs.copyFileSync(dbPath, backupPath);
console.log(`✅ تم حفظ النسخة الاحتياطية: ${path.basename(backupPath)}\n`);

const db = new Database(dbPath);

// قائمة الجداول المستخدمة فعلياً
const usedTables = [
  'clients',
  'projects',
  'expenses',
  'expected_expenses',
  'categories',
  'project_items',
  'payment_methods',
  'units'
];

// قائمة الجداول الغير مستخدمة (من الأنظمة القديمة)
const unusedTables = [
  'advance_attachments',
  'advance_payments',
  'bramawi_fields',
  'bramawi_records',
  'bramawi_values',
  'custom_fields',
  'custom_values',
  'distributions',
  'dynamic_fields',
  'dynamic_records',
  'employee_advances',
  'employees',
  'monthly_salaries',
  'mosques',
  'settings_new',
  'vendors'
];

console.log('📋 الجداول التي سيتم حذفها:\n');
unusedTables.forEach((table, index) => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
  console.log(`   ${index + 1}. ${table} (${count.count} سجل)`);
});

console.log('\n⚠️  انتظر 3 ثواني قبل البدء...\n');

setTimeout(() => {
  console.log('🚀 بدء عملية الحذف...\n');
  
  let deletedCount = 0;
  let failedCount = 0;
  
  unusedTables.forEach(table => {
    try {
      // إيقاف Foreign Key Constraints مؤقتاً
      db.prepare('PRAGMA foreign_keys = OFF').run();
      
      // حذف الجدول
      db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
      
      console.log(`✅ تم حذف: ${table}`);
      deletedCount++;
      
      // إعادة تفعيل Foreign Key Constraints
      db.prepare('PRAGMA foreign_keys = ON').run();
    } catch (error) {
      console.log(`❌ فشل حذف: ${table} - ${error.message}`);
      failedCount++;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 النتائج:`);
  console.log(`   ✅ تم حذف: ${deletedCount} جدول`);
  console.log(`   ❌ فشل: ${failedCount} جدول`);
  console.log('='.repeat(50) + '\n');
  
  // عرض الجداول المتبقية
  const remainingTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
  
  console.log('📋 الجداول المتبقية في قاعدة البيانات:\n');
  remainingTables.forEach((table, index) => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    const isUsed = usedTables.includes(table.name) ? '✅' : '⚠️';
    console.log(`   ${isUsed} ${index + 1}. ${table.name} (${count.count} سجل)`);
  });
  
  // تحسين قاعدة البيانات
  console.log('\n🔧 تحسين قاعدة البيانات...');
  db.prepare('VACUUM').run();
  console.log('✅ تم تحسين قاعدة البيانات\n');
  
  db.close();
  
  console.log('✅ اكتملت عملية التنظيف بنجاح!');
  console.log(`📦 النسخة الاحتياطية: ${path.basename(backupPath)}\n`);
}, 3000);
