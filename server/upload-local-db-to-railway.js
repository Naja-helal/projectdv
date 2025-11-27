const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء عملية رفع قاعدة البيانات المحلية إلى Railway...\n');

// 1. التحقق من وجود قاعدة البيانات المحلية
const localDbPath = path.join(__dirname, 'expenses.db');
if (!fs.existsSync(localDbPath)) {
  console.error('❌ قاعدة البيانات المحلية غير موجودة في:', localDbPath);
  process.exit(1);
}

console.log('✅ تم العثور على قاعدة البيانات المحلية');
const stats = fs.statSync(localDbPath);
console.log(`📊 حجم القاعدة: ${(stats.size / 1024).toFixed(2)} KB\n`);

// 2. التحقق من تثبيت Railway CLI
try {
  execSync('railway --version', { stdio: 'ignore' });
  console.log('✅ Railway CLI مثبت');
} catch (error) {
  console.error('❌ Railway CLI غير مثبت');
  console.log('\n📥 قم بتثبيته باستخدام:');
  console.log('npm i -g @railway/cli');
  console.log('\nأو:');
  console.log('powershell -c "irm https://railway.app/install.ps1 | iex"');
  process.exit(1);
}

// 3. التحقق من تسجيل الدخول
try {
  execSync('railway whoami', { stdio: 'pipe' });
  console.log('✅ مسجل دخول في Railway');
} catch (error) {
  console.error('❌ غير مسجل دخول في Railway');
  console.log('\n🔐 قم بتسجيل الدخول:');
  console.log('railway login');
  process.exit(1);
}

// 4. نسخ قاعدة البيانات للرفع
const uploadDbPath = path.join(__dirname, 'expenses-to-upload.db');
fs.copyFileSync(localDbPath, uploadDbPath);
console.log('✅ تم تجهيز ملف الرفع\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 الخطوات التالية لرفع القاعدة:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('الطريقة 1️⃣: رفع مباشر عبر Railway Shell (الأسهل)\n');
console.log('1. افتح Railway Shell:');
console.log('   railway shell\n');
console.log('2. داخل Railway Shell، احذف القاعدة القديمة:');
console.log('   rm -f expenses.db\n');
console.log('3. اخرج من Shell:');
console.log('   exit\n');
console.log('4. ارفع القاعدة الجديدة:');
console.log('   railway up expenses-to-upload.db:expenses.db\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('الطريقة 2️⃣: استخدام Railway Volume (الموصى بها)\n');
console.log('1. اذهب إلى Railway Dashboard:');
console.log('   https://railway.app\n');
console.log('2. افتح مشروعك > Settings > Volumes\n');
console.log('3. إذا لم يكن لديك Volume، أضف واحد جديد:\n');
console.log('   - اسم Volume: database-volume');
console.log('   - Mount Path: /app/data\n');
console.log('4. في Variables، غير DB_PATH إلى:');
console.log('   DB_PATH=/app/data/expenses.db\n');
console.log('5. ارفع الملف expenses-to-upload.db إلى Volume\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('الطريقة 3️⃣: إعادة نشر مع قاعدة البيانات الجديدة\n');
console.log('1. انسخ expenses.db إلى expenses-production.db:');
console.log('   copy expenses.db expenses-production.db\n');
console.log('2. Commit & Push:');
console.log('   git add .');
console.log('   git commit -m "Update production database"');
console.log('   git push\n');
console.log('3. Railway سيعيد النشر تلقائياً\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️ تحذير هام:');
console.log('- تأكد من عمل backup لقاعدة البيانات على Railway قبل الاستبدال');
console.log('- الطريقة 2 (Volume) هي الأفضل للاستمرارية');
console.log('- بعد الرفع، اختبر الموقع للتأكد من عمل كل شيء\n');

console.log('✅ ملف الرفع جاهز في:', uploadDbPath);
