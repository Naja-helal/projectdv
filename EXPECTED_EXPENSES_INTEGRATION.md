# تكامل نظام الإنفاق المتوقع الجديد

## نظرة عامة
تم استبدال جميع مراجع حقل `expected_spending` القديم في قاعدة البيانات بحسابات ديناميكية من جدول `expected_expenses` الجديد. هذا يضمن أن أي إضافة أو تعديل في صفحة "الإنفاق المتوقع" ينعكس فوراً في جميع الأماكن التي تعرض الإنفاق المتوقع.

## التغييرات التي تم إجراؤها

### 1. صفحة المشاريع (ProjectsPage.tsx)

#### التغييرات في الإحصائيات (Statistics Calculation)
```typescript
// تم إضافة دالة حساب الإنفاق المتوقع لكل مشروع
const calculateProjectExpectedSpending = (projectId: number) => {
  return allExpectedExpenses
    .filter(exp => exp.project_id === projectId)
    .reduce((sum, exp) => sum + exp.amount, 0);
};

// تم تحديث حساب إجمالي الإنفاق المتوقع
totalExpectedSpending: filteredProjects.reduce((sum, p) => 
  sum + calculateProjectExpectedSpending(p.id), 0
)
```

#### التغييرات في عرض بطاقات المشاريع
```typescript
// تم إضافة حساب الإنفاق المتوقع لكل بطاقة مشروع
const projectExpectedExpenses = allExpectedExpenses.filter(exp => exp.project_id === project.id);
const expectedSpending = projectExpectedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

// تم استبدال project.expected_spending بالقيمة المحسوبة
<p className="text-base sm:text-lg font-bold text-indigo-600">
  {expectedSpending.toLocaleString()} ر.س
</p>

// تم تحديث حساب الربح المتوقع
<p className="text-base sm:text-lg font-bold text-emerald-600">
  {((project.budget || 0) - expectedSpending).toLocaleString()} ر.س
</p>
```

### 2. صفحة تفاصيل المشروع (ProjectDetailsPage.tsx)

#### إضافة حساب الإنفاق المتوقع
```typescript
// تم إضافة حساب الإنفاق المتوقع من جدول expected_expenses
const expectedSpending = expectedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
```

#### التغييرات في البطاقات الإحصائية
```typescript
// بطاقة الإنفاق المتوقع
<p className="text-3xl font-bold text-indigo-600">
  {expectedSpending.toLocaleString()}
</p>

// بطاقة الربح المتوقع
<p className="text-3xl font-bold text-emerald-600">
  {((project.budget || 0) - expectedSpending).toLocaleString()}
</p>
```

### 3. صفحة الإحصائيات (StatisticsPage.tsx)

#### تحديث حساب إجمالي الإنفاق المتوقع
```typescript
// قبل التعديل: كان يقرأ من project.expected_spending
const totalExpected = useMemo(() => {
  const projectsToCalc = selectedProjectId 
    ? projects.filter(p => p.id === selectedProjectId)
    : projects;
  return projectsToCalc.reduce((sum, p) => sum + (p.expected_spending || 0), 0);
}, [projects, selectedProjectId]);

// بعد التعديل: يحسب من جدول expected_expenses
const totalExpected = useMemo(() => {
  let filtered = expectedExpenses;
  
  if (selectedProjectId) {
    filtered = filtered.filter(exp => exp.project_id === selectedProjectId);
  }
  
  return filtered.reduce((sum, exp) => sum + exp.amount, 0);
}, [expectedExpenses, selectedProjectId]);
```

#### تحديث بيانات تفاصيل المشاريع
```typescript
// تم إضافة حساب الإنفاق المتوقع لكل مشروع في جدول تفاصيل المشاريع
const projectExpectedExpenses = expectedExpenses.filter(exp => exp.project_id === project.id);
const expectedSpending = projectExpectedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

return {
  // ... باقي البيانات
  expected: expectedSpending, // بدلاً من project.expected_spending
  // ...
};
```

## ملفات أخرى تم تحديثها مسبقاً

### 1. صفحة الرسوم البيانية (ChartsPage.tsx)
- تم تحديث `budgetComparisonData` لحساب الإنفاق المتوقع من `expectedExpenses`
- الرسم البياني للمقارنة يعرض 3 أشرطة: الميزانية، الإنفاق الفعلي، الإنفاق المتوقع

### 2. نموذج إضافة/تعديل المشروع (ProjectForm.tsx)
- تم إزالة حقل `expected_spending` من النموذج
- المستخدم الآن يضيف الإنفاق المتوقع عبر صفحة "الإنفاق المتوقع" المخصصة

## الفوائد

### 1. دقة البيانات
- البيانات المعروضة تعكس دائماً إجمالي المصاريف المتوقعة الفعلية من قاعدة البيانات
- لا حاجة للاعتماد على حقل منفصل قد يكون غير متزامن

### 2. الشفافية
- المستخدم يمكنه رؤية تفاصيل كل مصروف متوقع في جدول الإنفاق المتوقع
- كل إضافة أو حذف أو تعديل ينعكس فوراً في جميع الصفحات

### 3. التناسق
- نفس منطق الحساب يستخدم في جميع الصفحات
- لا توجد تناقضات بين الصفحات المختلفة

### 4. الصيانة
- منطق واحد للحساب يسهل الصيانة والتحديث
- إذا احتجنا تعديل طريقة الحساب، نعدلها في مكان واحد

## الاختبار

### السيناريوهات المطلوب اختبارها:

1. **إضافة مصروف متوقع جديد**
   - اذهب إلى صفحة "الإنفاق المتوقع"
   - أضف مصروف متوقع لمشروع معين
   - تحقق من ظهور المبلغ في:
     - بطاقة المشروع في صفحة المشاريع
     - تفاصيل المشروع في صفحة تفاصيل المشروع
     - صفحة الإحصائيات
     - صفحة الرسوم البيانية

2. **تعديل مصروف متوقع**
   - عدّل مبلغ مصروف متوقع موجود
   - تحقق من تحديث المبلغ في جميع الصفحات

3. **حذف مصروف متوقع**
   - احذف مصروف متوقع
   - تحقق من انخفاض الإنفاق المتوقع في جميع الصفحات

4. **الفلترة حسب المشروع**
   - في صفحة الإحصائيات، اختر مشروع معين
   - تحقق من أن الإنفاق المتوقع يعرض فقط لهذا المشروع

5. **حساب الربح المتوقع**
   - تحقق من أن الربح المتوقع = الميزانية - الإنفاق المتوقع المحسوب
   - في بطاقات المشاريع وتفاصيل المشروع

## الملاحظات الفنية

### Backend
- الـ Backend لا يزال يحدّث حقل `project.expected_spending` تلقائياً
- هذا يوفر backup إذا احتجنا العودة للنظام القديم
- الحقل موجود في قاعدة البيانات لكن Frontend لا يقرأه

### التوافقية
- نوع البيانات `Project` لا يزال يحتوي على `expected_spending?`
- هذا للتوافق مع استجابات API من Backend
- Frontend يتجاهل هذا الحقل ويحسب القيمة من `expected_expenses`

### الأداء
- يتم جلب جميع `expected_expenses` مرة واحدة
- الحساب يتم في الذاكرة (client-side)
- استخدام `useMemo` للتخزين المؤقت يمنع الحسابات المتكررة

## الخطوات القادمة

1. **الاختبار الشامل**: تأكد من أن جميع السيناريوهات تعمل كما هو متوقع
2. **Build**: بناء Frontend للإنتاج
3. **Deploy**: نشر التحديثات على Netlify و Railway
4. **المراقبة**: متابعة أي مشاكل أو أخطاء بعد النشر

## التراجع (Rollback)

إذا كانت هناك مشاكل، يمكن التراجع بسرعة عن طريق:

```typescript
// في كل صفحة، استبدل الحساب الديناميكي بـ:
const expectedSpending = project.expected_spending || 0;
```

لكن هذا غير مستحسن لأن الحقل القديم لن يكون محدّثاً إذا لم يستخدم المستخدم صفحة الإنفاق المتوقع.
