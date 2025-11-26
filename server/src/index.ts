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

// نسخ قاعدة البيانات الأولية في بيئة الإنتاج إذا لم تكن موجودة
if (process.env.NODE_ENV === 'production' && !fs.existsSync(dbPath)) {
  const sourceDb = path.join(__dirname, "../expenses-production.db");
  if (fs.existsSync(sourceDb)) {
    console.log(`📋 نسخ قاعدة البيانات الأولية من: ${sourceDb}`);
    fs.copyFileSync(sourceDb, dbPath);
    console.log(`✅ تم نسخ قاعدة البيانات إلى: ${dbPath}`);
  }
}

const db = new Database(dbPath);

// تحديث schema تلقائياً عند بدء التشغيل
try {
  const columns = db.pragma('table_info(expenses)');
  const hasDescription = columns.some((col: any) => col.name === 'description');
  const hasDetails = columns.some((col: any) => col.name === 'details');
  
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
  
  if (!hasDescription || !hasDetails) {
    console.log('🎉 تم تحديث schema قاعدة البيانات بنجاح!');
  }
} catch (error) {
  console.error('⚠️ خطأ في تحديث schema:', error);
}

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
    if (vendorId) { 
      where.push("e.vendor_id = ?"); 
      params.push(+vendorId); 
    }
    if (q) { 
      where.push("(e.reference LIKE ? OR e.notes LIKE ? OR e.invoice_number LIKE ?)"); 
      params.push(`%${q}%`, `%${q}%`, `%${q}%`); 
    }

    const sql = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon,
        v.name AS vendor_name,
        p.name AS project_name,
        p.code AS project_code,
        p.color AS project_color,
        pi.name AS project_item_name
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      LEFT JOIN vendors v ON v.id = e.vendor_id
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
    
    res.json(rows);
  } catch (error) {
    console.error("خطأ في جلب المصروفات:", error);
    res.status(500).json({ error: "خطأ في جلب المصروفات" });
  }
});

app.post("/api/expenses", (req, res) => {
  try {
    const {
      categoryId, projectId, projectItemId, vendorId,
      quantity = 1, unit_price, unit = 'قطعة',
      amount, taxRate = 0, date,
      paymentMethod, reference, invoiceNumber, 
      description, details, notes, 
      extra, customFields
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
      INSERT INTO expenses
        (category_id, project_id, project_item_id, vendor_id, 
         quantity, unit_price, unit, amount, currency, 
         tax_rate, tax_amount, total_amount,
         date, payment_method, reference, invoice_number, 
         description, details, notes, extra)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SAR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      categoryId,
      projectId || null,
      projectItemId || null,
      vendorId || null,
      quantity || 1,
      unit_price || calculatedAmount,
      unit || 'قطعة',
      calculatedAmount, 
      taxRate, 
      taxAmount, 
      totalAmount,
      date, 
      paymentMethod || null, 
      reference || null,
      invoiceNumber || null,
      description || null,
      details || null,
      notes || null,
      extra ? JSON.stringify(extra) : null
    );

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
        category_id=?, vendor_id=?,
        amount=?, currency='SAR', tax_rate=?, tax_amount=?, total_amount=?,
        date=?, payment_method=?, reference=?, invoice_number=?, 
        description=?, details=?, notes=?, extra=?,
        updated_at=strftime('%s','now')
      WHERE id=?
    `);
    
    stmt.run(
      data.categoryId, 
      data.vendorId || null,
      data.amount, 
      data.taxRate || 0, 
      taxAmount, 
      totalAmount,
      dateValue, 
      data.paymentMethod || null, 
      data.reference || null,
      data.invoiceNumber || null,
      data.description || null,
      data.details || null,
      data.notes || null,
      data.extra ? JSON.stringify(data.extra) : null,
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
        COALESCE(SUM(e.amount), 0) as total_spent,
        COUNT(e.id) as expense_count,
        CASE 
          WHEN p.budget > 0 THEN ROUND((COALESCE(SUM(e.amount), 0) * 100.0 / p.budget), 2)
          ELSE 0 
        END as completion_percentage
      FROM projects p
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
    const expenses = db.prepare(`
      SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color,
        pi.name as item_name
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN project_items pi ON e.project_item_id = pi.id
      WHERE e.project_id = ?
      ORDER BY e.date DESC
    `).all(id);
    
    res.json({
      ...project,
      expenses
    });
  } catch (error) {
    console.error("خطأ في جلب تفاصيل المشروع:", error);
    res.status(500).json({ error: "خطأ في جلب تفاصيل المشروع" });
  }
});

// إضافة مشروع جديد
app.post("/api/projects", authenticateAdmin, (req, res) => {
  try {
    const { 
      name, 
      code, 
      type,
      project_type_id,
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
        name, code, type, project_type_id, description, budget, expected_spending,
        start_date, end_date, status, color
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      name,
      code || null,
      type,
      project_type_id || null,
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
      project_type_id,
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
    if (project_type_id !== undefined) {
      updates.push("project_type_id = ?");
      values.push(project_type_id);
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
    
    // حذف عناصر المشروع
    db.prepare("DELETE FROM project_items WHERE project_id = ?").run(id);
    
    // إزالة ارتباط المصروفات بالمشروع
    db.prepare("UPDATE expenses SET project_id = NULL, project_item_id = NULL WHERE project_id = ?").run(id);
    
    // حذف المشروع
    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "المشروع غير موجود" });
    }
    
    res.json({ ok: true, success: true });
  } catch (error) {
    console.error("خطأ في حذف المشروع:", error);
    res.status(500).json({ error: "خطأ في حذف المشروع" });
  }
});

// =========================
// مسارات عناصر المشاريع (Project Items)
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
    console.error("خطأ في جلب عناصر المشروع:", error);
    res.status(500).json({ error: "خطأ في جلب عناصر المشروع" });
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
        project_id, name, description, budget, sort_order
      ) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      projectId,
      name,
      description || null,
      budget || 0,
      sort_order || 0
    );
    
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error) {
    console.error("خطأ في إضافة عنصر المشروع:", error);
    res.status(500).json({ error: "خطأ في إضافة عنصر المشروع" });
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
      return res.status(404).json({ error: "عنصر المشروع غير موجود" });
    }
    
    res.json({ ok: true, success: true });
  } catch (error) {
    console.error("خطأ في تحديث عنصر المشروع:", error);
    res.status(500).json({ error: "خطأ في تحديث عنصر المشروع" });
  }
});

// حذف عنصر مشروع
app.delete("/api/project-items/:id", authenticateAdmin, (req, res) => {
  try {
    const id = +req.params.id;
    
    // إزالة ارتباط المصروفات بالعنصر
    db.prepare("UPDATE expenses SET project_item_id = NULL WHERE project_item_id = ?").run(id);
    
    // حذف العنصر
    const result = db.prepare("DELETE FROM project_items WHERE id = ?").run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "عنصر المشروع غير موجود" });
    }
    
    res.json({ ok: true, success: true });
  } catch (error) {
    console.error("خطأ في حذف عنصر المشروع:", error);
    res.status(500).json({ error: "خطأ في حذف عنصر المشروع" });
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
    const items = db.prepare(`
      SELECT * FROM project_items 
      WHERE is_active = 1 
      ORDER BY name
    `).all();
    res.json(items);
  } catch (error) {
    console.error("خطأ في جلب عناصر المشروع:", error);
    res.status(500).json({ error: "خطأ في جلب عناصر المشروع" });
  }
});

// جلب عنصر مشروع واحد
app.get("/api/project-items/:id", authenticateAdmin, (req, res) => {
  try {
    const item = db.prepare(`
      SELECT * FROM project_items WHERE id = ?
    `).get(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: "عنصر المشروع غير موجود" });
    }
    
    res.json(item);
  } catch (error) {
    console.error("خطأ في جلب عنصر المشروع:", error);
    res.status(500).json({ error: "خطأ في جلب عنصر المشروع" });
  }
});

// إضافة عنصر مشروع جديد
app.post("/api/project-items", authenticateAdmin, (req, res) => {
  try {
    const { name, code, description, color, icon, unit } = req.body;
    const now = Date.now();

    const result = db.prepare(`
      INSERT INTO project_items (name, code, description, color, icon, unit, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, code || null, description || null, color || '#3b82f6', icon || '📦', unit || null, now, now);

    res.json({ 
      id: result.lastInsertRowid, 
      message: "تم إضافة عنصر المشروع بنجاح" 
    });
  } catch (error) {
    console.error("خطأ في إضافة عنصر المشروع:", error);
    res.status(500).json({ error: "خطأ في إضافة عنصر المشروع" });
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
      return res.status(404).json({ error: "عنصر المشروع غير موجود" });
    }

    res.json({ message: "تم تحديث عنصر المشروع بنجاح" });
  } catch (error) {
    console.error("خطأ في تحديث عنصر المشروع:", error);
    res.status(500).json({ error: "خطأ في تحديث عنصر المشروع" });
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
      return res.status(404).json({ error: "عنصر المشروع غير موجود" });
    }

    res.json({ message: "تم حذف عنصر المشروع بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف عنصر المشروع:", error);
    res.status(500).json({ error: "خطأ في حذف عنصر المشروع" });
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
    const { name, code, description, color, icon } = req.body;
    const now = Date.now();

    const result = db.prepare(`
      INSERT INTO payment_methods (name, code, description, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, code || null, description || null, color || '#10b981', icon || '💳', now, now);

    res.json({ 
      id: result.lastInsertRowid, 
      message: "تم إضافة طريقة الدفع بنجاح" 
    });
  } catch (error) {
    console.error("خطأ في إضافة طريقة الدفع:", error);
    res.status(500).json({ error: "خطأ في إضافة طريقة الدفع" });
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

// ==================== أنواع المشاريع (مستقلة) ====================

// جلب جميع أنواع المشاريع
app.get("/api/project-types", authenticateAdmin, (req, res) => {
  try {
    const types = db.prepare(`
      SELECT * FROM project_types 
      WHERE is_active = 1 
      ORDER BY name
    `).all();
    res.json(types);
  } catch (error) {
    console.error("خطأ في جلب أنواع المشاريع:", error);
    res.status(500).json({ error: "خطأ في جلب أنواع المشاريع" });
  }
});

// جلب نوع مشروع واحد
app.get("/api/project-types/:id", authenticateAdmin, (req, res) => {
  try {
    const type = db.prepare(`
      SELECT * FROM project_types WHERE id = ?
    `).get(req.params.id);
    
    if (!type) {
      return res.status(404).json({ error: "نوع المشروع غير موجود" });
    }
    
    res.json(type);
  } catch (error) {
    console.error("خطأ في جلب نوع المشروع:", error);
    res.status(500).json({ error: "خطأ في جلب نوع المشروع" });
  }
});

// إضافة نوع مشروع جديد
app.post("/api/project-types", authenticateAdmin, (req, res) => {
  try {
    const { name, code, description, color, icon } = req.body;
    const now = Date.now();

    const result = db.prepare(`
      INSERT INTO project_types (name, code, description, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, code || null, description || null, color || '#3b82f6', icon || '📂', now, now);

    res.json({ 
      id: result.lastInsertRowid, 
      message: "تم إضافة نوع المشروع بنجاح" 
    });
  } catch (error) {
    console.error("خطأ في إضافة نوع المشروع:", error);
    res.status(500).json({ error: "خطأ في إضافة نوع المشروع" });
  }
});

// تحديث نوع مشروع
app.put("/api/project-types/:id", authenticateAdmin, (req, res) => {
  try {
    const { name, code, description, color, icon } = req.body;
    const now = Date.now();

    const result = db.prepare(`
      UPDATE project_types 
      SET name = ?, code = ?, description = ?, color = ?, icon = ?, updated_at = ?
      WHERE id = ?
    `).run(name, code || null, description || null, color || '#3b82f6', icon || '📂', now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "نوع المشروع غير موجود" });
    }

    res.json({ message: "تم تحديث نوع المشروع بنجاح" });
  } catch (error) {
    console.error("خطأ في تحديث نوع المشروع:", error);
    res.status(500).json({ error: "خطأ في تحديث نوع المشروع" });
  }
});

// حذف نوع مشروع (soft delete)
app.delete("/api/project-types/:id", authenticateAdmin, (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE project_types 
      SET is_active = 0, updated_at = ?
      WHERE id = ?
    `).run(Date.now(), req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "نوع المشروع غير موجود" });
    }

    res.json({ message: "تم حذف نوع المشروع بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف نوع المشروع:", error);
    res.status(500).json({ error: "خطأ في حذف نوع المشروع" });
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
