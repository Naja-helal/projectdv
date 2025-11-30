// تعديل رئيسي: استبدال api القديم بـ supabaseApi
// هذا الملف يحتوي على mapping بين الـ API القديم والجديد

export const apiMapping = {
  // Old API → New API
  'categoryApi.getCategories': 'categoriesApi.getAll',
  'categoryApi.createCategory': 'categoriesApi.create',
  'categoryApi.updateCategory': 'categoriesApi.update',
  'categoryApi.deleteCategory': 'categoriesApi.delete',
  
  'expenseApi.getExpenses': 'expensesApi.getAll',
  'expenseApi.createExpense': 'expensesApi.create',
  'expenseApi.updateExpense': 'expensesApi.update',
  'expenseApi.deleteExpense': 'expensesApi.delete',
  
  'projectApi.getProjects': 'projectsApi.getAll',
  'projectApi.createProject': 'projectsApi.create',
  'projectApi.updateProject': 'projectsApi.update',
  'projectApi.deleteProject': 'projectsApi.delete',
  
  'projectItemApi.getProjectItems': 'projectItemsApi.getAll',
  'projectItemApi.createProjectItem': 'projectItemsApi.create',
  'projectItemApi.updateProjectItem': 'projectItemsApi.update',
  'projectItemApi.deleteProjectItem': 'projectItemsApi.delete',
  
  'unitApi.getUnits': 'unitsApi.getAll',
  'unitApi.createUnit': 'unitsApi.create',
  'unitApi.updateUnit': 'unitsApi.update',
  'unitApi.deleteUnit': 'unitsApi.delete',
  
  'paymentMethodApi.getPaymentMethods': 'paymentMethodsApi.getAll',
  'paymentMethodApi.createPaymentMethod': 'paymentMethodsApi.create',
  'paymentMethodApi.updatePaymentMethod': 'paymentMethodsApi.update',
  'paymentMethodApi.deletePaymentMethod': 'paymentMethodsApi.delete',
  
  'clientApi.getClients': 'clientsApi.getAll',
  'clientApi.createClient': 'clientsApi.create',
  'clientApi.updateClient': 'clientsApi.update',
  'clientApi.deleteClient': 'clientsApi.delete',
};

// ملاحظات مهمة:
// 1. الآن كل الـ APIs في supabaseApi.ts
// 2. API القديم في lib/api.ts لم يعد يستخدم
// 3. Backend Express لم يعد ضرورياً
// 4. كل شي يتصل بـ Supabase مباشرة
