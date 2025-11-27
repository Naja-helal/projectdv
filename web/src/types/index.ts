// أنواع البيانات الأساسية
export interface Category {
  id: number
  name: string
  code?: string
  color: string
  icon?: string
  description?: string
  created_at: number
  updated_at: number
}

export interface BramawiField {
  id: number;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'calculated';
  label: string;
  options?: string[];
  calculation_formula?: string;
  dependent_fields?: string[];
  default_value?: string;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface Vendor {
  id: number
  name: string
  contact?: string
  email?: string
  phone?: string
  address?: string
  tax_number?: string
  created_at: number
  updated_at: number
}

// نظام الرواتب الجديد
export interface Employee {
  id: number
  name: string
  position?: string
  phone?: string
  monthly_salary: number
  hire_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MonthlySalary {
  id: number
  employee_id: number
  employee_name: string
  position?: string
  month: number
  year: number
  salary_amount: number
  is_delivered: boolean
  delivery_date?: string
  debt_amount: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface SalarySettings {
  salary_generation_day: { value: number; type: string; id: number }
  auto_generate_salaries: { value: boolean; type: string; id: number }
  default_salary_amount: { value: number; type: string; id: number }
}

export interface CustomField {
  id: number
  entity: 'expense' | 'category' | 'vendor'
  name: string
  key: string
  type: 'text' | 'number' | 'date' | 'select' | 'bool'
  options?: string[]
  required: boolean
  sort_order: number
  created_at: number
}

export interface Expense {
  id: number
  category_id: number
  vendor_id?: number
  quantity?: number
  unit_price?: number
  unit_id?: number
  amount: number
  currency: string
  tax_rate: number
  tax_amount: number
  total_amount: number
  date: number
  payment_method?: string
  description?: string
  details?: string
  notes?: string
  extra?: string
  extra_data?: Record<string, any>
  status: 'confirmed' | 'pending' | 'cancelled'
  project_id?: number
  project_item_id?: number
  created_at: number
  updated_at: number
  
  // البيانات المرتبطة
  category_name?: string
  category_color?: string
  category_icon?: string
  vendor_name?: string
  unit_name?: string
  project_name?: string
  project_code?: string
  project_color?: string
  project_item_name?: string
  custom_fields?: Record<string, {
    value: string
    name: string
    type: string
  }>
}

export interface Stats {
  total: {
    count: number
    total: number
    subtotal: number
    tax: number
  }
  byCategory: Array<{
    name: string
    color: string
    icon: string
    count: number
    total: number
  }>
  currency: string
}

// أنواع النماذج
export interface CreateExpenseData {
  categoryId: number
  projectId?: number
  projectItemId?: number
  vendorId?: number
  quantity?: number
  unit_price?: number
  unit_id?: number
  amount: number
  taxRate?: number
  date: number
  paymentMethod?: string
  description?: string
  details?: string
  notes?: string
  extra?: Record<string, any>
  customFields?: Record<string, string>
}

// نوع بيانات النموذج للواجهة الأمامية (التاريخ كـ string)
export interface ExpenseFormData {
  categoryId: number
  projectId?: number
  projectItemId?: number
  vendorId?: number
  quantity?: number
  unit_price?: number
  unit_id?: number
  amount: number
  taxRate?: number
  date: string // للنموذج HTML
  paymentMethod?: string
  description?: string
  details?: string
  notes?: string
  extra?: Record<string, any>
  customFields?: Record<string, string>
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  id: number
}

export interface CreateCategoryData {
  name: string
  code?: string
  color?: string
  icon?: string
  description?: string
}

export interface CreateVendorData {
  name: string
  contact?: string
  email?: string
  phone?: string
  address?: string
  tax_number?: string
}

// أنواع المرشحات
export interface ExpenseFilters {
  from?: number
  to?: number
  categoryId?: number
  projectId?: number
  vendorId?: number
  q?: string
  limit?: number
}

// استجابات API
export interface ApiResponse<T> {
  data?: T
  error?: string
  success?: boolean
}

export interface CreateExpenseResponse {
  id: number
  totalAmount: number
  taxAmount: number
  success: boolean
}

export interface CreateEntityResponse {
  id: number
  success: boolean
}

// أنواع البرماوي
export interface BramawiField {
  id: number
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'calculated'
  label: string
  options?: string[]
  calculation_formula?: string
  dependent_fields?: string[]
  default_value?: string
  is_required: boolean
  display_order: number
  is_active: boolean
  created_at: number
  updated_at: number
}

export interface BramawiRecord {
  id: number
  payment_status: 'paid' | 'unpaid'
  payment_date?: number
  notes?: string
  created_at: number
  updated_at: number
  values?: Record<string, {
    value: string
    type: string
    label: string
  }>
}

export interface CreateBramawiFieldData {
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'calculated'
  label: string
  options?: string[]
  calculation_formula?: string
  dependent_fields?: string[]
  default_value?: string
  is_required?: boolean
  display_order?: number
}

export interface CreateBramawiRecordData {
  values: Record<string, any>
  notes?: string
}

export interface BramawiFilters {
  status?: 'paid' | 'unpaid'
  from?: number
  to?: number
  limit?: number
}

// أنواع المشاريع
export interface Project {
  id: number
  name: string
  code?: string
  type: string
  project_item_id?: number
  description?: string
  budget: number
  expected_spending?: number
  start_date?: number
  end_date?: number
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  color?: string
  created_at: number
  updated_at: number
  // البيانات المحسوبة
  total_spent?: number
  actual_spent?: number
  completion_percentage?: number
  remaining_budget?: number
  // التفاصيل الموسعة
  items?: ProjectItem[]
  expenses?: any[]
}

// عناصر المشروع (مستقلة كفئات)
export interface ProjectItem {
  id: number
  name: string
  code?: string
  description?: string
  color?: string
  icon?: string
  unit?: string
  is_active: boolean
  created_at: number
  updated_at: number
  // حقول تصنيف المشاريع (عند الاستخدام في سياق مشروع)
  project_id?: number
  budget?: number
  total_spent?: number
  sort_order?: number
}

// الوحدات (مستقلة كفئات)
export interface Unit {
  id: number
  name: string
  code?: string
  description?: string
  color?: string
  icon?: string
  is_active: boolean
  created_at: number
  updated_at: number
}

// طرق الدفع (مستقلة كفئات)
export interface PaymentMethod {
  id: number
  name: string
  code?: string
  description?: string
  color?: string
  icon?: string
  is_active: boolean
  created_at: number
  updated_at: number
}

export interface CreateProjectData {
  name: string
  code?: string
  type: string
  project_item_id?: number
  description?: string
  budget: number
  expected_spending?: number
  start_date?: number
  end_date?: number
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled'
  color?: string
}

export interface CreateProjectItemData {
  name: string
  code?: string
  description?: string
  color?: string
  icon?: string
  unit?: string
  // حقول تصنيف المشاريع (عند الاستخدام في سياق مشروع)
  project_id?: number
  budget?: number
  sort_order?: number
}

export interface CreatePaymentMethodData {
  name: string
  code?: string
  description?: string
  color?: string
  icon?: string
}
