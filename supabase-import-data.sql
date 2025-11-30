-- إدخال البيانات من database-export.json إلى Supabase
-- قم بتنفيذ هذا الملف في SQL Editor في Supabase Dashboard

-- 1. حذف البيانات القديمة (إن وجدت)
TRUNCATE TABLE categories, clients, units, payment_methods, project_items RESTART IDENTITY CASCADE;

-- 2. إدخال التصنيفات (8 تصنيفات)
-- السكيما الفعلية: id, name, description, color, created_at
INSERT INTO categories (name, description, color) VALUES
('عمالة', NULL, '#ef4444'),
('Cursor', '', '#06b6d4'),
('المكتبة', 'مصاريف ورق حبر اي مشتريات من المكاتب', '#8b5cf6'),
('معدات', NULL, '#f59e0b'),
('مواصلات', NULL, '#ec4899'),
('سلة', 'موقع يقدم خدمة بيع المنتجات', '#ef4444'),
('مصاريف مساجد', 'بخشيش عمال المساجد', '#3b82f6'),
('Hostinger', 'إستضافة المشروع بالكامل', '#3b82f6');

-- 3. إدخال العملاء (1 عميل)
-- السكيما الفعلية: id, name, email, phone, address, notes, created_at
INSERT INTO clients (name, phone, email, address, notes) VALUES
('عميل تجريبي', '0500000000', NULL, NULL, 'عميل افتراضي للمشاريع التجريبية والقديمة');

-- 4. إدخال الوحدات (10 وحدات)
-- السكيما الفعلية: id, name, symbol, created_at
INSERT INTO units (name, symbol) VALUES
('قطعة', 'PCS'),
('كيس', 'BAG'),
('متر', 'M'),
('متر مربع', 'M2'),
('لتر', 'L'),
('كيلو', 'KG'),
('طن', 'TON'),
('كرتون', 'CTN'),
('صندوق', 'BOX'),
('علبة', 'PKG');

-- 5. إدخال طرق الدفع (6 طرق)
-- السكيما الفعلية: id, name, description, active, created_at
INSERT INTO payment_methods (name, description, active) VALUES
('نقداً', 'الدفع النقدي المباشر', true),
('تحويل بنكي', 'التحويل البنكي', true),
('شيك', 'الدفع بالشيك', true),
('بطاقة ائتمان', 'الدفع ببطاقة الائتمان', true),
('محفظة إلكترونية', 'المحافظ الإلكترونية', true),
('آجل', 'الدفع الآجل', true);

-- 6. التحقق من البيانات
SELECT 'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'units', COUNT(*) FROM units
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods;

-- يجب أن تحصل على:
-- categories: 8
-- clients: 1
-- units: 10
-- payment_methods: 6
