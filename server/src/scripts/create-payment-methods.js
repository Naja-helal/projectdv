const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../expenses.db'));

console.log('🔄 إنشاء جدول طرق الدفع...');

try {
  // إنشاء جدول طرق الدفع
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  console.log('✅ تم إنشاء جدول طرق الدفع بنجاح');

  // إضافة طرق دفع افتراضية
  const stmt = db.prepare(`
    INSERT INTO payment_methods (name, code, description, color, icon, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  const defaultMethods = [
    { name: 'نقداً', code: 'CASH', description: 'الدفع النقدي المباشر', color: '#10b981', icon: '💵' },
    { name: 'تحويل بنكي', code: 'BANK', description: 'التحويل البنكي', color: '#3b82f6', icon: '🏦' },
    { name: 'شيك', code: 'CHECK', description: 'الدفع بالشيك', color: '#8b5cf6', icon: '📝' },
    { name: 'بطاقة ائتمان', code: 'CREDIT', description: 'الدفع ببطاقة الائتمان', color: '#f59e0b', icon: '💳' },
    { name: 'محفظة إلكترونية', code: 'WALLET', description: 'المحافظ الإلكترونية', color: '#06b6d4', icon: '📱' },
    { name: 'آجل', code: 'DEFERRED', description: 'الدفع الآجل', color: '#ef4444', icon: '⏰' }
  ];

  for (const method of defaultMethods) {
    // تحقق من عدم وجود الطريقة
    const existing = db.prepare('SELECT id FROM payment_methods WHERE code = ?').get(method.code);
    if (!existing) {
      stmt.run(method.name, method.code, method.description, method.color, method.icon, now, now);
      console.log(`✅ تم إضافة طريقة دفع: ${method.name}`);
    }
  }

  console.log('✅ تم إضافة طرق الدفع الافتراضية');
  
  // عرض الطرق المضافة
  const methods = db.prepare('SELECT * FROM payment_methods ORDER BY name').all();
  console.log('\n💳 طرق الدفع المتوفرة:');
  methods.forEach(method => {
    console.log(`   ${method.icon || '💳'} ${method.name} (${method.code || 'بدون كود'})`);
  });

} catch (error) {
  console.error('❌ خطأ في إنشاء جدول طرق الدفع:', error);
  process.exit(1);
}

db.close();
console.log('\n✅ تم إغلاق الاتصال بقاعدة البيانات');
