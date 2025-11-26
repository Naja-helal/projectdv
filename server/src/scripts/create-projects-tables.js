const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../expenses.db');
const db = new Database(dbPath);

console.log('🚀 بدء إنشاء جداول المشاريع...');

try {
  // حذف الجداول القديمة إذا كانت موجودة
  db.exec(`DROP TABLE IF EXISTS project_items;`);
  db.exec(`DROP TABLE IF EXISTS projects;`);
  
  // إنشاء جدول المشاريع
  db.exec(`
    CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT UNIQUE,
      type TEXT NOT NULL,
      description TEXT,
      budget REAL NOT NULL DEFAULT 0,
      start_date INTEGER,
      end_date INTEGER,
      status TEXT DEFAULT 'active',
      color TEXT DEFAULT '#3b82f6',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('✅ تم إنشاء جدول projects');

  // إنشاء جدول بنود المشروع
  db.exec(`
    CREATE TABLE project_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      budget REAL NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ تم إنشاء جدول project_items');

  // إضافة حقل project_id لجدول expenses إذا لم يكن موجوداً
  try {
    db.exec(`
      ALTER TABLE expenses ADD COLUMN project_id INTEGER REFERENCES projects(id);
    `);
    console.log('✅ تم إضافة حقل project_id لجدول expenses');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️ حقل project_id موجود مسبقاً في جدول expenses');
    } else {
      throw error;
    }
  }

  // إضافة حقل project_item_id لجدول expenses إذا لم يكن موجوداً
  try {
    db.exec(`
      ALTER TABLE expenses ADD COLUMN project_item_id INTEGER REFERENCES project_items(id);
    `);
    console.log('✅ تم إضافة حقل project_item_id لجدول expenses');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️ حقل project_item_id موجود مسبقاً في جدول expenses');
    } else {
      throw error;
    }
  }

  // إضافة بيانات تجريبية
  console.log('📝 إضافة بيانات تجريبية...');

  const insertProject = db.prepare(`
    INSERT OR IGNORE INTO projects (name, code, type, description, budget, status, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const projects = [
    ['مسار – تجربة تبرع أو توقيع عمل', 'P001', 'مشاريع استراتيجية', 'مشروع استراتيجي لتطوير النظام', 75000, 'active', '#10b981'],
    ['إشارة تطويرية', 'P002', 'مشاريع تطويرية', 'مشروع تطويري للبنية التحتية', 75000, 'active', '#3b82f6'],
    ['أثر – تجربة تقييس الغائر أو النتائج', 'P003', 'مشاريع تنظيمية أو إدارية', 'مشروع لقياس الأثر والنتائج', 75000, 'active', '#8b5cf6'],
    ['نظطة – تجربة بسيطة أو بدائية مشروع', 'P004', 'مشاريع تطويرية أو تجريبية', 'مشروع تجريبي بسيط', 75000, 'active', '#f59e0b'],
    ['إعياض – تجربة سريعة أو قوية أو ذكية', 'P005', 'مشاريع تطويرية أو قيمية', 'مشروع سريع للتطوير', 75000, 'active', '#ef4444'],
    ['بوالة – تجربة أزيلة أو حوار فكرة', 'P006', 'أخرى', 'مشروع للحوار وتبادل الأفكار', 75000, 'active', '#06b6d4'],
    ['سنوق', 'P007', 'مشاريع استثمارية', 'مشروع استثماري', 95000, 'active', '#14b8a6']
  ];

  projects.forEach(project => {
    try {
      insertProject.run(...project);
    } catch (error) {
      console.log(`⚠️ المشروع ${project[0]} موجود مسبقاً`);
    }
  });

  console.log('✅ تم إضافة المشاريع التجريبية');

  // إضافة بنود تجريبية للمشروع الأول
  const insertItem = db.prepare(`
    INSERT OR IGNORE INTO project_items (project_id, name, budget, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const items = [
    [1, 'كوادر بشرية', 15000, 1],
    [1, 'أدوات ومعدات', 10000, 2],
    [1, 'بالية - سبرلة - كافي', 8000, 3],
    [1, 'آخرى', 5000, 4]
  ];

  items.forEach(item => {
    try {
      insertItem.run(...item);
    } catch (error) {
      console.log(`⚠️ البند ${item[1]} موجود مسبقاً`);
    }
  });

  console.log('✅ تم إضافة البنود التجريبية');

  console.log('🎉 تم إنشاء جداول المشاريع بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ في إنشاء الجداول:', error);
  process.exit(1);
} finally {
  db.close();
}
