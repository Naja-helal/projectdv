const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'expenses.db');
const db = new Database(dbPath);

console.log('🔄 إضافة الأعمدة المفقودة...\n');

try {
  // إضافة أعمدة لجدول expenses
  try {
    db.exec('ALTER TABLE expenses ADD COLUMN project_id INTEGER REFERENCES projects(id)');
    console.log('✅ تم إضافة عمود project_id لجدول expenses');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('⚠️ عمود project_id موجود مسبقاً');
  }

  // إضافة أعمدة لجدول projects
  try {
    db.exec('ALTER TABLE projects ADD COLUMN expected_spending REAL DEFAULT 0');
    console.log('✅ تم إضافة عمود expected_spending لجدول projects');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('⚠️ عمود expected_spending موجود مسبقاً');
  }

  try {
    db.exec('ALTER TABLE projects ADD COLUMN actual_spending REAL DEFAULT 0');
    console.log('✅ تم إضافة عمود actual_spending لجدول projects');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('⚠️ عمود actual_spending موجود مسبقاً');
  }

  // إضافة أعمدة لجدول expected_expenses
  try {
    db.exec('ALTER TABLE expected_expenses ADD COLUMN tax_amount REAL DEFAULT 0');
    console.log('✅ تم إضافة عمود tax_amount لجدول expected_expenses');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('⚠️ عمود tax_amount موجود مسبقاً');
  }

  try {
    db.exec('ALTER TABLE expected_expenses ADD COLUMN total_amount REAL DEFAULT 0');
    console.log('✅ تم إضافة عمود total_amount لجدول expected_expenses');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('⚠️ عمود total_amount موجود مسبقاً');
  }

  console.log('\n🎉 تم إضافة جميع الأعمدة المطلوبة!');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
}
