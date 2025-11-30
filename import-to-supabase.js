// استيراد البيانات إلى Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ekezjmhpdzydiczspfsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZXpqbWhwZHp5ZGljenNwZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODU5MzcsImV4cCI6MjA4MDA2MTkzN30.WhOebC0eJ73ztpnRT0bUbyPdt9yvCkJN3EuyT7SAVPA';

const supabase = createClient(supabaseUrl, supabaseKey);

const data = JSON.parse(fs.readFileSync('./database-export.json', 'utf8'));

async function importData() {
  console.log('📊 بدء استيراد البيانات إلى Supabase...\n');

  // 1. Categories
  if (data.categories.length > 0) {
    const { error } = await supabase.from('categories').insert(data.categories);
    if (error) console.error('❌ Categories:', error.message);
    else console.log(`✅ Categories: ${data.categories.length}`);
  }

  // 2. Clients
  if (data.clients.length > 0) {
    const { error } = await supabase.from('clients').insert(data.clients);
    if (error) console.error('❌ Clients:', error.message);
    else console.log(`✅ Clients: ${data.clients.length}`);
  }

  // 3. Units
  if (data.units.length > 0) {
    const { error } = await supabase.from('units').insert(data.units);
    if (error) console.error('❌ Units:', error.message);
    else console.log(`✅ Units: ${data.units.length}`);
  }

  // 4. Payment Methods
  if (data.payment_methods.length > 0) {
    const { error } = await supabase.from('payment_methods').insert(data.payment_methods);
    if (error) console.error('❌ Payment Methods:', error.message);
    else console.log(`✅ Payment Methods: ${data.payment_methods.length}`);
  }

  // 5. Projects
  if (data.projects.length > 0) {
    const { error } = await supabase.from('projects').insert(data.projects);
    if (error) console.error('❌ Projects:', error.message);
    else console.log(`✅ Projects: ${data.projects.length}`);
  }

  // 6. Project Items
  if (data.project_items.length > 0) {
    const { error } = await supabase.from('project_items').insert(data.project_items);
    if (error) console.error('❌ Project Items:', error.message);
    else console.log(`✅ Project Items: ${data.project_items.length}`);
  }

  // 7. Expenses
  if (data.expenses.length > 0) {
    const { error } = await supabase.from('expenses').insert(data.expenses);
    if (error) console.error('❌ Expenses:', error.message);
    else console.log(`✅ Expenses: ${data.expenses.length}`);
  }

  // 8. Expected Expenses
  if (data.expected_expenses.length > 0) {
    const { error } = await supabase.from('expected_expenses').insert(data.expected_expenses);
    if (error) console.error('❌ Expected Expenses:', error.message);
    else console.log(`✅ Expected Expenses: ${data.expected_expenses.length}`);
  }

  console.log('\n✅ تم الاستيراد بنجاح!');
}

importData();
