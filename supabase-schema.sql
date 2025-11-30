-- =====================================================
-- Supabase Database Schema
-- تحويل من SQLite إلى PostgreSQL
-- =====================================================

-- 1. جدول الفئات (Categories)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول العملاء (Clients)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول المشاريع (Projects)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  budget DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول الوحدات (Units)
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  symbol VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. جدول عناصر المشاريع (Project Items)
CREATE TABLE IF NOT EXISTS project_items (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  unit_price DECIMAL(15, 2) DEFAULT 0,
  total_price DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. جدول طرق الدفع (Payment Methods)
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول المصروفات (Expenses)
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  project_item_id INTEGER REFERENCES project_items(id) ON DELETE SET NULL,
  payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. جدول المصروفات المتوقعة (Expected Expenses)
CREATE TABLE IF NOT EXISTS expected_expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  estimated_amount DECIMAL(15, 2) NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  project_item_id INTEGER REFERENCES project_items(id) ON DELETE SET NULL,
  expected_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- الفهارس لتحسين الأداء
-- =====================================================

CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_project ON expenses(project_id);
CREATE INDEX idx_expenses_project_item ON expenses(project_item_id);

CREATE INDEX idx_expected_date ON expected_expenses(expected_date);
CREATE INDEX idx_expected_category ON expected_expenses(category_id);
CREATE INDEX idx_expected_project ON expected_expenses(project_id);

CREATE INDEX idx_project_items_project ON project_items(project_id);
CREATE INDEX idx_projects_client ON projects(client_id);

-- =====================================================
-- Row Level Security (RLS) - اختياري
-- =====================================================

-- يمكن تفعيل RLS لاحقاً حسب الحاجة
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT USING (true);
