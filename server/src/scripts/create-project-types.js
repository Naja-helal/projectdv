const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../expenses.db'));

console.log('🔄 إنشاء جدول أنواع المشاريع...');

try {
  // إنشاء جدول أنواع المشاريع
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_types (
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

  console.log('✅ تم إنشاء جدول أنواع المشاريع بنجاح');

  // إضافة أنواع مشاريع افتراضية
  const stmt = db.prepare(`
    INSERT INTO project_types (name, code, description, color, icon, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  const defaultTypes = [
    { name: 'مشروع إنشائي', code: 'CONST', description: 'مشاريع البناء والإنشاءات', color: '#f59e0b', icon: '🏗️' },
    { name: 'مشروع صيانة', code: 'MAINT', description: 'مشاريع الصيانة والترميم', color: '#8b5cf6', icon: '🔧' },
    { name: 'مشروع تطوير', code: 'DEV', description: 'مشاريع التطوير والتحديث', color: '#3b82f6', icon: '🚀' },
    { name: 'مشروع بنية تحتية', code: 'INFRA', description: 'مشاريع البنية التحتية', color: '#10b981', icon: '🛣️' },
    { name: 'مشروع استشاري', code: 'CONSULT', description: 'مشاريع استشارية وتخطيط', color: '#06b6d4', icon: '📊' },
    { name: 'مشروع تشغيلي', code: 'OPER', description: 'مشاريع التشغيل والخدمات', color: '#ef4444', icon: '⚙️' }
  ];

  for (const type of defaultTypes) {
    // تحقق من عدم وجود النوع
    const existing = db.prepare('SELECT id FROM project_types WHERE code = ?').get(type.code);
    if (!existing) {
      stmt.run(type.name, type.code, type.description, type.color, type.icon, now, now);
      console.log(`✅ تم إضافة نوع مشروع: ${type.name}`);
    }
  }

  console.log('✅ تم إضافة أنواع المشاريع الافتراضية');
  
  // عرض الأنواع المضافة
  const types = db.prepare('SELECT * FROM project_types ORDER BY name').all();
  console.log('\n📂 أنواع المشاريع المتوفرة:');
  types.forEach(type => {
    console.log(`   ${type.icon || '📂'} ${type.name} (${type.code || 'بدون كود'})`);
  });

} catch (error) {
  console.error('❌ خطأ في إنشاء جدول أنواع المشاريع:', error);
  process.exit(1);
}

db.close();
console.log('\n✅ تم إغلاق الاتصال بقاعدة البيانات');
