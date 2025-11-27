const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../expenses.db'));

console.log('🔄 إنشاء جدول الوحدات...');

try {
  // إنشاء جدول الوحدات
  db.exec(`
    CREATE TABLE IF NOT EXISTS units (
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

  console.log('✅ تم إنشاء جدول الوحدات بنجاح');

  // إضافة وحدات افتراضية
  const stmt = db.prepare(`
    INSERT INTO units (name, code, description, color, icon, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  const defaultUnits = [
    { name: 'قطعة', code: 'PCS', description: 'قطعة', color: '#3b82f6', icon: '📦' },
    { name: 'كيس', code: 'BAG', description: 'كيس', color: '#8b5cf6', icon: '🎒' },
    { name: 'متر', code: 'M', description: 'متر', color: '#10b981', icon: '📏' },
    { name: 'متر مربع', code: 'M2', description: 'متر مربع', color: '#06b6d4', icon: '⬛' },
    { name: 'لتر', code: 'L', description: 'لتر', color: '#0ea5e9', icon: '🥤' },
    { name: 'كيلو', code: 'KG', description: 'كيلوجرام', color: '#f59e0b', icon: '⚖️' },
    { name: 'طن', code: 'TON', description: 'طن', color: '#ef4444', icon: '🏋️' },
    { name: 'كرتون', code: 'CTN', description: 'كرتون', color: '#ec4899', icon: '📦' },
    { name: 'صندوق', code: 'BOX', description: 'صندوق', color: '#a855f7', icon: '🗃️' },
    { name: 'علبة', code: 'PKG', description: 'علبة', color: '#14b8a6', icon: '📦' }
  ];

  for (const unit of defaultUnits) {
    // تحقق من عدم وجود الوحدة
    const existing = db.prepare('SELECT id FROM units WHERE code = ?').get(unit.code);
    if (!existing) {
      stmt.run(unit.name, unit.code, unit.description, unit.color, unit.icon, now, now);
      console.log(`✅ تم إضافة وحدة: ${unit.name}`);
    }
  }

  console.log('✅ تم إضافة الوحدات الافتراضية');
  
  // عرض الوحدات المضافة
  const units = db.prepare('SELECT * FROM units ORDER BY name').all();
  console.log('\n📏 الوحدات المتوفرة:');
  units.forEach(unit => {
    console.log(`   ${unit.icon || '📏'} ${unit.name} (${unit.code || 'بدون كود'})`);
  });

} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
}
