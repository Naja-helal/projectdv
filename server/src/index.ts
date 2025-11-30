import express from "express";
import Database from "better-sqlite3";
import cors from "cors";
import compression from "compression";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

// تحميل متغيرات البيئة
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}

// إنشاء التطبيق
const app = express();
const PORT = process.env.PORT || 5175;

// إعداد قاعدة البيانات
const dbPath = process.env.DB_PATH || path.join(__dirname, "../expenses.db");

// إنشاء المجلد إذا لم يكن موجوداً
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✅ تم إنشاء مجلد قاعدة البيانات: ${dbDir}`);
}

// نسخ قاعدة البيانات الأولية في بيئة الإنتاج
if (process.env.NODE_ENV === 'production') {
  const sourceDb = path.join(__dirname, "../expenses-production.db");
  if (fs.existsSync(sourceDb)) {
    console.log(`📋 نسخ قاعدة البيانات من: ${sourceDb}`);
    console.log(`📂 إلى: ${dbPath}`);
    
    // حذف القاعدة القديمة إذا كانت موجودة
    if (fs.existsSync(dbPath)) {
      console.log(`🗑️ حذف قاعدة البيانات القديمة...`);
      fs.unlinkSync(dbPath);
    }
    
    fs.copyFileSync(sourceDb, dbPath);
    console.log(`✅ تم نسخ قاعدة البيانات بنجاح`);
  } else {
    console.log(`⚠️ لم يتم العثور على: ${sourceDb}`);
  }
}

const db = new Database(dbPath);

// تحديث schema تلقائياً عند بدء التشغيل
try {
  console.log('🔧 بدء Auto-Migration...');
  
  // ===== إنشاء الجداول الأساسية إذا لم تكن موجودة =====
  
  // 1. جدول الفئات
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT,
      description TEXT,
      created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
    )
  `);
  
  // 2. جدول طرق الدفع
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
    )
  `);
  
  // 3. جدول العملاء
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      contact_person TEXT,
      tax_number TEXT,
      notes TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT '👤',
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
    )
  `);
  
  // 4. جدول تصنيفات المشاريع
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      budget REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT '📋',
      unit TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
    )
  `);
  
  // 5. جدول المشاريع
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      type TEXT DEFAULT 'استراتيجية',
      description TEXT,
      budget REAL DEFAULT 0,
      expected_spending REAL DEFAULT 0,
      start_date INTEGER,
      end_date INTEGER,
      status TEXT DEFAULT 'active',
      color TEXT DEFAULT '#3b82f6',
      created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      project_item_id INTEGER,
      client_id INTEGER DEFAULT 1,
      FOREIGN KEY (project_item_id) REFERENCES project_items(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);
  
  // 6. جدول المصروفات
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      details TEXT,
      notes TEXT,
      category_id INTEGER NOT NULL,
      project_id INTEGER,
      project_item_id INTEGER,
      unit_id INTEGER,
      quantity REAL DEFAULT 1,
      unit_price REAL,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      payment_method_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (project_item_id) REFERENCES project_items(id),
      FOREIGN KEY (unit_id) REFERENCES units(id),
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
    )
  `);
  
  // 7. جدول الإنفاق المتوقع
  db.exec(`
    CREATE TABLE IF NOT EXISTS expected_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      project_id INTEGER,
      project_item_id INTEGER,
      quantity REAL DEFAULT 1,
      unit_price REAL,
      unit_id INTEGER,
      amount REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL,
      payment_method_id INTEGER,
      date INTEGER NOT NULL,
      description TEXT,
      details TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (project_item_id) REFERENCES project_items(id),
      FOREIGN KEY (unit_id) REFERENCES units(id),
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
    )
  `);
  
  console.log('✅ تم التأكد من وجود جميع الجداول الأساسية');
  
  // ===== إضافة بيانات افتراضية للجداول الفارغة =====
  
  // فحص وإضافة الوحدات الافتراضية
  const unitsCount = db.prepare('SELECT COUNT(*) as count FROM units').get() as { count: number };
  if (unitsCount.count === 0) {
    console.log('📦 إضافة الوحدات الافتراضية...');
    const units = [
      { name: 'قطعة', code: 'PCS', description: 'قطعة واحدة', color: '#3b82f6', icon: '📦' },
      { name: 'كيس', code: 'BAG', description: 'كيس واحد', color: '#8b5cf6', icon: '🎒' },
      { name: 'متر', code: 'M', description: 'متر واحد', color: '#10b981', icon: '📏' },
      { name: 'متر مربع', code: 'M2', description: 'متر مربع واحد', color: '#06b6d4', icon: '⬛' },
      { name: 'لتر', code: 'L', description: 'لتر واحد', color: '#0ea5e9', icon: '🥤' },
      { name: 'كيلو', code: 'KG', description: 'كيلوجرام واحد', color: '#f59e0b', icon: '⚖️' },
      { name: 'طن', code: 'TON', description: 'طن واحد', color: '#ef4444', icon: '🏋️' },
      { name: 'كرتون', code: 'CTN', description: 'كرتون واحد', color: '#ec4899', icon: '📦' },
      { name: 'صندوق', code: 'BOX', description: 'صندوق واحد', color: '#a855f7', icon: '🗃️' },
      { name: 'علبة', code: 'PKG', description: 'علبة واحدة', color: '#14b8a6', icon: '📦' }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO units (name, code, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const unit of units) {
      stmt.run(unit.name, unit.code, unit.description, unit.color, unit.icon);
    }
    console.log('✅ تم إضافة 10 وحدات افتراضية');
  }
  
  // فحص وإضافة طرق الدفع الافتراضية
  const pmCount = db.prepare('SELECT COUNT(*) as count FROM payment_methods').get() as { count: number };
  if (pmCount.count === 0) {
    console.log('💳 إضافة طرق الدفع الافتراضية...');
    const paymentMethods = [
      { name: 'نقدي', code: 'CASH', description: 'دفع نقدي', color: '#10b981', icon: '💵' },
      { name: 'بنك الراجحي', code: 'RAJHI', description: 'تحويل بنك الراجحي', color: '#3b82f6', icon: '🏦' },
      { name: 'بنك الأهلي', code: 'AHLI', description: 'تحويل بنك الأهلي', color: '#059669', icon: '🏦' },
      { name: 'شيك', code: 'CHECK', description: 'دفع بشيك', color: '#f59e0b', icon: '📝' },
      { name: 'بطاقة ائتمان', code: 'CREDIT', description: 'بطاقة ائتمان', color: '#ef4444', icon: '💳' },
      { name: 'STC Pay', code: 'STC', description: 'محفظة STC Pay', color: '#8b5cf6', icon: '📱' }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO payment_methods (name, code, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const pm of paymentMethods) {
      stmt.run(pm.name, pm.code, pm.description, pm.color, pm.icon);
    }
    console.log('✅ تم إضافة 6 طرق دفع افتراضية');
  }
  
  // فحص وإضافة الفئات الافتراضية
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    console.log('🏷️ إضافة الفئات الافتراضية...');
    const categories = [
      { name: 'رواتب', code: 'SAL', description: 'رواتب الموظفين', color: '#3b82f6', icon: '💼' },
      { name: 'مواد بناء', code: 'CONST', description: 'مواد البناء والتشييد', color: '#f59e0b', icon: '🏗️' },
      { name: 'معدات', code: 'EQUIP', description: 'معدات وأدوات', color: '#8b5cf6', icon: '🔧' },
      { name: 'خدمات', code: 'SERV', description: 'خدمات متنوعة', color: '#10b981', icon: '🛠️' },
      { name: 'نقل', code: 'TRANS', description: 'خدمات النقل والشحن', color: '#ef4444', icon: '🚛' },
      { name: 'طباعة', code: 'PRINT', description: 'خدمات الطباعة', color: '#06b6d4', icon: '🖨️' },
      { name: 'تسويق', code: 'MARK', description: 'تسويق وإعلانات', color: '#ec4899', icon: '📢' },
      { name: 'متنوعة', code: 'MISC', description: 'مصروفات متنوعة', color: '#6366f1', icon: '📦' }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO categories (name, code, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const cat of categories) {
      stmt.run(cat.name, cat.code, cat.description, cat.color, cat.icon);
    }
    console.log('✅ تم إضافة 8 فئات افتراضية');
  }
  
  // فحص وإضافة عميل افتراضي
  const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  if (clientCount.count === 0) {
    console.log('👤 إضافة عميل افتراضي...');
    db.prepare(`
      INSERT INTO clients (name, code, notes, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `).run('عام', 'DEFAULT', 'عميل افتراضي للمشاريع العامة', '#3b82f6', '👤');
    console.log('✅ تم إضافة عميل افتراضي');
  }
  
  console.log('✅ Auto-Migration مكتمل!\n');

} catch (error) {
  console.error('⚠️ خطأ في تحديث schema:', error);
}

// إعداد المتوسطات (Middleware)
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files من مجلد Frontend (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../web/dist')));
}

// بيانات المستخدم الافتراضية
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'A@asd123';

// دالة Middleware للتوثيق
const authenticateAdmin = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "رمز التوثيق مطلوب" });
    }

    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username] = decoded.split(':');

    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: "رمز التوثيق غير صالح" });
    }

    next();
  } catch (error) {
    res.status(401).json({ error: "رمز التوثيق غير صالح" });
  }
};
// إعداد المتوسطات (Middleware)
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة للإنتاج
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../web/dist')));
}

// التحقق من صلاحية الرمز المميز
app.get("/api/auth/verify", authenticateAdmin, (req, res) => {
  res.json({
    ok: true,
    message: "الرمز المميز صالح"
  });
});

// تجديد الرمز المميز
app.post("/api/auth/refresh", authenticateAdmin, (req, res) => {
  try {
    const newToken = Buffer.from(`${ADMIN_USERNAME}:${Date.now()}`).toString('base64');
    res.json({
      ok: true,
      token: newToken,
      message: "تم تجديد الرمز المميز بنجاح"
    });
  } catch (error) {
    res.status(500).json({ error: "فشل في تجديد الرمز المميز" });
  }
});

// تسجيل دخول الأدمن
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // إنشاء رمز مميز بسيط (في بيئة الإنتاج استخدم JWT)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      res.json({
        ok: true,
        token,
        message: "تم تسجيل الدخول بنجاح"
      });
    } else {
      res.status(401).json({
        error: "اسم المستخدم أو كلمة المرور غير صحيحة"
      });
    }
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// مسار الصحة
app.get("/health", (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: Date.now(),
    database: "connected"
  });
});

// =========================
// مسارات الفئات (Categories)
// =========================

app.get("/api/categories", authenticateAdmin, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, name, code, color, icon, description, created_at, updated_at
      FROM categories 
      ORDER BY name
    `).all();
    res.json(rows);
  } catch (error) {
    console.error("خطأ في جلب الفئات:", error);
    res.status(500).json({ error: "خطأ في جلب الفئات" });
  }
});

app.post("/api/categories", (req, res) => {
  try {
    const { name, code, color, icon, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "اسم الفئة مطلوب" });
    }

    const stmt = db.prepare(`
      INSERT INTO categories (name, code, color, icon, description) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      name,
      code || null,
      color || "#3b82f6",
      icon || null,
      description || null
    );
    
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error: any) {
    console.error("خطأ في إضافة الفئة:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "رمز الفئة مستخدم مسبقاً" });
    } else {
      res.status(500).json({ error: "خطأ في إضافة الفئة" });
    }
  }
});

app.patch("/api/categories/:id", (req, res) => {
  try {
    const id = +req.params.id;
    const { name, code, color, icon, description } = req.body;
    
    const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "الفئة غير موجودة" });
    }

    const stmt = db.prepare(`
      UPDATE categories SET 
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        color = COALESCE(?, color),
        icon = COALESCE(?, icon),
        description = COALESCE(?, description),
        updated_at = strftime('%s','now')
      WHERE id = ?
    `);
    
    stmt.run(name, code, color, icon, description, id);
    res.json({ ok: true, success: true });
  } catch (error: any) {
    console.error("خطأ في تحديث الفئة:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "رمز الفئة مستخدم مسبقاً" });
    } else {
      res.status(500).json({ error: "خطأ في تحديث الفئة" });
    }
  }
});

app.delete("/api/categories/:id", (req, res) => {
  try {
    const id = +req.params.id;
    
    // تحقق من وجود مصروفات مرتبطة
    const expensesCount = db.prepare("SELECT COUNT(*) as count FROM expenses WHERE category_id = ?").get(id) as { count: number };
    if (expensesCount.count > 0) {
      return res.status(400).json({ error: `لا يمكن حذف الفئة لوجود ${expensesCount.count} مصروف مرتبط بها` });
    }
    
    const result = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "الفئة غير موجودة" });
    }
    
    res.json({ ok: true, success: true });
  } catch (error) {
    console.error("خطأ في حذف الفئة:", error);
    res.status(500).json({ error: "خطأ في حذف الفئة" });
  }
});

// =========================
// مسارات المورّدين (Vendors) - تم الحذف
// =========================

// =========================
// مسارات المصروفات (Expenses)
// =========================

app.get("/api/expenses", (req, res) => {
  try {
    const { from, to, categoryId, projectId, vendorId, q, limit = 100 } = req.query;
    
    const where: string[] = [];
    const params: any[] = [];

    if (from) { 
      where.push("e.date >= ?"); 
      params.push(+from); 
    }
    if (to) { 
      where.push("e.date <= ?"); 
      params.push(+to); 
    }
    if (categoryId) { 
      where.push("e.category_id = ?"); 
      params.push(+categoryId); 
    }
    if (projectId) { 
      where.push("e.project_id = ?"); 
      params.push(+projectId); 
    }
    if (q) { 
      where.push("(e.description LIKE ? OR e.notes LIKE ? OR e.details LIKE ?)"); 
      params.push(`%${q}%`, `%${q}%`, `%${q}%`); 
    }

    const sql = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon,
        u.name AS unit_name,
        pm.name AS payment_method,
        p.name AS project_name,
        p.code AS project_code,
        p.color AS project_color,
        pi.name AS project_item_name,
        COALESCE(e.amount + COALESCE(e.tax_amount, 0), e.amount) as total_amount
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      LEFT JOIN units u ON u.id = e.unit_id
      LEFT JOIN payment_methods pm ON pm.id = e.payment_method_id
      LEFT JOIN projects p ON p.id = e.project_id
      LEFT JOIN project_items pi ON pi.id = e.project_item_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY e.date DESC, e.id DESC
      LIMIT ?
    `;
    
    const rows = db.prepare(sql).all(...params, +limit);
    
    // إضافة الحقول المخصصة
    const expenseIds = rows.map((row: any) => row.id);
    if (expenseIds.length > 0) {
      const customValues = db.prepare(`
        SELECT cv.entity_id, cv.field_key, cv.value, cf.name as field_name, cf.type
        FROM custom_values cv
        JOIN custom_fields cf ON cf.key = cv.field_key AND cf.entity = cv.entity
        WHERE cv.entity = 'expense' AND cv.entity_id IN (${expenseIds.map(() => '?').join(',')})
      `).all(...expenseIds);
      
      // ربط الحقول المخصصة بالمصروفات
      const customByExpense: any = {};
      customValues.forEach((cv: any) => {
        if (!customByExpense[cv.entity_id]) {
          customByExpense[cv.entity_id] = {};
        }
        customByExpense[cv.entity_id][cv.field_key] = {
          value: cv.value,
          name: cv.field_name,
          type: cv.type
        };
      });
      
      rows.forEach((row: any) => {
        row.custom_fields = customByExpense[row.id] || {};
        if (row.extra) {
          try {
            row.extra_data = JSON.parse(row.extra);
          } catch {
            row.extra_data = {};
          }
        }
      });
    }
    
    console.log(`\n📋 جلب ${rows.length} مصروف - أول مصروف:`, rows[0] ? {
      id: (rows[0] as any).id,
      description: (rows[0] as any).description,
      payment_method_id: (rows[0] as any).payment_method_id,
      payment_method: (rows[0] as any).payment_method
    } : 'لا يوجد');
    
    res.json(rows);
  } catch (error) {
    console.error("خطأ في جلب المصروفات:", error);
    res.status(500).json({ error: "خطأ في جلب المصروفات" });
  }
});

app.post("/api/expenses", (req, res) => {
  try {
    console.log("\n🔵 POST /api/expenses - البيانات المستلمة:", JSON.stringify(req.body, null, 2));
    
    const {
      categoryId, projectId, projectItemId,
      quantity = 1, unit_price, unit_id,
      amount, taxRate = 0, date,
      paymentMethodId, 
      description, details, notes, 
      extra, customFields
    } = req.body;

    console.log("💳 paymentMethodId المستلم:", paymentMethodId, "نوعه:", typeof paymentMethodId);

    // التحقق من البيانات المطلوبة
    if (!categoryId || !date) {
      return res.status(400).json({ error: "الفئة والتاريخ مطلوبة" });
    }

    // حساب المبلغ بناءً على الكمية وسعر الوحدة أو استخدام المبلغ المباشر
    let calculatedAmount = amount;
    if (unit_price && quantity) {
      calculatedAmount = +(quantity * unit_price).toFixed(2);
    } else if (!amount) {
      return res.status(400).json({ error: "يجب إدخال المبلغ أو الكمية وسعر الوحدة" });
    }

    // حساب الضريبة والإجمالي
    const taxAmount = +(calculatedAmount * (taxRate / 100)).toFixed(2);
    const totalAmount = +(calculatedAmount + taxAmount).toFixed(2);

    // التحقق من وجود أعمدة description و details
    const columns = db.pragma('table_info(expenses)') as Array<{ name: string }>;
    const hasDescription = columns.some((col) => col.name === 'description');
    const hasDetails = columns.some((col) => col.name === 'details');

    let stmt, params;
    
    if (hasDescription && hasDetails) {
      // قاعدة البيانات محدثة - استخدام الكود الكامل
      stmt = db.prepare(`
        INSERT INTO expenses
          (category_id, project_id, project_item_id, 
           quantity, unit_price, unit_id, amount, 
           tax_rate, tax_amount, total_amount,
           payment_method_id, date, 
           description, details, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      params = [
        categoryId,
        projectId || null,
        projectItemId || null,
        quantity || 1,
        unit_price || calculatedAmount,
        unit_id || null,
        calculatedAmount, 
        taxRate, 
        taxAmount, 
        totalAmount,
        paymentMethodId || null,
        date, 
        description || null,
        details || null,
        notes || null
      ];
    } else {
      // قاعدة البيانات قديمة - بدون description و details
      stmt = db.prepare(`
        INSERT INTO expenses
          (category_id, project_id, project_item_id, 
           quantity, unit_price, unit_id, amount, 
           tax_rate, tax_amount, total_amount,
           payment_method_id, date, 
           notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      params = [
        categoryId,
        projectId || null,
        projectItemId || null,
        quantity || 1,
        unit_price || calculatedAmount,
        unit_id || null,
        calculatedAmount, 
        taxRate, 
        taxAmount, 
        totalAmount,
        paymentMethodId || null,
        date, 
        notes || null
      ];
    }
    
    const info = stmt.run(...params);

    console.log("✅ تم إدراج المصروف برقم:", info.lastInsertRowid);
    console.log("📊 المعاملات المرسلة:", params);

    const expenseId = info.lastInsertRowid;

    // حفظ الحقول المخصصة
    if (customFields && typeof customFields === 'object') {
      const customStmt = db.prepare(`
        INSERT OR REPLACE INTO custom_values (entity, entity_id, field_key, value)
        VALUES ('expense', ?, ?, ?)
      `);
      
      for (const [key, value] of Object.entries(customFields)) {
        if (value !== null && value !== undefined && value !== '') {
          customStmt.run(expenseId, key, String(value));
        }
      }
    }

    res.json({ 
      id: expenseId, 
      amount: calculatedAmount,
      totalAmount, 
      taxAmount,
      success: true 
    });
  } catch (error) {
    console.error("خطأ في إضافة المصروف:", error);
    res.status(500).json({ error: "خطأ في إضافة المصروف" });
  }
});

app.patch("/api/expenses/:id", (req, res) => {
  try {
    const id = +req.params.id;
    
    // التحقق من وجود المصروف
    const existing = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "المصروف غير موجود" });
    }

    const data = { ...existing, ...req.body };
    
    // التأكد من وجود التاريخ وتحويله إلى timestamp إذا لزم الأمر
    if (!data.date) {
      return res.status(400).json({ error: "التاريخ مطلوب" });
    }
    
    // تحويل التاريخ إلى timestamp إذا كان string
    let dateValue = data.date;
    if (typeof dateValue === 'string') {
      dateValue = new Date(dateValue).getTime();
    }
    
    // إعادة حساب الضريبة والإجمالي
    const taxAmount = +(data.amount * ((data.taxRate || 0) / 100)).toFixed(2);
    const totalAmount = +(data.amount + taxAmount).toFixed(2);

    const stmt = db.prepare(`
      UPDATE expenses SET
        category_id=?, project_id=?, project_item_id=?,
        quantity=?, unit_price=?, unit_id=?,
        amount=?, tax_rate=?, tax_amount=?, total_amount=?,
        payment_method_id=?, date=?, 
        description=?, details=?, notes=?,
        updated_at=strftime('%s','now')
      WHERE id=?
    `);
    
    stmt.run(
      data.categoryId, 
      data.projectId || null,
      data.projectItemId || null,
      data.quantity || null,
      data.unit_price || null,
      data.unit_id || null,
      data.amount, 
      data.taxRate || 0, 
      taxAmount, 
      totalAmount,
      data.paymentMethodId || null,
      dateValue, 
      data.description || null,
      data.details || null,
      data.notes || null,
      id
    );

    // تحديث الحقول المخصصة
    if (req.body.customFields && typeof req.body.customFields === 'object') {
      // حذف القيم القديمة
      db.prepare("DELETE FROM custom_values WHERE entity = 'expense' AND entity_id = ?").run(id);
      
      // إضافة القيم الجديدة
      const customStmt = db.prepare(`
        INSERT INTO custom_values (entity, entity_id, field_key, value)
        VALUES ('expense', ?, ?, ?)
      `);
      
      for (const [key, value] of Object.entries(req.body.customFields)) {
        if (value !== null && value !== undefined && value !== '') {
          customStmt.run(id, key, String(value));
        }
      }
    }

    res.json({ 
      ok: true, 
      totalAmount, 
      taxAmount,
      success: true 
    });
  } catch (error) {
    console.error("خطأ في تحديث المصروف:", error);
    res.status(500).json({ error: "خطأ في تحديث المصروف" });
  }
});

app.delete("/api/expenses/:id", (req, res) => {
  try {
    const id = +req.params.id;
    
    // حذف الحقول المخصصة المرتبطة
    db.prepare("DELETE FROM custom_values WHERE entity = 'expense' AND entity_id = ?").run(id);
    
    // حذف المصروف
    const result = db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "المصروف غير موجود" });
    }
    
    res.json({ ok: true, success: true });
  } catch (error) {
    console.error("خطأ في حذف المصروف:", error);
    res.status(500).json({ error: "خطأ في حذف المصروف" });
  }
});

// =========================
// مسارات الإنفاق المتوقع (Expected Expenses)
// =========================

app.get("/api/expected-expenses", (req, res) => {
  try {
    const { from, to, categoryId, projectId, q, limit = 100 } = req.query;
    
    const where: string[] = [];
    const params: any[] = [];

    if (from) { 
      where.push("ee.date >= ?"); 
      params.push(+from); 
    }
    if (to) { 
      where.push("ee.date <= ?"); 
      params.push(+to); 
    }
    if (categoryId) { 
      where.push("ee.category_id = ?"); 
      params.push(+categoryId); 
    }
    if (projectId) { 
      where.push("ee.project_id = ?"); 
      params.push(+projectId); 
    }
    if (q) { 
      where.push("(ee.description LIKE ? OR ee.notes LIKE ? OR ee.details LIKE ?)"); 
      params.push(`%${q}%`, `%${q}%`, `%${q}%`); 
    }

    const sql = `
      SELECT 
        ee.*,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon,
        u.name AS unit_name,
        pm.name AS payment_method,
        p.name AS project_name,
        p.code AS project_code,
        p.color AS project_color,
        pi.name AS project_item_name,
        COALESCE(ee.amount + COALESCE(ee.tax_amount, 0), ee.amount) as total_amount
      FROM expected_expenses ee
      LEFT JOIN categories c ON c.id = ee.category_id
      LEFT JOIN units u ON u.id = ee.unit_id
      LEFT JOIN payment_methods pm ON pm.id = ee.payment_method_id
      LEFT JOIN projects p ON p.id = ee.project_id
      LEFT JOIN project_items pi ON pi.id = ee.project_item_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY ee.date DESC, ee.id DESC
      LIMIT ?
    `;
    
    const rows = db.prepare(sql).all(...params, +limit);
    
    console.log(`\n📋 جلب ${rows.length} إنفاق متوقع`);
    
    res.json(rows);
  } catch (error) {
    console.error("خطأ في جلب الإنفاق المتوقع:", error);
    res.status(500).json({ error: "خطأ في جلب الإنفاق المتوقع" });
  }
});

app.post("/api/expected-expenses", (req, res) => {
  try {
    console.log("\n🔵 POST /api/expected-expenses - البيانات المستلمة:", JSON.stringify(req.body, null, 2));
    
    const {
      categoryId, projectId, projectItemId,
      quantity = 1, unit_price, unit_id,
      amount, taxRate = 0, date,
      paymentMethodId, 
      description, details, notes
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!categoryId || !date) {
      return res.status(400).json({ error: "الفئة والتاريخ مطلوبة" });
    }

    // حساب المبلغ بناءً على الكمية وسعر الوحدة أو استخدام المبلغ المباشر
    let calculatedAmount = amount;
    if (unit_price && quantity) {
      calculatedAmount = +(quantity * unit_price).toFixed(2);
    } else if (!amount) {
      return res.status(400).json({ error: "يجب إدخال المبلغ أو الكمية وسعر الوحدة" });
    }

    // حساب الضريبة والإجمالي
    const taxAmount = +(calculatedAmount * (taxRate / 100)).toFixed(2);
    const totalAmount = +(calculatedAmount + taxAmount).toFixed(2);

    const stmt = db.prepare(`
      INSERT INTO expected_expenses
        (category_id, project_id, project_item_id, 
         quantity, unit_price, unit_id, amount, 
         tax_rate, tax_amount, total_amount,
         payment_method_id, date, 
         description, details, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const params = [
      categoryId,
      projectId || null,
      projectItemId || null,
      quantity || 1,
      unit_price || calculatedAmount,
      unit_id || null,
      calculatedAmount, 
      taxRate, 
      taxAmount, 
      totalAmount,
      paymentMethodId || null,
      date, 
      description || null,
      details || null,
      notes || null
    ];
    
    const info = stmt.run(...params);

    console.log("✅ تم إدراج الإنفاق المتوقع برقم:", info.lastInsertRowid);

    const expenseId = info.lastInsertRowid;

    // تحديث expected_spending للمشروع إذا كان مرتبط بمشروع
    if (projectId) {
      try {
        const project = db.prepare("SELECT expected_spending FROM projects WHERE id = ?").get(projectId) as any;
        if (project) {
          const newExpectedSpending = (project.expected_spending || 0) + calculatedAmount;
          db.prepare("UPDATE projects SET expected_spending = ? WHERE id = ?").run(newExpectedSpending, projectId);
          console.log(`✅ تم تحديث expected_spending للمشروع ${projectId} إلى ${newExpectedSpending}`);
        }
      } catch (updateError) {
        console.error("⚠️ خطأ في تحديث expected_spending:", updateError);
      }
    }

    res.json({ 
      id: expenseId, 
      amount: calculatedAmount,
      totalAmount, 
      taxAmount,
      success: true 
    });
  } catch (error) {
    console.error("خطأ في إضافة الإنفاق المتوقع:", error);
    res.status(500).json({ error: "خطأ في إضافة الإنفاق المتوقع" });
  }
});

app.patch("/api/expected-expenses/:id", (req, res) => {
  try {
    const id = +req.params.id;
    
    // التحقق من وجود الإنفاق المتوقع
    const existing = db.prepare("SELECT * FROM expected_expenses WHERE id = ?").get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: "الإنفاق المتوقع غير موجود" });
    }

    const data = { ...existing, ...req.body };
    
    // التأكد من وجود التاريخ وتحويله إلى timestamp إذا لزم الأمر
    if (!data.date) {
      return res.status(400).json({ error: "التاريخ مطلوب" });
    }
    
    // تحويل التاريخ إلى timestamp إذا كان string
    let dateValue = data.date;
    if (typeof dateValue === 'string') {
      dateValue = new Date(dateValue).getTime();
    }
    
    // إعادة حساب الضريبة والإجمالي
    const taxAmount = +(data.amount * ((data.taxRate || 0) / 100)).toFixed(2);
    const totalAmount = +(data.amount + taxAmount).toFixed(2);

    const stmt = db.prepare(`
      UPDATE expected_expenses SET
        category_id=?, project_id=?, project_item_id=?,
        quantity=?, unit_price=?, unit_id=?,
        amount=?, tax_rate=?, tax_amount=?, total_amount=?,
        payment_method_id=?, date=?, 
        description=?, details=?, notes=?,
        updated_at=strftime('%s','now')
      WHERE id=?
    `);
    
    stmt.run(
      data.categoryId, 
      data.projectId || null,
      data.projectItemId || null,
      data.quantity || null,
      data.unit_price || null,
      data.unit_id || null,
      data.amount, 
      data.taxRate || 0, 
      taxAmount, 
      totalAmount,
      data.paymentMethodId || null,
      dateValue, 
      data.description || null,
      data.details || null,
      data.notes || null,
      id
    );

    // تحديث expected_spending للمشروع
    const amountDiff = data.amount - existing.amount;
    if (amountDiff !== 0 && data.projectId) {
      try {
        const project = db.prepare("SELECT expected_spending FROM projects WHERE id = ?").get(data.projectId) as any;
        if (project) {
          const newExpectedSpending = (project.expected_spending || 0) + amountDiff;
          db.prepare("UPDATE projects SET expected_spending = ? WHERE id = ?").run(newExpectedSpending, data.projectId);
          console.log(`✅ تم تحديث expected_spending للمشروع ${data.projectId}`);
        }
      } catch (updateError) {
        console.error("⚠️ خطأ في تحديث expected_spending:", updateError);
      }
    }

    res.json({ 
      ok: true, 
      totalAmount, 
      taxAmount,
      success: true 
    });
  } catch (error) {
    console.error("خطأ في تحديث الإنفاق المتوقع:", error);
    res.status(500).json({ error: "خطأ في تحديث الإنفاق المتوقع" });
  }
});

app.delete("/api/expected-expenses/:id", (req, res) => {
  try {
    const id = +req.params.id;
    
    // جلب معلومات الإنفاق قبل الحذف لتحديث expected_spending
    const existing = db.prepare("SELECT * FROM expected_expenses WHERE id = ?").get(id) as any;
    
    if (!existing) {
      return res.status(404).json({ error: "الإنفاق المتوقع غير موجود" });
    }
    
    // حذف الإنفاق المتوقع
    const result = db.prepare("DELETE FROM expected_expenses WHERE id = ?").run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "الإنفاق المتوقع غير موجود" });
    }

    // تحديث expected_spending للمشروع
    if (existing.project_id && existing.amount) {
      try {
        const project = db.prepare("SELECT expected_spending FROM projects WHERE id = ?").get(existing.project_id) as any;
        if (project) {
          const newExpectedSpending = Math.max(0, (project.expected_spending || 0) - existing.amount);
          db.prepare("UPDATE projects SET expected_spending = ? WHERE id = ?").run(newExpectedSpending, existing.project_id);
          console.log(`✅ تم تحديث expected_spending للمشروع ${existing.project_id} إلى ${newExpectedSpending}`);
        }
      } catch (updateError) {
        console.error("⚠️ خطأ في تحديث expected_spending:", updateError);
      }
    }
    
    res.json({ ok: true, success: true });
  } catch (error) {
    console.error("خطأ في حذف الإنفاق المتوقع:", error);
    res.status(500).json({ error: "خطأ في حذف الإنفاق المتوقع" });
  }
});

// =========================
// مسارات العملاء (Clients)
// =========================

// جلب جميع العملاء مع إحصائيات مشاريعهم
app.get("/api/clients", authenticateAdmin, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT p.id) as projects_count,
        COALESCE(SUM(p.budget), 0) as total_budget,
        COALESCE(SUM(p.expected_spending), 0) as total_expected,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects
      FROM clients c
      LEFT JOIN projects p ON p.client_id = c.id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(rows);
  } catch (error) {
    console.error("خطأ في جلب العملاء:", error);
    res.status(500).json({ error: "خطأ في جلب العملاء" });
  }
});

// جلب تفاصيل عميل معين مع مشاريعه
app.get("/api/clients/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // جلب بيانات العميل
    const client = db.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).get(id);
    
    if (!client) {
      return res.status(404).json({ error: "العميل غير موجود" });
    }
    
    // جلب مشاريع العميل مع الإحصائيات والتصنيف
    const projects = db.prepare(`
      SELECT 
        p.*,
        pi.name as project_item_name,
        pi.icon as project_item_icon,
        pi.color as project_item_color,
        COALESCE(SUM(e.amount), 0) as total_spent,
        COUNT(e.id) as expense_count,
        CASE 
          WHEN p.budget > 0 THEN ROUND((COALESCE(SUM(e.amount), 0) * 100.0 / p.budget), 2)
          ELSE 0 
        END as completion_percentage
      FROM projects p
      LEFT JOIN project_items pi ON p.project_item_id = pi.id
      LEFT JOIN expenses e ON e.project_id = p.id
      WHERE p.client_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all(id);
    
    res.json({
      ...client,
      projects
    });
  } catch (error) {
    console.error("خطأ في جلب تفاصيل العميل:", error);
    res.status(500).json({ error: "خطأ في جلب تفاصيل العميل" });
  }
});

// إضافة عميل جديد
app.post("/api/clients", authenticateAdmin, (req, res) => {
  try {
    const { name, code, phone, email, address, contact_person, tax_number, notes, color, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "اسم العميل مطلوب" });
    }
    
    const now = Math.floor(Date.now() / 1000);
    const result = db.prepare(`
      INSERT INTO clients (name, code, phone, email, address, contact_person, tax_number, notes, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      code || null,
      phone || null,
      email || null,
      address || null,
      contact_person || null,
      tax_number || null,
      notes || null,
      color || '#3b82f6',
      icon || '👤',
      now,
      now
    );
    
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (error: any) {
    console.error("خطأ في إضافة عميل:", error);
    if (error.message?.includes('UNIQUE')) {
      res.status(400).json({ error: "رمز العميل موجود مسبقاً" });
    } else {
      res.status(500).json({ error: "خطأ في إضافة العميل" });
    }
  }
});

// تحديث عميل
app.patch("/api/clients/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, phone, email, address, contact_person, tax_number, notes, color, icon, is_active } = req.body;
    
    const now = Math.floor(Date.now() / 1000);
    const result = db.prepare(`
      UPDATE clients 
      SET 
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        contact_person = COALESCE(?, contact_person),
        tax_number = COALESCE(?, tax_number),
        notes = COALESCE(?, notes),
        color = COALESCE(?, color),
        icon = COALESCE(?, icon),
        is_active = COALESCE(?, is_active),
        updated_at = ?
      WHERE id = ?
    `).run(
      name || null,
      code || null,
      phone || null,
      email || null,
      address || null,
      contact_person || null,
      tax_number || null,
      notes || null,
      color || null,
      icon || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      now,
      id
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "العميل غير موجود" });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("خطأ في تحديث عميل:", error);
    if (error.message?.includes('UNIQUE')) {
      res.status(400).json({ error: "رمز العميل موجود مسبقاً" });
    } else {
      res.status(500).json({ error: "خطأ في تحديث العميل" });
    }
  }
});

// حذف عميل (soft delete)
app.delete("/api/clients/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // حذف جميع مشاريع العميل (والباقي سيُحذف تلقائياً بـ CASCADE)
    db.prepare(`
      DELETE FROM projects WHERE client_id = ?
    `).run(id);
    
    // حذف العميل نفسه
    const result = db.prepare(`
      DELETE FROM clients WHERE id = ?
    `).run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "العميل غير موجود" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("خطأ في حذف عميل:", error);
    res.status(500).json({ error: "خطأ في حذف العميل" });
  }
});

// =========================
// مسارات المشاريع (Projects)
// =========================

// جلب جميع المشاريع مع المصروفات المحسوبة
app.get("/api/projects", authenticateAdmin, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        p.*,
        c.name as client_name,
        c.color as client_color,
        c.icon as client_icon,
        pi.name as project_item_name,
        pi.icon as project_item_icon,
        COALESCE(SUM(e.amount), 0) as total_spent,
        COUNT(e.id) as expense_count,
        CASE 
          WHEN p.budget > 0 THEN ROUND((COALESCE(SUM(e.amount), 0) * 100.0 / p.budget), 2)
          ELSE 0 
        END as completion_percentage
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN project_items pi ON pi.id = p.project_item_id
      LEFT JOIN expenses e ON e.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(rows);
  } catch (error) {
    console.error("خطأ في جلب المشاريع:", error);
    res.status(500).json({ error: "خطأ في جلب المشاريع" });
  }
});

// جلب مشروع واحد مع تفاصيله
app.get("/api/projects/:id", authenticateAdmin, (req, res) => {
  try {
    const id = +req.params.id;
    
    const project = db.prepare(`
      SELECT 
        p.*,
        COALESCE(SUM(e.amount), 0) as total_spent,
        COUNT(e.id) as expense_count,
        CASE 
          WHEN p.budget > 0 THEN ROUND((COALESCE(SUM(e.amount), 0) * 100.0 / p.budget), 2)
          ELSE 0 
        END as completion_percentage
      FROM projects p
      LEFT JOIN expenses e ON e.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(id);
    
    if (!project) {
      return res.status(404).json({ error: "المشروع غير موجود" });
    }
    
    // جلب المصروفات المرتبطة بالمشروع
    let expenses = [];
    try {
      // فحص الجداول والأعمدة المتاحة
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
      const hasPaymentMethods = tables.some((t: { name: string }) => t.name === 'payment_methods');
      const hasUnits = tables.some((t: { name: string }) => t.name === 'units');
      
      // بناء الاستعلام بناءً على الجداول المتاحة
      let query = `
        SELECT 
          e.*,
          c.name as category_name,
          c.color as category_color,
          pi.name as item_name,
          COALESCE(e.amount + COALESCE(e.tax_amount, 0), e.amount) as total_amount
      `;
      
      if (hasPaymentMethods) {
        query += `, pm.name as payment_method`;
      }
      
      if (hasUnits) {
        query += `, u.name as unit_name`;
      }
      
      query += `
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        LEFT JOIN project_items pi ON e.project_item_id = pi.id
      `;
      
      if (hasPaymentMethods) {
        query += ` LEFT JOIN payment_methods pm ON e.payment_method_id = pm.id`;
      }
      
      if (hasUnits) {
        query += ` LEFT JOIN units u ON e.unit_id = u.id`;
      }
      
      query += `
        WHERE e.project_id = ?
        ORDER BY e.date DESC
      `;
      
      expenses = db.prepare(query).all(id);
    } catch (expError) {
      console.error("خطأ في جلب المصروفات:", expError);
      // في حالة الخطأ، نجلب المصروفات بدون الـ JOINs الإضافية
      expenses = db.prepare(`
        SELECT 
          e.*,
          c.name as category_name,
          c.color as category_color,
          pi.name as item_name,
          COALESCE(e.amount + COALESCE(e.tax_amount, 0), e.amount) as total_amount
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        LEFT JOIN project_items pi ON e.project_item_id = pi.id
        WHERE e.project_id = ?
        ORDER BY e.date DESC
      `).all(id);
    }
    
    res.json({
      ...project,
      expenses
    });
  } catch (error: any) {
    console.error("خطأ في جلب تفاصيل المشروع:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ error: "خطأ في جلب تفاصيل المشروع", details: error.message });
  }
});

// إضافة مشروع جديد
app.post("/api/projects", authenticateAdmin, (req, res) => {
  try {
    const { 
      name, 
      code, 
      project_item_id,
      client_id,
      description, 
      budget,
      expected_spending, 
      start_date, 
      end_date, 
      status, 
      color 
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "الاسم مطلوب" });
    }

    const stmt = db.prepare(`
      INSERT INTO projects (
        name, code, project_item_id, client_id, description, budget, expected_spending,
        start_date, end_date, status, color
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      name,
      code || null,
      project_item_id || null,
      client_id || 1, // العميل التجريبي افتراضياً
      description || null,
      budget || 0,
      expected_spending || 0,
      start_date || null,
      end_date || null,
      status || 'active',
      color || '#3b82f6'
    );
    
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error: any) {
    console.error("خطأ في إضافة المشروع:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "رمز المشروع مستخدم مسبقاً" });
    } else {
      res.status(500).json({ error: "خطأ في إضافة المشروع" });
    }
  }
});

// تحديث مشروع
app.patch("/api/projects/:id", authenticateAdmin, (req, res) => {
  try {
    const id = +req.params.id;
    const { 
      name, 
      code, 
      project_item_id,
      client_id,
      description, 
      budget,
      expected_spending, 
      start_date, 
      end_date, 
      status, 
      color 
    } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (code !== undefined) {
      updates.push("code = ?");
      values.push(code);
    }
    if (project_item_id !== undefined) {
      updates.push("project_item_id = ?");
      values.push(project_item_id);
    }
    if (client_id !== undefined) {
      updates.push("client_id = ?");
      values.push(client_id);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (budget !== undefined) {
      updates.push("budget = ?");
      values.push(budget);
    }
    if (expected_spending !== undefined) {
      updates.push("expected_spending = ?");
      values.push(expected_spending);
    }
    if (start_date !== undefined) {
      updates.push("start_date = ?");
      values.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push("end_date = ?");
      values.push(end_date);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (color !== undefined) {
      updates.push("color = ?");
      values.push(color);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "لا توجد بيانات للتحديث" });
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const result = db.prepare(
      `UPDATE projects SET ${updates.join(", ")} WHERE id = ?`
    ).run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "المشروع غير موجود" });
    }
    
    res.json({ ok: true, success: true });
  } catch (error: any) {
    console.error("خطأ في تحديث المشروع:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "رمز المشروع مستخدم مسبقاً" });
    } else {
      res.status(500).json({ error: "خطأ في تحديث المشروع" });
    }
  }
});

// حذف مشروع
app.delete("/api/projects/:id", authenticateAdmin, (req, res) => {
  try {
    const id = +req.params.id;
    console.log('🗑️ محاولة حذف المشروع رقم:', id);
    
    // فحص هل جدول project_items موجود وله عمود project_id
    try {
      const columns = db.pragma('table_info(project_items)') as Array<{ name: string }>;
      const hasProjectId = columns.some((col) => col.name === 'project_id');
      
      if (hasProjectId) {
        // حذف عناصر المشروع
        const itemsResult = db.prepare("DELETE FROM project_items WHERE project_id = ?").run(id);
        console.log(`✅ تم حذف ${itemsResult.changes} عنصر من المشروع`);
      } else {
        console.log('⚠️ جدول project_items لا يحتوي على عمود project_id');
      }
    } catch (itemsError) {
      console.log('⚠️ جدول project_items غير موجود أو حدث خطأ:', itemsError);
    }
    
    // حذف أو فصل جميع البيانات المرتبطة بالمشروع
    
    // 1. حذف الإنفاق المتوقع المرتبط بالمشروع
    try {
      const expectedResult = db.prepare("DELETE FROM expected_expenses WHERE project_id = ?").run(id);
      console.log(`✅ تم حذف ${expectedResult.changes} إنفاق متوقع مرتبط بالمشروع`);
    } catch (expectedError) {
      console.log('⚠️ خطأ في حذف الإنفاق المتوقع:', expectedError);
    }
    
    // 2. إزالة ارتباط المصروفات بالمشروع (نحتفظ بالمصروفات لكن نفصلها)
    try {
      const expensesResult = db.prepare("UPDATE expenses SET project_id = NULL, project_item_id = NULL WHERE project_id = ?").run(id);
      console.log(`✅ تم فصل ${expensesResult.changes} مصروف عن المشروع`);
    } catch (expensesError) {
      console.log('⚠️ خطأ في تحديث المصروفات:', expensesError);
    }
    
    // 3. حذف المشروع
    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    console.log(`✅ نتيجة حذف المشروع: ${result.changes} صف محذوف`);
    
    if (result.changes === 0) {
      console.log('❌ المشروع غير موجود');
      return res.status(404).json({ error: "المشروع غير موجود" });
    }
    
    console.log('🎉 تم حذف المشروع بنجاح');
    res.json({ ok: true, success: true });
  } catch (error: any) {
    console.error("❌ خطأ في حذف المشروع:");
    console.error("❌ Error message:", error.message);
    console.error("❌ Error code:", error.code);
    console.error("❌ Full error:", error);
    res.status(500).json({ 
      error: "خطأ في حذف المشروع",
      details: error.message,
      code: error.code
    });
  }
});

// =========================
// مسارات تصنيف المشاريع (Project Items)
// =========================

// جلب عناصر مشروع محدد
app.get("/api/projects/:projectId/items", authenticateAdmin, (req, res) => {
  try {
    const projectId = +req.params.projectId;
    
    const items = db.prepare(`
      SELECT 
        pi.*,
        COALESCE(SUM(e.amount), 0) as total_spent
      FROM project_items pi
      LEFT JOIN expenses e ON e.project_item_id = pi.id
      WHERE pi.project_id = ?
      GROUP BY pi.id
      ORDER BY pi.sort_order, pi.id
    `).all(projectId);
    
    res.json(items);
  } catch (error) {
    console.error("خطأ في جلب تصنيفات المشروع:", error);
    res.status(500).json({ error: "خطأ في جلب تصنيفات المشروع" });
  }
});

// إضافة عنصر جديد لمشروع
app.post("/api/projects/:projectId/items", authenticateAdmin, (req, res) => {
  try {
    const projectId = +req.params.projectId;
    const { name, description, budget, sort_order } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "اسم العنصر مطلوب" });
    }

    const stmt = db.prepare(`
      INSERT INTO project_items (
        project_id, name, description, budget, sort_order, is_active
      ) 
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    
    const info = stmt.run(
      projectId,
      name,
      description || null,
      budget || 0,
      sort_order || 0
    );
    
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error: any) {
    console.error("خطأ في إضافة تصنيف المشروع:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ error: "خطأ في إضافة تصنيف المشروع", details: error.message });
  }
});

// تحديث عنصر مشروع
app.patch("/api/project-items/:id", authenticateAdmin, (req, res) => {
  try {
    const id = +req.params.id;
    const { name, description, budget, sort_order } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (budget !== undefined) {
      updates.push("budget = ?");
      values.push(budget);
    }
    if (sort_order !== undefined) {
      updates.push("sort_order = ?");
      values.push(sort_order);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "لا توجد بيانات للتحديث" });
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const result = db.prepare(
      `UPDATE project_items SET ${updates.join(", ")} WHERE id = ?`
    ).run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "تصنيف المشروع غير موجود" });
    }
    
    res.json({ ok: true, success: true });
  } catch (error) {
    console.error("خطأ في تحديث تصنيف المشروع:", error);
    res.status(500).json({ error: "خطأ في تحديث تصنيف المشروع" });
  }
});

// حذف عنصر مشروع
app.delete("/api/project-items/:id", authenticateAdmin, (req, res) => {
  try {
    const id = +req.params.id;
    console.log("\n🗑️ DELETE /api/project-items/:id - حذف تصنيف المشروع رقم:", id);
    
    // تعطيل foreign keys مؤقتاً
    db.exec('PRAGMA foreign_keys = OFF');
    
    // إزالة ارتباط المصروفات بالعنصر
    const updateResult = db.prepare("UPDATE expenses SET project_item_id = NULL WHERE project_item_id = ?").run(id);
    console.log("📊 تم تحديث", updateResult.changes, "مصروف مرتبط");
    
    // حذف العنصر
    const result = db.prepare("DELETE FROM project_items WHERE id = ?").run(id);
    console.log("✅ عدد الصفوف المحذوفة:", result.changes);
    
    // إعادة تفعيل foreign keys
    db.exec('PRAGMA foreign_keys = ON');
    
    if (result.changes === 0) {
      console.log("⚠️ تصنيف المشروع غير موجود");
      return res.status(404).json({ error: "تصنيف المشروع غير موجود" });
    }
    
    console.log("✅ تم حذف تصنيف المشروع بنجاح");
    res.json({ ok: true, success: true });
  } catch (error: any) {
    // إعادة تفعيل foreign keys في حالة الخطأ
    db.exec('PRAGMA foreign_keys = ON');
    console.error("❌ خطأ في حذف تصنيف المشروع:", error);
    console.error("تفاصيل الخطأ:", error.message);
    res.status(500).json({ error: "خطأ في حذف تصنيف المشروع: " + error.message });
  }
});

// إحصائيات المشاريع للوحة التحكم
app.get("/api/projects/stats/summary", authenticateAdmin, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_projects,
        SUM(budget) as total_budget,
        COALESCE(SUM(spent.total), 0) as total_spent,
        ROUND((COALESCE(SUM(spent.total), 0) * 100.0 / NULLIF(SUM(budget), 0)), 2) as overall_completion
      FROM projects
      LEFT JOIN (
        SELECT project_id, SUM(amount) as total
        FROM expenses
        WHERE project_id IS NOT NULL
        GROUP BY project_id
      ) spent ON projects.id = spent.project_id
    `).get();
    
    res.json(stats);
  } catch (error) {
    console.error("خطأ في جلب إحصائيات المشاريع:", error);
    res.status(500).json({ error: "خطأ في جلب إحصائيات المشاريع" });
  }
});

// =========================
// مسارات الحقول المخصصة
// =========================

app.get("/api/custom-fields", (req, res) => {
  try {
    const { entity } = req.query;
    
    let sql = "SELECT * FROM custom_fields";
    const params: any[] = [];
    
    if (entity) {
      sql += " WHERE entity = ?";
      params.push(entity);
    }
    
    sql += " ORDER BY sort_order, name";
    
    const rows = db.prepare(sql).all(...params);
    
    // تحويل options من JSON إلى object
    rows.forEach((row: any) => {
      if (row.options) {
        try {
          row.options = JSON.parse(row.options);
        } catch {
          row.options = null;
        }
      }
    });
    
    res.json(rows);
  } catch (error) {
    console.error("خطأ في جلب الحقول المخصصة:", error);
    res.status(500).json({ error: "خطأ في جلب الحقول المخصصة" });
  }
});

app.post("/api/custom-fields", (req, res) => {
  try {
    const { entity, name, key, type, options, required, sortOrder } = req.body;
    
    if (!entity || !name || !key || !type) {
      return res.status(400).json({ error: "جميع الحقول الأساسية مطلوبة" });
    }

    const stmt = db.prepare(`
      INSERT INTO custom_fields (entity, name, key, type, options, required, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      entity,
      name,
      key,
      type,
      options ? JSON.stringify(options) : null,
      required ? 1 : 0,
      sortOrder || 0
    );
    
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error: any) {
    console.error("خطأ في إضافة الحقل المخصص:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "مفتاح الحقل مستخدم مسبقاً" });
    } else {
      res.status(500).json({ error: "خطأ في إضافة الحقل المخصص" });
    }
  }
});

// =========================
// مسارات التقارير والإحصائيات - تم الحذف
// =========================

// =========================
// مسارات الإحصائيات (الأصلية)
// =========================

app.get("/api/stats", authenticateAdmin, (req, res) => {
  try {
    const { from, to, projectId, categoryId } = req.query;
    
    const where: string[] = [];
    const params: any[] = [];
    
    if (from) { where.push("date >= ?"); params.push(+from); }
    if (to) { where.push("date <= ?"); params.push(+to); }
    if (categoryId) { where.push("category_id = ?"); params.push(+categoryId); }
    
    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";
    
    // الإجمالي
    const total = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total,
        COALESCE(SUM(amount), 0) as subtotal,
        COALESCE(SUM(tax_amount), 0) as tax
      FROM expenses ${whereClause}
    `).get(...params);
    
    // حسب الفئة
    const byCategory = db.prepare(`
      SELECT 
        c.name, c.color, c.icon,
        COUNT(*) as count,
        COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      JOIN categories c ON c.id = e.category_id
      ${whereClause}
      GROUP BY e.category_id, c.name, c.color, c.icon
      ORDER BY total DESC
      LIMIT 10
    `).all(...params);
    
    res.json({
      total,
      byCategory,
      currency: "SAR"
    });
  } catch (error) {
    console.error("خطأ في جلب الإحصائيات:", error);
    res.status(500).json({ error: "خطأ في جلب الإحصائيات" });
  }
});

// =========================
// مسارات البرماوي - تم الحذف
// =========================

// ==================== عناصر المشروع (مستقلة) ====================

// جلب جميع عناصر المشروع
app.get("/api/project-items", authenticateAdmin, (req, res) => {
  try {
    // فحص الأعمدة المتاحة في الجدول
    const columns = db.pragma('table_info(project_items)') as Array<{ name: string }>;
    const hasIsActive = columns.some((col) => col.name === 'is_active');
    
    let query = 'SELECT * FROM project_items';
    if (hasIsActive) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY name';
    
    const items = db.prepare(query).all();
    res.json(items);
  } catch (error: any) {
    console.error("خطأ في جلب عناصر المشروع:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ error: "خطأ في جلب عناصر المشروع", details: error.message });
  }
});

// جلب عنصر مشروع واحد
app.get("/api/project-items/:id", authenticateAdmin, (req, res) => {
  try {
    const item = db.prepare(`
      SELECT * FROM project_items WHERE id = ?
    `).get(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: "تصنيف المشروع غير موجود" });
    }
    
    res.json(item);
  } catch (error) {
    console.error("خطأ في جلب تصنيف المشروع:", error);
    res.status(500).json({ error: "خطأ في جلب تصنيف المشروع" });
  }
});

// إضافة عنصر مشروع جديد
app.post("/api/project-items", authenticateAdmin, (req, res) => {
  try {
    const { name, code, description, color, icon, unit } = req.body;
    const now = Date.now();

    const result = db.prepare(`
      INSERT INTO project_items (name, code, description, color, icon, unit, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(name, code || null, description || null, color || '#3b82f6', icon || '📦', unit || null, now, now);

    res.json({ 
      id: result.lastInsertRowid, 
      message: "تم إضافة تصنيف المشروع بنجاح" 
    });
  } catch (error: any) {
    console.error("خطأ في إضافة تصنيف المشروع:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ error: "خطأ في إضافة تصنيف المشروع", details: error.message });
  }
});

// تحديث عنصر مشروع
app.put("/api/project-items/:id", authenticateAdmin, (req, res) => {
  try {
    const { name, code, description, color, icon, unit } = req.body;
    const now = Date.now();

    const result = db.prepare(`
      UPDATE project_items 
      SET name = ?, code = ?, description = ?, color = ?, icon = ?, unit = ?, updated_at = ?
      WHERE id = ?
    `).run(name, code || null, description || null, color || '#3b82f6', icon || '📦', unit || null, now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "تصنيف المشروع غير موجود" });
    }

    res.json({ message: "تم تحديث تصنيف المشروع بنجاح" });
  } catch (error) {
    console.error("خطأ في تحديث تصنيف المشروع:", error);
    res.status(500).json({ error: "خطأ في تحديث تصنيف المشروع" });
  }
});

// حذف عنصر مشروع (soft delete)
app.delete("/api/project-items/:id", authenticateAdmin, (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE project_items 
      SET is_active = 0, updated_at = ?
      WHERE id = ?
    `).run(Date.now(), req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "تصنيف المشروع غير موجود" });
    }

    res.json({ message: "تم حذف تصنيف المشروع بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف تصنيف المشروع:", error);
    res.status(500).json({ error: "خطأ في حذف تصنيف المشروع" });
  }
});

// ==================== الوحدات (مستقلة) ====================

// جلب جميع الوحدات
app.get("/api/units", authenticateAdmin, (req, res) => {
  try {
    const units = db.prepare(`
      SELECT * FROM units 
      WHERE is_active = 1 
      ORDER BY name
    `).all();
    res.json(units);
  } catch (error) {
    console.error("خطأ في جلب الوحدات:", error);
    res.status(500).json({ error: "خطأ في جلب الوحدات" });
  }
});

// جلب وحدة واحدة
app.get("/api/units/:id", authenticateAdmin, (req, res) => {
  try {
    const unit = db.prepare(`
      SELECT * FROM units WHERE id = ?
    `).get(req.params.id);
    
    if (!unit) {
      return res.status(404).json({ error: "الوحدة غير موجودة" });
    }
    
    res.json(unit);
  } catch (error) {
    console.error("خطأ في جلب الوحدة:", error);
    res.status(500).json({ error: "خطأ في جلب الوحدة" });
  }
});

// إضافة وحدة جديدة
app.post("/api/units", authenticateAdmin, (req, res) => {
  try {
    const { name, code, description, color, icon } = req.body;
    const now = Date.now();

    const result = db.prepare(`
      INSERT INTO units (name, code, description, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, code || null, description || null, color || '#3b82f6', icon || '📏', now, now);

    res.json({ 
      id: result.lastInsertRowid, 
      message: "تم إضافة الوحدة بنجاح" 
    });
  } catch (error) {
    console.error("خطأ في إضافة الوحدة:", error);
    res.status(500).json({ error: "خطأ في إضافة الوحدة" });
  }
});

// تحديث وحدة
app.put("/api/units/:id", authenticateAdmin, (req, res) => {
  try {
    const { name, code, description, color, icon } = req.body;
    const now = Date.now();

    const result = db.prepare(`
      UPDATE units 
      SET name = ?, code = ?, description = ?, color = ?, icon = ?, updated_at = ?
      WHERE id = ?
    `).run(name, code || null, description || null, color || '#3b82f6', icon || '📏', now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "الوحدة غير موجودة" });
    }

    res.json({ message: "تم تحديث الوحدة بنجاح" });
  } catch (error) {
    console.error("خطأ في تحديث الوحدة:", error);
    res.status(500).json({ error: "خطأ في تحديث الوحدة" });
  }
});

// حذف وحدة (soft delete)
app.delete("/api/units/:id", authenticateAdmin, (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE units 
      SET is_active = 0, updated_at = ?
      WHERE id = ?
    `).run(Date.now(), req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "الوحدة غير موجودة" });
    }

    res.json({ message: "تم حذف الوحدة بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف الوحدة:", error);
    res.status(500).json({ error: "خطأ في حذف الوحدة" });
  }
});

// ==================== طرق الدفع (مستقلة) ====================

// جلب جميع طرق الدفع
app.get("/api/payment-methods", authenticateAdmin, (req, res) => {
  try {
    const methods = db.prepare(`
      SELECT * FROM payment_methods 
      WHERE is_active = 1 
      ORDER BY name
    `).all();
    res.json(methods);
  } catch (error) {
    console.error("خطأ في جلب طرق الدفع:", error);
    res.status(500).json({ error: "خطأ في جلب طرق الدفع" });
  }
});

// جلب طريقة دفع واحدة
app.get("/api/payment-methods/:id", authenticateAdmin, (req, res) => {
  try {
    const method = db.prepare(`
      SELECT * FROM payment_methods WHERE id = ?
    `).get(req.params.id);
    
    if (!method) {
      return res.status(404).json({ error: "طريقة الدفع غير موجودة" });
    }
    
    res.json(method);
  } catch (error) {
    console.error("خطأ في جلب طريقة الدفع:", error);
    res.status(500).json({ error: "خطأ في جلب طريقة الدفع" });
  }
});

// إضافة طريقة دفع جديدة
app.post("/api/payment-methods", authenticateAdmin, (req, res) => {
  try {
    console.log("\n🔵 POST /api/payment-methods - البيانات المستلمة:", req.body);
    
    const { name, code, description, color, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "الاسم مطلوب" });
    }
    
    const now = Date.now();

    const result = db.prepare(`
      INSERT INTO payment_methods (name, code, description, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, code || null, description || null, color || '#10b981', icon || '💳', now, now);

    console.log("✅ تم إضافة طريقة الدفع برقم:", result.lastInsertRowid);

    res.json({ 
      id: result.lastInsertRowid, 
      message: "تم إضافة طريقة الدفع بنجاح" 
    });
  } catch (error: any) {
    console.error("❌ خطأ في إضافة طريقة الدفع:", error);
    console.error("تفاصيل الخطأ:", error.message);
    res.status(500).json({ error: "خطأ في إضافة طريقة الدفع: " + error.message });
  }
});

// تحديث طريقة دفع
app.put("/api/payment-methods/:id", authenticateAdmin, (req, res) => {
  try {
    const { name, code, description, color, icon } = req.body;
    const now = Date.now();

    const result = db.prepare(`
      UPDATE payment_methods 
      SET name = ?, code = ?, description = ?, color = ?, icon = ?, updated_at = ?
      WHERE id = ?
    `).run(name, code || null, description || null, color || '#10b981', icon || '💳', now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "طريقة الدفع غير موجودة" });
    }

    res.json({ message: "تم تحديث طريقة الدفع بنجاح" });
  } catch (error) {
    console.error("خطأ في تحديث طريقة الدفع:", error);
    res.status(500).json({ error: "خطأ في تحديث طريقة الدفع" });
  }
});

// حذف طريقة دفع (soft delete)
app.delete("/api/payment-methods/:id", authenticateAdmin, (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE payment_methods 
      SET is_active = 0, updated_at = ?
      WHERE id = ?
    `).run(Date.now(), req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "طريقة الدفع غير موجودة" });
    }

    res.json({ message: "تم حذف طريقة الدفع بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف طريقة الدفع:", error);
    res.status(500).json({ error: "خطأ في حذف طريقة الدفع" });
  }
});

// معالج الأخطاء العامة
app.use((err: any, req: any, res: any, next: any) => {
  console.error("خطأ غير متوقع:", err);
  res.status(500).json({ error: "خطأ داخلي في الخادم" });
});

// معالج المسارات غير الموجودة - للإنتاج نخدم React App
app.use("*", (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../../web/dist/index.html'));
  } else {
    res.status(404).json({ error: "المسار غير موجود" });
  }
});

// بدء الخادم
app.listen(PORT, () => {
  const serverUrl = process.env.NODE_ENV === 'production' 
    ? `Port ${PORT}` 
    : `http://localhost:${PORT}`;
  console.log(`🚀 السيرفر يعمل على ${serverUrl}`);
  console.log(`📁 قاعدة البيانات: ${dbPath}`);
});

// إغلاق قاعدة البيانات عند إنهاء التطبيق
process.on('SIGINT', () => {
  console.log('\n🔌 إغلاق قاعدة البيانات...');
  db.close();
  process.exit(0);
});
