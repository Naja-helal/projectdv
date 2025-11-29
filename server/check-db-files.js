const fs = require('fs');
const path = require('path');

console.log('🔍 فحص ملفات قاعدة البيانات على السيرفر...\n');

// فحص المسارات المختلفة
const pathsToCheck = [
  '/app/data/expenses.db',
  '/app/expenses.db',
  '/app/expenses-production.db',
  '/app/server/expenses.db',
  '/app/dist/expenses.db'
];

console.log('📂 المسارات المفحوصة:\n');

pathsToCheck.forEach(dbPath => {
  try {
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`✅ موجود: ${dbPath}`);
      console.log(`   الحجم: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   آخر تعديل: ${stats.mtime}\n`);
    } else {
      console.log(`❌ غير موجود: ${dbPath}\n`);
    }
  } catch (error) {
    console.log(`⚠️ خطأ في فحص ${dbPath}: ${error.message}\n`);
  }
});

// فحص جميع ملفات .db في /app
console.log('🔎 البحث عن جميع ملفات .db في /app:\n');
try {
  const findDbFiles = (dir) => {
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && !fullPath.includes('node_modules')) {
            findDbFiles(fullPath);
          } else if (file.endsWith('.db')) {
            const size = (stat.size / 1024).toFixed(2);
            console.log(`📄 ${fullPath} (${size} KB)`);
          }
        } catch (err) {
          // تجاهل الأخطاء في الملفات الفردية
        }
      });
    } catch (err) {
      // تجاهل الأخطاء في المجلدات
    }
  };
  
  findDbFiles('/app');
} catch (error) {
  console.log('⚠️ لا يمكن البحث في /app:', error.message);
}

console.log('\n✅ انتهى الفحص');
