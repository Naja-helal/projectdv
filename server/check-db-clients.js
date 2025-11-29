const Database = require('better-sqlite3');
const path = require('path');

const dbFiles = [
  'tkamol.db',
  'expenses-production.db',
  'expenses-backup.db',
  'expenses-to-upload.db',
  'database.db'
];

console.log('🔍 فحص قواعد البيانات للعثور على النسخة التي تحتوي على عملاء...\n');

dbFiles.forEach(dbFile => {
  const dbPath = path.join(__dirname, dbFile);
  try {
    const db = new Database(dbPath);
    
    // فحص الجداول
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const hasClients = tables.some(t => t.name === 'clients');
    const hasProjects = tables.some(t => t.name === 'projects');
    const hasProjectItems = tables.some(t => t.name === 'project_items');
    
    console.log(`📂 ${dbFile}:`);
    console.log(`   الجداول: ${tables.length}`);
    
    if (hasClients) {
      const clientsCount = db.prepare('SELECT COUNT(*) as count FROM clients').get();
      console.log(`   ✅ جدول clients موجود - عدد العملاء: ${clientsCount.count}`);
    } else {
      console.log(`   ❌ جدول clients غير موجود`);
    }
    
    if (hasProjects) {
      const projectsCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
      console.log(`   ✅ جدول projects موجود - عدد المشاريع: ${projectsCount.count}`);
    }
    
    if (hasProjectItems) {
      const itemsCount = db.prepare('SELECT COUNT(*) as count FROM project_items').get();
      console.log(`   ✅ جدول project_items موجود - عدد التصنيفات: ${itemsCount.count}`);
    }
    
    console.log('');
    db.close();
  } catch (error) {
    console.log(`📂 ${dbFile}: ❌ ${error.message}\n`);
  }
});
