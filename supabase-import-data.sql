-- إدخال البيانات من database-export.json إلى Supabase
-- قم بتنفيذ هذا الملف في SQL Editor في Supabase Dashboard

-- 1. حذف البيانات القديمة (إن وجدت)
TRUNCATE TABLE categories, clients, units, payment_methods, project_items RESTART IDENTITY CASCADE;

-- 2. إدخال التصنيفات (8 تصنيفات)
INSERT INTO categories (id, name, code, color, icon, description, created_at, updated_at) VALUES
(1, 'عمالة', 'labor', '#ef4444', '👷', NULL, 1757591303, 1757591303),
(3, 'Cursor', 'Cursor', '#06b6d4', '🌐', '', 1757591303, 1757701350),
(6, 'المكتبة', 'Library', '#8b5cf6', '🧱', 'مصاريف ورق حبر اي مشتريات من المكاتب', 1757591303, 1757701501),
(7, 'معدات', 'equipment', '#f59e0b', '🔧', NULL, 1757591303, 1757591303),
(8, 'مواصلات', 'transport', '#ec4899', '🚗', NULL, 1757591303, 1757591303),
(10, 'سلة', 'salla', '#ef4444', '🌐', 'موقع يقدم خدمة بيع المنتجات', 1757608883, 1757608883),
(19, 'مصاريف مساجد', 'mosque_expenses', '#3b82f6', '👷', 'بخشيش عمال المساجد', 1757701451, 1757701451),
(20, 'Hostinger 2', 'Hostinger', '#3b82f6', '', 'إستضافة المشروع بالكامل', 1757701620, 1764133203);

-- 3. إدخال العملاء (1 عميل)
INSERT INTO clients (id, name, code, phone, email, address, contact_person, tax_number, notes, color, icon, is_active, created_at, updated_at) VALUES
(1, 'عميل تجريبي', 'CLT-DEFAULT', '0500000000', NULL, NULL, NULL, NULL, 'عميل افتراضي للمشاريع التجريبية والقديمة', '#9ca3af', '🏢', 1, 1764458560, 1764458560);

-- 4. إدخال الوحدات (10 وحدات)
INSERT INTO units (id, name, code, description, color, icon, is_active, created_at, updated_at) VALUES
(1, 'قطعة', 'PCS', 'قطعة', '#3b82f6', '📦', 1, 1764204301531, 1764204301531),
(2, 'كيس', 'BAG', 'كيس', '#8b5cf6', '🎒', 1, 1764204301531, 1764204301531),
(3, 'متر', 'M', 'متر', '#10b981', '📏', 1, 1764204301531, 1764204301531),
(4, 'متر مربع', 'M2', 'متر مربع', '#06b6d4', '⬛', 1, 1764204301531, 1764204301531),
(5, 'لتر', 'L', 'لتر', '#0ea5e9', '🥤', 1, 1764204301531, 1764204301531),
(6, 'كيلو', 'KG', 'كيلوجرام', '#f59e0b', '⚖️', 1, 1764204301531, 1764204301531),
(7, 'طن', 'TON', 'طن', '#ef4444', '🏋️', 1, 1764204301531, 1764204301531),
(8, 'كرتون', 'CTN', 'كرتون', '#ec4899', '📦', 1, 1764204301531, 1764204301531),
(9, 'صندوق', 'BOX', 'صندوق', '#a855f7', '🗃️', 1, 1764204301531, 1764204301531),
(10, 'علبة', 'PKG', 'علبة', '#14b8a6', '📦', 1, 1764204301531, 1764204301531);

-- 5. إدخال طرق الدفع (6 طرق)
INSERT INTO payment_methods (id, name, code, description, color, icon, is_active, created_at, updated_at) VALUES
(1, 'نقداً', 'CASH', 'الدفع النقدي المباشر', '#10b981', '💵', 1, 1764111259074, 1764111259074),
(2, 'تحويل بنكي', 'BANK', 'التحويل البنكي', '#3b82f6', '🏦', 1, 1764111259074, 1764111259074),
(3, 'شيك', 'CHECK', 'الدفع بالشيك', '#8b5cf6', '📝', 1, 1764111259074, 1764111259074),
(4, 'بطاقة ائتمان', 'CREDIT', 'الدفع ببطاقة الائتمان', '#f59e0b', '💳', 1, 1764111259074, 1764111259074),
(5, 'محفظة إلكترونية', 'WALLET', 'المحافظ الإلكترونية', '#06b6d4', '📱', 1, 1764111259074, 1764111259074),
(6, 'آجل', 'DEFERRED', 'الدفع الآجل', '#ef4444', '⏰', 1, 1764111259074, 1764111259074);

-- 6. إدخال بنود المشاريع (1 بند)
INSERT INTO project_items (id, project_id, name, code, description, budget, sort_order, color, icon, unit, is_active, created_at, updated_at) VALUES
(1, NULL, '09', 'mt', 'mt', 0, 0, '#3b82f6', '📦', NULL, 1, 1764260470248, 1764260470248);

-- 7. تحديث sequences
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));
SELECT setval('units_id_seq', (SELECT MAX(id) FROM units));
SELECT setval('payment_methods_id_seq', (SELECT MAX(id) FROM payment_methods));
SELECT setval('project_items_id_seq', (SELECT MAX(id) FROM project_items));

-- 8. التحقق من البيانات
SELECT 'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'units', COUNT(*) FROM units
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'project_items', COUNT(*) FROM project_items;
