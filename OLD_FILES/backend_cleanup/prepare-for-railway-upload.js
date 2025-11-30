const Database = require('better-sqlite3');
const path = require('path');
const https = require('https');
const fs = require('fs');

console.log('📤 رفع قاعدة البيانات المنظفة إلى Railway\n');

const localDbPath = path.join(__dirname, 'expenses.db');
const railwayUploadPath = path.join(__dirname, 'expenses-to-upload-cleaned.db');

// نسخ القاعدة المنظفة
console.log('📋 تحضير قاعدة البيانات للرفع...');
fs.copyFileSync(localDbPath, railwayUploadPath);

const db = new Database(railwayUploadPath, { readonly: true });

// عرض ملخص الجداول
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all();

console.log(`\n✅ قاعدة البيانات جاهزة للرفع:`);
console.log(`   📊 عدد الجداول: ${tables.length}`);
console.log(`   📁 الملف: ${path.basename(railwayUploadPath)}`);

tables.forEach((table, index) => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
  console.log(`   ${index + 1}. ${table.name} (${count.count} سجل)`);
});

const stats = fs.statSync(railwayUploadPath);
console.log(`\n   📦 حجم الملف: ${(stats.size / 1024).toFixed(2)} KB`);

db.close();

console.log('\n📝 خطوات الرفع إلى Railway:');
console.log('   1. افتح Railway Dashboard');
console.log('   2. اذهب إلى مشروعك');
console.log('   3. اختر Variables');
console.log('   4. ارفع الملف: expenses-to-upload-cleaned.db');
console.log('   5. أعد تشغيل السيرفر');
console.log('\n✅ أو استخدم Railway CLI:');
console.log(`   railway up ${railwayUploadPath}`);
