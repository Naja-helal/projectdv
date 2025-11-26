// اختبار API endpoint مباشرة على Railway
const API_URL = 'https://projectdv-production.up.railway.app/api';

async function testCreateExpense() {
  console.log('🧪 اختبار إضافة مصروف على Railway...\n');

  // بيانات تجريبية
  const expenseData = {
    categoryId: 1,
    amount: 100,
    date: Date.now(),
    description: 'اختبار من السكريبت',
    details: 'تفاصيل الاختبار'
  };

  console.log('📤 البيانات المرسلة:', JSON.stringify(expenseData, null, 2));

  try {
    const response = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData)
    });

    console.log('\n📊 حالة الاستجابة:', response.status, response.statusText);

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ نجح الاختبار!');
      console.log('📄 النتيجة:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ فشل الاختبار!');
      console.log('📄 الخطأ:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
  }
}

// تشغيل الاختبار
testCreateExpense();
