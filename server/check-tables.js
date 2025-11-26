const Database = require('better-sqlite3');
const db = new Database('./expenses.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('الجداول الموجودة:');
console.log(JSON.stringify(tables, null, 2));

db.close();
