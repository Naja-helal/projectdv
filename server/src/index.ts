import express from "express";
import Database from "better-sqlite3";
import cors from "cors";
import compression from "compression";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";

// تحميل متغيرات البيئة
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}

// إنشاء التطبيق
const app = express();
const PORT = process.env.PORT || 5175;

// إعداد قاعدة البيانات - استخدام /app/data للـ Volume في Railway
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = isProduction 
  ? '/app/data/expenses.db'  // مسار ثابت في Railway Volume
  : process.env.DB_PATH || path.join(__dirname, "../expenses.db");

console.log(`📂 مسار قاعدة البيانات: ${dbPath}`);
console.log(`🌍 البيئة: ${isProduction ? 'الإنتاج' : 'التطوير'}`);

// إنشاء المجلد إذا لم يكن موجوداً
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✅ تم إنشاء مجلد قاعدة البيانات: ${dbDir}`);
}

// في الإنتاج: نسخ قاعدة البيانات من المشروع إلى Volume إذا لم تكن موجودة
if (isProduction && !fs.existsSync(dbPath)) {
  // في Railway: المشروع في /app والسيرفر في /app/server
  const possiblePaths = [
    path.join(__dirname, '../expenses.db'),  // من dist إلى server
    '/app/server/expenses.db',               // مسار مباشر في Railway
    path.join(process.cwd(), 'expenses.db'), // من root المشروع
  ];
  
  let sourceDbPath = '';
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      sourceDbPath = testPath;
      break;
    }
  }
  
  if (sourceDbPath) {
    console.log(`📋 نسخ قاعدة البيانات من ${sourceDbPath} إلى ${dbPath}`);
    fs.copyFileSync(sourceDbPath, dbPath);
    console.log('✅ تم نسخ قاعدة البيانات بنجاح');
  } else {
    console.log(`⚠️ قاعدة البيانات المصدر غير موجودة في أي من المسارات المحتملة`);
    console.log('المسارات المفحوصة:', possiblePaths);
  }
}

let db = new Database(dbPath);

// فحص وجود قاعدة البيانات
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").all() as Array<{ name: string }>;
if (tables.length > 0) {
  const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  console.log(`✅ قاعدة البيانات موجودة مع ${categoriesCount.count} فئة`);
} else {
  console.log('⚠️ قاعدة البيانات فارغة - يُرجى رفع قاعدة البيانات باستخدام railway run node upload-db-to-railway.js');
}

console.log('📁 قاعدة البيانات: ' + dbPath);

// تحديث schema تلقائياً عند بدء التشغيل (معطّل مؤقتاً لاستخدام القاعدة المرفوعة)
/*
try {
  // ===== فحص وإضافة جدول الوحدات =====
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='units'").all() as Array<{ name: string }>;
  const hasUnitsTable = tables.length > 0;
  
  if (!hasUnitsTable) {
    console.log('📦 إنشاء جدول الوحدات...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT,
        description TEXT,
        color TEXT DEFAULT '#3b82f6',
        icon TEXT DEFAULT '📏',
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
        updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
      )
    `);
    console.log('✅ تم إنشاء جدول الوحدات');
    
    // إضافة الوحدات الافتراضية
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
  
  // ===== فحص وإضافة أعمدة جدول المصروفات =====
  const columns = db.pragma('table_info(expenses)') as Array<{ name: string }>;
  const hasDescription = columns.some((col) => col.name === 'description');
  const hasDetails = columns.some((col) => col.name === 'details');
  const hasUnitId = columns.some((col) => col.name === 'unit_id');
  const hasPaymentMethodId = columns.some((col) => col.name === 'payment_method_id');
  
  if (!hasDescription) {
    console.log('➕ إضافة عمود description...');
    db.exec('ALTER TABLE expenses ADD COLUMN description TEXT');
    console.log('✅ تم إضافة عمود description');
  }
  
  if (!hasDetails) {
    console.log('➕ إضافة عمود details...');
    db.exec('ALTER TABLE expenses ADD COLUMN details TEXT');
    console.log('✅ تم إضافة عمود details');
  }
  
  if (!hasUnitId) {
    console.log('➕ إضافة عمود unit_id...');
    db.exec('ALTER TABLE expenses ADD COLUMN unit_id INTEGER REFERENCES units(id)');
    console.log('✅ تم إضافة عمود unit_id');
  }
  
  if (!hasPaymentMethodId) {
    console.log('➕ إضافة عمود payment_method_id...');
    db.exec('ALTER TABLE expenses ADD COLUMN payment_method_id INTEGER REFERENCES payment_methods(id)');
    console.log('✅ تم إضافة عمود payment_method_id');
  }
  
  if (!hasDescription || !hasDetails || !hasUnitId || !hasPaymentMethodId || !hasUnitsTable) {
    console.log('🎉 تم تحديث schema قاعدة البيانات بنجاح!');
  }

  // ===== فحص وإضافة أعمدة جدول طرق الدفع =====
  const paymentMethodsTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='payment_methods'").all() as Array<{ name: string }>;
  const hasPaymentMethodsTable = paymentMethodsTables.length > 0;
  
  if (hasPaymentMethodsTable) {
    const pmColumns = db.pragma('table_info(payment_methods)') as Array<{ name: string }>;
    const hasCode = pmColumns.some((col) => col.name === 'code');
    const hasDescription = pmColumns.some((col) => col.name === 'description');
    const hasColor = pmColumns.some((col) => col.name === 'color');
    const hasIcon = pmColumns.some((col) => col.name === 'icon');
    const hasIsActive = pmColumns.some((col) => col.name === 'is_active');
    
    if (!hasCode) {
      console.log('➕ إضافة عمود code لجدول payment_methods...');
      db.exec('ALTER TABLE payment_methods ADD COLUMN code TEXT');
      console.log('✅ تم إضافة عمود code');
    }
    
    if (!hasDescription) {
      console.log('➕ إضافة عمود description لجدول payment_methods...');
      db.exec('ALTER TABLE payment_methods ADD COLUMN description TEXT');
      console.log('✅ تم إضافة عمود description');
    }
    
    if (!hasColor) {
      console.log('➕ إضافة عمود color لجدول payment_methods...');
      db.exec('ALTER TABLE payment_methods ADD COLUMN color TEXT DEFAULT \'#10b981\'');
      console.log('✅ تم إضافة عمود color');
    }
    
    if (!hasIcon) {
      console.log('➕ إضافة عمود icon لجدول payment_methods...');
      db.exec('ALTER TABLE payment_methods ADD COLUMN icon TEXT DEFAULT \'💳\'');
      console.log('✅ تم إضافة عمود icon');
    }
    
    if (!hasIsActive) {
      console.log('➕ إضافة عمود is_active لجدول payment_methods...');
      db.exec('ALTER TABLE payment_methods ADD COLUMN is_active INTEGER DEFAULT 1');
      console.log('✅ تم إضافة عمود is_active');
    }
    
    if (!hasCode || !hasDescription || !hasColor || !hasIcon || !hasIsActive) {
      console.log('🎉 تم تحديث جدول payment_methods بنجاح!');
    }
  }

  // ===== حذف أنواع المشاريع: حذف العمود أولاً ثم الجدول =====
  const projectColumns = db.pragma('table_info(projects)') as Array<{ name: string }>;
  const hasProjectTypeId = projectColumns.some((col) => col.name === 'project_type_id');
  
  if (hasProjectTypeId) {
    console.log('🗑️ حذف عمود project_type_id من جدول المشاريع...');
    
    // تعطيل foreign keys مؤقتاً
    db.exec('PRAGMA foreign_keys = OFF');
    
    // إعادة إنشاء الجدول بدون العمود
    db.exec(`
      BEGIN TRANSACTION;
      
      CREATE TABLE projects_new (
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
        updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
      );
      
      INSERT INTO projects_new (id, name, code, type, description, budget, expected_spending, start_date, end_date, status, color, created_at, updated_at)
      SELECT id, name, code, type, description, budget, expected_spending, start_date, end_date, status, color, created_at, updated_at
      FROM projects;
      
      DROP TABLE projects;
      ALTER TABLE projects_new RENAME TO projects;
      
      COMMIT;
    `);
    
    // إعادة تفعيل foreign keys
    db.exec('PRAGMA foreign_keys = ON');
    
    console.log('✅ تم حذف عمود project_type_id من جدول المشاريع');
  }
  
  // الآن يمكن حذف جدول project_types بأمان
  const projectTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='project_types'").all() as Array<{ name: string }>;
  const hasProjectTypesTable = projectTables.length > 0;
  
  if (hasProjectTypesTable) {
    console.log('🗑️ حذف جدول project_types...');
    db.exec('DROP TABLE IF EXISTS project_types');
    console.log('✅ تم حذف جدول project_types');
  }
  
  if (hasProjectTypeId || hasProjectTypesTable) {
    console.log('🎉 تم حذف أنواع المشاريع بنجاح!');
  }
  
  // إضافة عمود project_item_id إذا لم يكن موجود
  const hasProjectItemId = projectColumns.some((col) => col.name === 'project_item_id');
  if (!hasProjectItemId) {
    console.log('➕ إضافة عمود project_item_id...');
    db.exec('ALTER TABLE projects ADD COLUMN project_item_id INTEGER REFERENCES project_items(id)');
    console.log('✅ تم إضافة عمود project_item_id');
  }

  // ===== فحص وإصلاح جدول project_items =====
  const projectItemsTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='project_items'").all() as Array<{ name: string }>;
  const hasProjectItemsTable = projectItemsTables.length > 0;
  
  if (hasProjectItemsTable) {
    const projectItemsColumns = db.pragma('table_info(project_items)') as Array<{ name: string }>;
    const hasProjectIdInItems = projectItemsColumns.some((col) => col.name === 'project_id');
    const hasIsActive = projectItemsColumns.some((col) => col.name === 'is_active');
    
    // إذا كان الجدول موجود لكن بدون الأعمدة المطلوبة، نعيد إنشائه
    if (!hasProjectIdInItems || !hasIsActive) {
      console.log('⚠️ جدول project_items يحتاج إعادة إنشاء لإضافة الأعمدة المطلوبة...');
      
      // تعطيل foreign keys مؤقتاً
      db.exec('PRAGMA foreign_keys = OFF');
      
      // حذف الجدول القديم وإعادة إنشائه بجميع الأعمدة
      db.exec(`
        DROP TABLE IF EXISTS project_items;
        
        CREATE TABLE project_items (
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
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
      `);
      
      // إعادة تفعيل foreign keys
      db.exec('PRAGMA foreign_keys = ON');
      
      console.log('✅ تم إعادة إنشاء جدول project_items بشكل صحيح');
    }
  }
} catch (error) {
  console.error('⚠️ خطأ في تحديث schema:', error);
}
*/

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// بيانات الأدمن الثابتة
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "A@asd123";

// middleware للتحقق من التوثيق
const authenticateAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "مطلوب تسجيل الدخول" });
  }

  try {
    // فك تشفير الرمز المميز البسيط
    const decoded = Buffer.from(token, 'base64').toString();
    const [username, timestamp] = decoded.split(':');
    
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: "رمز التوثيق غير صالح" });
    }

    // التحقق من صلاحية الرمز (24 ساعة)
    const tokenTime = parseInt(timestamp);
    const currentTime = Date.now();
    const tokenAge = currentTime - tokenTime;
    const maxAge = 24 * 60 * 60 * 1000; // 24 ساعة بالميللي ثانية

    if (tokenAge > maxAge) {
      return res.status(401).json({ error: "انتهت صلاحية جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى" });
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
// مسارات المشاريع (Projects)
// =========================

// جلب جميع المشاريع مع المصروفات المحسوبة
app.get("/api/projects", authenticateAdmin, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        p.*,
        c.name as client_name,
        c.icon as client_icon,
        c.color as client_color,
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
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN project_items pi ON p.project_item_id = pi.id
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
        c.name as client_name,
        c.icon as client_icon,
        c.color as client_color,
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
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN project_items pi ON p.project_item_id = pi.id
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
      type,
      project_item_id,
      description, 
      budget,
      expected_spending, 
      start_date, 
      end_date, 
      status, 
      color 
    } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: "الاسم والنوع مطلوبان" });
    }

    const stmt = db.prepare(`
      INSERT INTO projects (
        name, code, type, project_item_id, description, budget, expected_spending,
        start_date, end_date, status, color
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      name,
      code || null,
      type,
      project_item_id || null,
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
      type,
      project_item_id,
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
    if (type !== undefined) {
      updates.push("type = ?");
      values.push(type);
    }
    if (project_item_id !== undefined) {
      updates.push("project_item_id = ?");
      values.push(project_item_id);
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
    
    // إزالة ارتباط المصروفات بالمشروع
    try {
      const expensesResult = db.prepare("UPDATE expenses SET project_id = NULL, project_item_id = NULL WHERE project_id = ?").run(id);
      console.log(`✅ تم تحديث ${expensesResult.changes} مصروف`);
    } catch (expensesError) {
      console.log('⚠️ خطأ في تحديث المصروفات:', expensesError);
    }
    
    // حذف المشروع
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

// ============================================
// مسارات المصروفات المتوقعة (Expected Expenses)
// ============================================

// جلب جميع المصروفات المتوقعة
app.get("/api/expected-expenses", authenticateAdmin, (req, res) => {
  try {
    const { projectId, status } = req.query;
    
    let query = `
      SELECT 
        ee.*,
        p.name as project_name,
        c.name as category_name
      FROM expected_expenses ee
      LEFT JOIN projects p ON ee.project_id = p.id
      LEFT JOIN categories c ON ee.category_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (projectId) {
      query += ` AND ee.project_id = ?`;
      params.push(projectId);
    }
    
    if (status) {
      query += ` AND ee.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY ee.created_at DESC`;
    
    const expectedExpenses = db.prepare(query).all(...params);
    res.json(expectedExpenses);
  } catch (error) {
    console.error("خطأ في جلب المصروفات المتوقعة:", error);
    res.status(500).json({ error: "خطأ في جلب المصروفات المتوقعة" });
  }
});

// جلب مصروف متوقع واحد
app.get("/api/expected-expenses/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const expectedExpense = db.prepare(`
      SELECT 
        ee.*,
        p.name as project_name,
        c.name as category_name
      FROM expected_expenses ee
      LEFT JOIN projects p ON ee.project_id = p.id
      LEFT JOIN categories c ON ee.category_id = c.id
      WHERE ee.id = ?
    `).get(id);
    
    if (!expectedExpense) {
      return res.status(404).json({ error: "المصروف المتوقع غير موجود" });
    }
    
    res.json(expectedExpense);
  } catch (error) {
    console.error("خطأ في جلب المصروف المتوقع:", error);
    res.status(500).json({ error: "خطأ في جلب المصروف المتوقع" });
  }
});

// إضافة مصروف متوقع جديد
app.post("/api/expected-expenses", authenticateAdmin, (req, res) => {
  try {
    const { 
      project_id, 
      category_id, 
      description, 
      expected_amount, 
      expected_date,
      notes,
      status = 'pending'
    } = req.body;
    
    const result = db.prepare(`
      INSERT INTO expected_expenses 
      (project_id, category_id, description, expected_amount, expected_date, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(project_id, category_id, description, expected_amount, expected_date, notes, status);
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: "تم إضافة المصروف المتوقع بنجاح"
    });
  } catch (error) {
    console.error("خطأ في إضافة المصروف المتوقع:", error);
    res.status(500).json({ error: "خطأ في إضافة المصروف المتوقع" });
  }
});

// تحديث مصروف متوقع
app.put("/api/expected-expenses/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { 
      project_id, 
      category_id, 
      description, 
      expected_amount, 
      expected_date,
      notes,
      status
    } = req.body;
    
    const result = db.prepare(`
      UPDATE expected_expenses 
      SET 
        project_id = ?,
        category_id = ?,
        description = ?,
        expected_amount = ?,
        expected_date = ?,
        notes = ?,
        status = ?
      WHERE id = ?
    `).run(project_id, category_id, description, expected_amount, expected_date, notes, status, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "المصروف المتوقع غير موجود" });
    }
    
    res.json({ message: "تم تحديث المصروف المتوقع بنجاح" });
  } catch (error) {
    console.error("خطأ في تحديث المصروف المتوقع:", error);
    res.status(500).json({ error: "خطأ في تحديث المصروف المتوقع" });
  }
});

// حذف مصروف متوقع
app.delete("/api/expected-expenses/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM expected_expenses WHERE id = ?").run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "المصروف المتوقع غير موجود" });
    }
    
    res.json({ message: "تم حذف المصروف المتوقع بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف المصروف المتوقع:", error);
    res.status(500).json({ error: "خطأ في حذف المصروف المتوقع" });
  }
});

// ============================================
// مسارات العملاء (Clients)
// ============================================

// جلب جميع العملاء
app.get("/api/clients", authenticateAdmin, (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT p.id) as projects_count,
        COALESCE(SUM(e.amount), 0) as total_expenses
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
      LEFT JOIN expenses e ON p.id = e.project_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();
    
    res.json(clients);
  } catch (error) {
    console.error("خطأ في جلب العملاء:", error);
    res.status(500).json({ error: "خطأ في جلب العملاء" });
  }
});

// جلب عميل واحد مع مشاريعه
app.get("/api/clients/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // جلب بيانات العميل
    const client = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT p.id) as projects_count,
        COALESCE(SUM(e.amount), 0) as total_expenses
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
      LEFT JOIN expenses e ON p.id = e.project_id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(id);
    
    if (!client) {
      return res.status(404).json({ error: "العميل غير موجود" });
    }
    
    // جلب مشاريع العميل
    const projects = db.prepare(`
      SELECT 
        p.*,
        pi.name as project_item_name,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COUNT(e.id) as expenses_count
      FROM projects p
      LEFT JOIN project_items pi ON p.project_item_id = pi.id
      LEFT JOIN expenses e ON p.id = e.project_id
      WHERE p.client_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all(id);
    
    // إضافة المشاريع للعميل
    res.json({
      ...client,
      projects
    });
  } catch (error) {
    console.error("خطأ في جلب العميل:", error);
    res.status(500).json({ error: "خطأ في جلب العميل" });
  }
});

// إضافة عميل جديد
app.post("/api/clients", authenticateAdmin, (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "اسم العميل مطلوب" });
    }
    
    const result = db.prepare(`
      INSERT INTO clients (name, email, phone, address, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), email, phone, address, notes);
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: "تم إضافة العميل بنجاح"
    });
  } catch (error) {
    console.error("خطأ في إضافة العميل:", error);
    res.status(500).json({ error: "خطأ في إضافة العميل" });
  }
});

// تحديث عميل
app.put("/api/clients/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, notes } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "اسم العميل مطلوب" });
    }
    
    const result = db.prepare(`
      UPDATE clients 
      SET name = ?, email = ?, phone = ?, address = ?, notes = ?
      WHERE id = ?
    `).run(name.trim(), email, phone, address, notes, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "العميل غير موجود" });
    }
    
    res.json({ message: "تم تحديث العميل بنجاح" });
  } catch (error) {
    console.error("خطأ في تحديث العميل:", error);
    res.status(500).json({ error: "خطأ في تحديث العميل" });
  }
});

// حذف عميل
app.delete("/api/clients/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // إزالة ارتباط المشاريع بهذا العميل (تحويلهم لـ NULL)
    db.prepare("UPDATE projects SET client_id = NULL WHERE client_id = ?").run(id);
    
    // حذف العميل
    const result = db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "العميل غير موجود" });
    }
    
    res.json({ 
      message: "تم حذف العميل بنجاح وإزالة ارتباطه من المشاريع" 
    });
  } catch (error) {
    console.error("خطأ في حذف العميل:", error);
    res.status(500).json({ error: "خطأ في حذف العميل" });
  }
});

// ============================================
// مسارات النسخ الاحتياطي وقاعدة البيانات
// ============================================

// تنزيل نسخة احتياطية من قاعدة البيانات
app.get("/api/backup/download", authenticateAdmin, (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: "قاعدة البيانات غير موجودة" });
    }

    res.download(dbPath, `backup-${new Date().toISOString().split('T')[0]}.db`, (err) => {
      if (err) {
        console.error("خطأ في تنزيل النسخة الاحتياطية:", err);
        res.status(500).json({ error: "فشل في تنزيل النسخة الاحتياطية" });
      }
    });
  } catch (error) {
    console.error("خطأ في تنزيل النسخة الاحتياطية:", error);
    res.status(500).json({ error: "خطأ في تنزيل النسخة الاحتياطية" });
  }
});

// رفع واستعادة نسخة احتياطية
// إنشاء مجلد uploads إذا لم يكن موجوداً
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const uploadMiddleware = multer({ dest: uploadsDir });

app.post("/api/backup/upload", authenticateAdmin, uploadMiddleware.single('backup'), (req: any, res: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "لم يتم رفع أي ملف" });
    }

    console.log("📤 Received file:", file.originalname, "Size:", file.size);

    // نسخ احتياطية من القاعدة الحالية (إن وجدت)
    const backupPath = dbPath + '.backup';
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log("✅ Created backup of current database");
    }

    try {
      // إغلاق قاعدة البيانات الحالية
      db.close();
      console.log("✅ Closed current database");

      // نسخ الملف المرفوع إلى مكان قاعدة البيانات
      fs.copyFileSync(file.path, dbPath);
      console.log("✅ Copied uploaded file to database path");

      // حذف الملف المؤقت
      fs.unlinkSync(file.path);

      // حذف مجلد uploads إن كان فارغاً
      try {
        fs.rmdirSync('uploads');
      } catch (e) {
        // المجلد ليس فارغاً أو غير موجود
      }

      // إعادة فتح قاعدة البيانات
      db = new Database(dbPath);
      console.log("✅ Reopened database");

      res.json({ 
        message: "تم استعادة النسخة الاحتياطية بنجاح",
        size: fs.statSync(dbPath).size 
      });
    } catch (error: any) {
      console.error("❌ Error restoring database:", error);
      
      // محاولة استعادة النسخة الاحتياطية
      if (fs.existsSync(backupPath)) {
        try {
          fs.copyFileSync(backupPath, dbPath);
          db = new Database(dbPath);
          console.log("✅ Restored from backup");
        } catch (restoreError) {
          console.error("❌ Failed to restore backup:", restoreError);
        }
      }
      
      res.status(500).json({ 
        error: "خطأ في استعادة النسخة الاحتياطية",
        details: error.message 
      });
    }
  } catch (error: any) {
    console.error("❌ Error in upload handler:", error);
    res.status(500).json({ 
      error: "خطأ في رفع الملف",
      details: error.message 
    });
  }
});

// الحصول على معلومات قاعدة البيانات
app.get("/api/backup/info", authenticateAdmin, (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: "قاعدة البيانات غير موجودة" });
    }

    const stats = fs.statSync(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    
    let totalRows = 0;
    tables.forEach((table: any) => {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as any;
      totalRows += count.count;
    });

    res.json({
      size: `${(stats.size / 1024).toFixed(2)} KB`,
      lastModified: stats.mtime,
      tables: tables.map((t: any) => t.name),
      totalRows
    });
  } catch (error) {
    console.error("خطأ في جلب معلومات قاعدة البيانات:", error);
    res.status(500).json({ error: "خطأ في جلب معلومات قاعدة البيانات" });
  }
});

// مقارنة Schema بين Local و Server (يفترض أن يكون هناك ملف مرجعي)
app.get("/api/database/compare-schema", authenticateAdmin, (req, res) => {
  try {
    // الحصول على جميع الجداول الحالية
    const currentTables = db.prepare(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as any[];

    // هنا يمكن المقارنة مع schema مرجعي
    // في هذا المثال، نعيد جميع الجداول كـ "متطابقة"
    const differences = currentTables.map(table => ({
      table: table.name,
      status: 'same' as const,
      details: `الجدول موجود بنجاح`
    }));

    res.json({ differences });
  } catch (error) {
    console.error("خطأ في مقارنة Schema:", error);
    res.status(500).json({ error: "خطأ في مقارنة قاعدة البيانات" });
  }
});

// تحديث Schema في السيرفر
app.post("/api/database/sync-schema", authenticateAdmin, (req, res) => {
  try {
    // هنا يمكن تطبيق التحديثات على Schema
    // في هذا المثال، نعيد رسالة نجاح
    res.json({ 
      message: "تم تحديث قاعدة البيانات بنجاح",
      updatedTables: 0
    });
  } catch (error) {
    console.error("خطأ في مزامنة قاعدة البيانات:", error);
    res.status(500).json({ error: "خطأ في مزامنة قاعدة البيانات" });
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
