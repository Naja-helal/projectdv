const Database = require('better-sqlite3');
const db = new Database('./expenses.db');

const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='expenses'").get();
console.log('📋 تعريف جدول expenses:\n');
console.log(schema.sql);

db.close();
