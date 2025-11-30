-- تعطيل RLS (Row Level Security) لجميع الجداول
-- هذا يسمح بالقراءة والكتابة من أي مكان بدون مصادقة

-- تعطيل RLS لجميع الجداول
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE expected_expenses DISABLE ROW LEVEL SECURITY;

-- التحقق من حالة RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
