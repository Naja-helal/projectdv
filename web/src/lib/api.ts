import type {
  Expense,
  Category,
  CustomField,
  Stats,
  CreateExpenseData,
  CreateCategoryData,
  ExpenseFilters,
  CreateExpenseResponse,
  CreateEntityResponse,
  Project,
  ProjectItem,
  PaymentMethod,
  ProjectType,
  CreateProjectData,
  CreateProjectItemData,
  CreatePaymentMethodData,
  CreateProjectTypeData,
  Employee,
  MonthlySalary
} from '@/types'

// تحديد الـ API base URL حسب البيئة
export const API_BASE = import.meta.env.VITE_API_URL || '/api'

// دالة للحصول على الـ URL الكامل
export const getApiUrl = (endpoint: string) => {
  if (endpoint.startsWith('http')) return endpoint;
  return `${API_BASE}${endpoint}`;
}



class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  // إضافة رمز التوثيق إلى جميع الطلبات ما عدا تسجيل الدخول
  const token = localStorage.getItem('adminToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }
  
  if (token && !endpoint.includes('/auth/login')) {
    headers.Authorization = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    headers,
    ...options,
  })
  
  // التعامل مع انتهاء صلاحية الرمز المميز
  if (response.status === 401 && !endpoint.includes('/auth/')) {
    // محاولة تجديد الرمز المميز
    try {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        localStorage.setItem('adminToken', refreshData.token)
        
        // إعادة تشغيل الطلب الأصلي بالرمز الجديد
        headers.Authorization = `Bearer ${refreshData.token}`
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        })
        
        if (retryResponse.ok) {
          const data = await retryResponse.json()
          return data
        }
      }
    } catch (refreshError) {
      console.error('فشل في تجديد الرمز المميز:', refreshError)
    }
    
    // إذا فشل التجديد، اخرج المستخدم
    localStorage.removeItem('adminToken')
    window.location.href = '/login'
    throw new ApiError('انتهت صلاحية جلسة تسجيل الدخول', 401)
  }
  
  if (!response.ok) {
    let errorMessage = `خطأ ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }
    throw new ApiError(errorMessage, response.status)
  }
  
  return response.json()
}

// خدمات المصروفات
export const expenseApi = {
  // جلب المصروفات
  getExpenses: (filters: ExpenseFilters = {}): Promise<Expense[]> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    
    return apiRequest(`/expenses?${params}`)
  },

  // إضافة مصروف
  createExpense: (data: CreateExpenseData): Promise<CreateExpenseResponse> => {
    return apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // تحديث مصروف
  updateExpense: (id: number, data: Partial<CreateExpenseData>): Promise<{ ok: boolean; totalAmount: number; taxAmount: number }> => {
    return apiRequest(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // حذف مصروف
  deleteExpense: (id: number): Promise<{ ok: boolean }> => {
    return apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
    })
  },
}

// خدمات الفئات
export const categoryApi = {
  // جلب الفئات
  getCategories: (): Promise<Category[]> => {
    return apiRequest('/categories')
  },

  // إضافة فئة
  createCategory: (data: CreateCategoryData): Promise<CreateEntityResponse> => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // تحديث فئة
  updateCategory: (id: number, data: Partial<CreateCategoryData>): Promise<{ ok: boolean }> => {
    return apiRequest(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // حذف فئة
  deleteCategory: (id: number): Promise<{ ok: boolean }> => {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    })
  },
}

// خدمات الحقول المخصصة
export const customFieldApi = {
  // جلب الحقول المخصصة
  getCustomFields: (entity?: string): Promise<CustomField[]> => {
    const params = entity ? `?entity=${entity}` : ''
    return apiRequest(`/custom-fields${params}`)
  },

  // إضافة حقل مخصص
  createCustomField: (data: Omit<CustomField, 'id' | 'created_at'>): Promise<CreateEntityResponse> => {
    return apiRequest('/custom-fields', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// خدمات الإحصائيات
export const statsApi = {
  // جلب الإحصائيات
  getStats: (filters: ExpenseFilters = {}): Promise<Stats> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    
    return apiRequest(`/stats?${params}`)
  },
}

// وظائف التوثيق
export const authAPI = {
  // تسجيل الدخول
  login: (username: string, password: string): Promise<{ ok: boolean; token: string; message: string }> => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  // التحقق من صلاحية الرمز المميز
  verify: (): Promise<{ ok: boolean; message: string }> => {
    return apiRequest('/auth/verify')
  },

  // تجديد الرمز المميز
  refresh: (): Promise<{ ok: boolean; token: string; message: string }> => {
    return apiRequest('/auth/refresh', {
      method: 'POST',
    })
  },
}

// خدمة المشاريع
export const projectApi = {
  getProjects: (): Promise<Project[]> => {
    return apiRequest('/projects')
  },
  
  getProject: (id: number): Promise<Project> => {
    return apiRequest(`/projects/${id}`)
  },
  
  createProject: (data: CreateProjectData): Promise<CreateEntityResponse> => {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  updateProject: (id: number, data: Partial<CreateProjectData>): Promise<{ ok: boolean }> => {
    return apiRequest(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  
  deleteProject: (id: number): Promise<{ ok: boolean }> => {
    return apiRequest(`/projects/${id}`, {
      method: 'DELETE',
    })
  },
  
  // عناصر المشاريع
  getProjectItems: (projectId: number): Promise<any[]> => {
    return apiRequest(`/projects/${projectId}/items`)
  },
  
  createProjectItem: (projectId: number, data: any): Promise<CreateEntityResponse> => {
    return apiRequest(`/projects/${projectId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  updateProjectItem: (itemId: number, data: any): Promise<{ ok: boolean }> => {
    return apiRequest(`/project-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  
  deleteProjectItem: (itemId: number): Promise<{ ok: boolean }> => {
    return apiRequest(`/project-items/${itemId}`, {
      method: 'DELETE',
    })
  },
  
  // إحصائيات المشاريع
  getStats: (): Promise<any> => {
    return apiRequest('/projects/stats/summary')
  },
}

// خدمة التقارير
export const reportsAPI = {
  // تقرير النظرة العامة
  getOverview: (): Promise<any> => {
    return apiRequest('/reports/overview')
  },

  // تقرير المصروفات
  getExpenses: (filters?: any): Promise<any> => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    return apiRequest(`/reports/expenses?${params}`)
  },

  // تقرير الرواتب
  getSalaries: (filters?: any): Promise<any> => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    return apiRequest(`/reports/salaries?${params}`)
  },

  // تقرير السلف
  getAdvances: (filters?: any): Promise<any> => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    return apiRequest(`/reports/advances?${params}`)
  },
}

// خدمة فحص الحالة
export const healthApi = {
  check: (): Promise<{ ok: boolean; timestamp: number; database: string }> => {
    return apiRequest('/health')
  },
}

// ===================================
// نظام الرواتب الجديد - APIs
// ===================================

// خدمة إدارة الموظفين
export const employeesApi = {
  // جلب جميع الموظفين
  getAll: (): Promise<Employee[]> => {
    return apiRequest('/employees')
  },

  // إضافة موظف جديد
  create: (data: Omit<Employee, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Promise<{ id: number; message: string; auto_salary_generated: boolean }> => {
    return apiRequest('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // تحديث بيانات موظف
  update: (id: number, data: Omit<Employee, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Promise<{ message: string }> => {
    return apiRequest(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // حذف موظف (إلغاء التفعيل)
  delete: (id: number): Promise<{ message: string }> => {
    return apiRequest(`/employees/${id}`, {
      method: 'DELETE',
    })
  },
}

// خدمة إدارة الرواتب الشهرية
export const salariesApi = {
  // جلب الرواتب مع إمكانية الفلترة
  getAll: (filters?: { month?: number; year?: number }): Promise<MonthlySalary[]> => {
    const params = new URLSearchParams()
    if (filters?.month) params.append('month', filters.month.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const queryString = params.toString()
    return apiRequest(`/salaries${queryString ? `?${queryString}` : ''}`)
  },

  // توليد رواتب شهر معين
  generate: (data: { month: number; year: number }): Promise<{ message: string; generated: number; existing: number; total_employees: number }> => {
    return apiRequest('/salaries/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // تحديث حالة التسليم للراتب
  updateDelivery: (id: number, data: { is_delivered: boolean; delivery_date?: string; debt_amount?: number; notes?: string }): Promise<{ message: string }> => {
    return apiRequest(`/salaries/${id}/delivery`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // تعديل راتب شهري مباشرة
  update: (id: number, data: { salary_amount: number; is_delivered?: boolean; delivery_date?: string; debt_amount?: number; notes?: string }): Promise<{ message: string }> => {
    return apiRequest(`/salaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // حذف راتب شهري
  delete: (id: number): Promise<{ message: string }> => {
    return apiRequest(`/salaries/${id}`, {
      method: 'DELETE',
    })
  },

  // مزامنة رواتب موظف مع راتبه الحالي
  syncEmployee: (employeeId: number, data?: { fromMonth?: number; fromYear?: number }): Promise<{ message: string; updated_count: number; new_salary: number }> => {
    return apiRequest(`/salaries/sync-employee/${employeeId}`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  },
}

// خدمة إدارة عناصر المشروع (مستقلة)
export const projectItemApi = {
  // جلب جميع عناصر المشروع
  getProjectItems: (): Promise<ProjectItem[]> => {
    return apiRequest('/project-items')
  },

  // جلب عنصر مشروع واحد
  getProjectItem: (id: number): Promise<ProjectItem> => {
    return apiRequest(`/project-items/${id}`)
  },

  // إضافة عنصر مشروع جديد
  createProjectItem: (data: CreateProjectItemData): Promise<CreateEntityResponse> => {
    return apiRequest('/project-items', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // تحديث عنصر مشروع
  updateProjectItem: (id: number, data: Partial<CreateProjectItemData>): Promise<{ message: string }> => {
    return apiRequest(`/project-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // حذف عنصر مشروع
  deleteProjectItem: (id: number): Promise<{ message: string }> => {
    return apiRequest(`/project-items/${id}`, {
      method: 'DELETE',
    })
  },
}

// خدمة إدارة طرق الدفع (مستقلة)
export const paymentMethodApi = {
  // جلب جميع طرق الدفع
  getPaymentMethods: (): Promise<PaymentMethod[]> => {
    return apiRequest('/payment-methods')
  },

  // جلب طريقة دفع واحدة
  getPaymentMethod: (id: number): Promise<PaymentMethod> => {
    return apiRequest(`/payment-methods/${id}`)
  },

  // إضافة طريقة دفع جديدة
  createPaymentMethod: (data: CreatePaymentMethodData): Promise<CreateEntityResponse> => {
    return apiRequest('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // تحديث طريقة دفع
  updatePaymentMethod: (id: number, data: Partial<CreatePaymentMethodData>): Promise<{ message: string }> => {
    return apiRequest(`/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // حذف طريقة دفع
  deletePaymentMethod: (id: number): Promise<{ message: string }> => {
    return apiRequest(`/payment-methods/${id}`, {
      method: 'DELETE',
    })
  },
}

// خدمة إدارة أنواع المشاريع (مستقلة)
export const projectTypeApi = {
  // جلب جميع أنواع المشاريع
  getProjectTypes: (): Promise<ProjectType[]> => {
    return apiRequest('/project-types')
  },

  // جلب نوع مشروع واحد
  getProjectType: (id: number): Promise<ProjectType> => {
    return apiRequest(`/project-types/${id}`)
  },

  // إضافة نوع مشروع جديد
  createProjectType: (data: CreateProjectTypeData): Promise<CreateEntityResponse> => {
    return apiRequest('/project-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // تحديث نوع مشروع
  updateProjectType: (id: number, data: Partial<CreateProjectTypeData>): Promise<{ message: string }> => {
    return apiRequest(`/project-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // حذف نوع مشروع
  deleteProjectType: (id: number): Promise<{ message: string }> => {
    return apiRequest(`/project-types/${id}`, {
      method: 'DELETE',
    })
  },
}
