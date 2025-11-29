const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'expenses.db');
const db = new Database(dbPath);

console.log('🔄 إنشاء جدول تصنيفات المشاريع (project_items)...');

try {
  // إنشاء جدول project_items إذا لم يكن موجوداً
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT '📋',
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('✅ تم إنشاء جدول project_items');

  // إضافة تصنيفات المشاريع الأساسية
  const insertItem = db.prepare(`
    INSERT OR IGNORE INTO project_items (name, code, description, color, icon)
    VALUES (?, ?, ?, ?, ?)
  `);

  const items = [
    ['مسجد', 'MOSQUE', 'مشاريع المساجد', '#10b981', '🕌'],
    ['مدرسة', 'SCHOOL', 'مشاريع التعليم', '#3b82f6', '🏫'],
    ['مستشفى', 'HOSPITAL', 'مشاريع الصحة', '#ef4444', '🏥'],
    ['جمعية خيرية', 'CHARITY', 'مشاريع الجمعيات الخيرية', '#8b5cf6', '🤝'],
    ['مركز ثقافي', 'CULTURAL', 'مشاريع ثقافية', '#f59e0b', '🎭'],
    ['ملعب رياضي', 'SPORTS', 'مشاريع رياضية', '#06b6d4', '⚽'],
    ['حديقة عامة', 'PARK', 'مشاريع الحدائق', '#14b8a6', '🌳'],
    ['مكتبة', 'LIBRARY', 'مشاريع المكتبات', '#a855f7', '📚'],
  ];

  let count = 0;
  for (const item of items) {
    const result = insertItem.run(...item);
    if (result.changes > 0) {
      count++;
      console.log(`✅ تم إضافة تصنيف: ${item[0]}`);
    }
  }

  console.log(`\n✅ تم إضافة ${count} تصنيف للمشاريع`);

  // عرض جميع التصنيفات
  const allItems = db.prepare('SELECT * FROM project_items ORDER BY id').all();
  console.log('\n📂 تصنيفات المشاريع المتوفرة:');
  allItems.forEach(item => {
    console.log(`   ${item.icon} ${item.name} (${item.code})`);
  });

  console.log('\n🎉 تم إنشاء تصنيفات المشاريع بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
}
