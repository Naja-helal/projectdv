const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'tkamol.db');
console.log(`Connecting to database: ${dbPath}`);
const db = new Database(dbPath);

try {
  // Check if columns exist first
  console.log('\n📋 Checking current expenses table structure...');
  const tableInfo = db.prepare('PRAGMA table_info(expenses)').all();
  console.log('Current columns:');
  tableInfo.forEach(col => console.log(`  - ${col.name} (${col.type})`));
  
  const hasReference = tableInfo.some(col => col.name === 'reference');
  const hasInvoiceNumber = tableInfo.some(col => col.name === 'invoice_number');
  
  if (!hasReference && !hasInvoiceNumber) {
    console.log('\n✅ Columns already removed. Nothing to do.');
    process.exit(0);
  }
  
  console.log('\n🔄 Creating backup...');
  const backupPath = path.join(__dirname, `tkamol_backup_${Date.now()}.db`);
  db.backup(backupPath);
  console.log(`✅ Backup created: ${backupPath}`);
  
  // SQLite doesn't support DROP COLUMN directly in older versions
  // We need to recreate the table without those columns
  console.log('\n🗑️  Removing unused columns (reference, invoice_number)...');
  
  db.exec(`
    BEGIN TRANSACTION;
    
    -- Create new table without unused columns
    CREATE TABLE expenses_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER,
      project_id INTEGER,
      project_item_id INTEGER,
      payment_method_id INTEGER,
      date INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      details TEXT,
      quantity REAL DEFAULT 1,
      unit_price REAL,
      tax_rate REAL DEFAULT 0.15,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (project_item_id) REFERENCES project_items(id) ON DELETE SET NULL,
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
    );
    
    -- Copy data from old table (excluding reference and invoice_number)
    INSERT INTO expenses_new (
      id, description, amount, category_id, project_id, project_item_id,
      payment_method_id, date, notes, created_at, details, quantity, 
      unit_price, tax_rate
    )
    SELECT 
      id, description, amount, category_id, project_id, project_item_id,
      payment_method_id, date, notes, created_at, details, quantity,
      unit_price, tax_rate
    FROM expenses;
    
    -- Drop old table
    DROP TABLE expenses;
    
    -- Rename new table
    ALTER TABLE expenses_new RENAME TO expenses;
    
    COMMIT;
  `);
  
  console.log('✅ Successfully removed unused columns!');
  
  // Verify the changes
  console.log('\n📋 Verifying new table structure...');
  const newTableInfo = db.prepare('PRAGMA table_info(expenses)').all();
  console.log('New columns:');
  newTableInfo.forEach(col => console.log(`  - ${col.name} (${col.type})`));
  
  // Check row count
  const count = db.prepare('SELECT COUNT(*) as count FROM expenses').get();
  console.log(`\n📊 Total expenses: ${count.count}`);
  
  console.log('\n✨ Database cleanup completed successfully!');
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\n⚠️  Database may be in inconsistent state. Please restore from backup if needed.');
  process.exit(1);
} finally {
  db.close();
}
