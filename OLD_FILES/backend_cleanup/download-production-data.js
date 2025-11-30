const https = require('https');
const fs = require('fs');
const Database = require('better-sqlite3');

const API_URL = 'https://projectdv-production.up.railway.app';

console.log('🔄 تنزيل البيانات من السيرفر...\n');

async function fetchData(endpoint) {
  return new Promise((resolve, reject) => {
    https.get(`${API_URL}${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    // إنشاء قاعدة بيانات جديدة
    const db = new Database('expenses-from-production.db');
    
    // إنشاء الجداول
    console.log('📋 إنشاء الجداول...');
    
    // تشغيل سكريبت init-db
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('node dist/scripts/init-db.js', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    console.log('✅ تم إنشاء الجداول');
    
    // تنزيل البيانات من الإنتاج
    console.log('\n📥 تنزيل البيانات من الإنتاج...');
    
    const endpoints = [
      { name: 'العملاء', path: '/api/clients', table: 'clients' },
      { name: 'المشاريع', path: '/api/projects', table: 'projects' },
      { name: 'الفئات', path: '/api/categories', table: 'categories' },
      { name: 'المصروفات', path: '/api/expenses', table: 'expenses' },
      { name: 'تصنيفات المشاريع', path: '/api/project-items', table: 'project_items' },
      { name: 'طرق الدفع', path: '/api/payment-methods', table: 'payment_methods' },
      { name: 'الوحدات', path: '/api/units', table: 'units' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`  - جاري تنزيل ${endpoint.name}...`);
        const data = await fetchData(endpoint.path);
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log(`    ✅ تم تنزيل ${data.length} من ${endpoint.name}`);
        } else {
          console.log(`    ⚠️ لا توجد بيانات في ${endpoint.name}`);
        }
      } catch (error) {
        console.log(`    ❌ خطأ في تنزيل ${endpoint.name}: ${error.message}`);
      }
    }
    
    db.close();
    console.log('\n🎉 تم تنزيل البيانات بنجاح!');
    console.log('📁 الملف: expenses-from-production.db');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

main();
