const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'expenses.db');
const db = new Database(dbPath);

console.log('🔄 تحديث جدول المصروفات بحقول الكمية وسعر الوحدة...');

try {
  // إضافة حقل الكمية (quantity)
  try {
    db.exec(`ALTER TABLE expenses ADD COLUMN quantity REAL DEFAULT 1;`);
    console.log('✅ تم إضافة حقل quantity');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ حقل quantity موجود بالفعل');
    } else {
      throw error;
    }
  }

  // إضافة حقل سعر الوحدة (unit_price)
  try {
    db.exec(`ALTER TABLE expenses ADD COLUMN unit_price REAL DEFAULT 0;`);
    console.log('✅ تم إضافة حقل unit_price');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ حقل unit_price موجود بالفعل');
    } else {
      throw error;
    }
  }

  // إضافة حقل الوحدة (unit) مثل: قطعة، متر، كيس، إلخ
  try {
    db.exec(`ALTER TABLE expenses ADD COLUMN unit TEXT DEFAULT 'قطعة';`);
    console.log('✅ تم إضافة حقل unit');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ حقل unit موجود بالفعل');
    } else {
      throw error;
    }
  }

  // تحديث المصروفات الموجودة
  console.log('🔄 تحديث المصروفات الموجودة...');
  
  const updateStmt = db.prepare(`
    UPDATE expenses 
    SET quantity = 1,
        unit_price = amount,
        unit = 'قطعة'
    WHERE quantity IS NULL OR quantity = 0
  `);
  
  const result = updateStmt.run();
  console.log(`✅ تم تحديث ${result.changes} مصروف`);
  
  console.log('\n✅ تم تحديث جدول المصروفات بنجاح!');
  console.log('📊 الآن يمكنك استخدام:');
  console.log('   - quantity: الكمية (مثال: 10)');
  console.log('   - unit_price: سعر الوحدة (مثال: 250)');
  console.log('   - unit: نوع الوحدة (مثال: قطعة، متر، كيس)');
  console.log('   - amount: سيتم حسابه تلقائياً = quantity × unit_price');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
} finally {
  db.close();
  console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
}
