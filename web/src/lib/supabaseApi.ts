import { supabase } from './supabase';
import type {
  Category,
  CreateCategoryData,
  Expense,
  CreateExpenseData,
  Project,
  CreateProjectData,
  ProjectItem,
  CreateProjectItemData,
  Unit,
  PaymentMethod,
  CreatePaymentMethodData,
  Client,
  CreateClientData
} from '@/types';

// ==================== Categories API ====================

export const categoriesApi = {
  // جلب كل الفئات
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  // جلب فئة بالـ ID
  async getById(id: number): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  // إنشاء فئة جديدة
  async create(category: CreateCategoryData): Promise<Category> {
    const { data, error} = await supabase
      .from('categories')
      .insert([{
        name: category.name,
        description: category.description || null,
        color: category.color || '#3B82F6'
      }])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  // تحديث فئة
  async update(id: number, updates: Partial<CreateCategoryData>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  // حذف فئة
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
};

// ==================== Expenses API ====================

export const expensesApi = {
  // جلب كل المصروفات
  async getAll(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*),
        project:projects(*),
        project_item:project_items(*),
        unit:units(*),
        payment_method:payment_methods(*)
      `)
      .order('expense_date', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  // إنشاء مصروف جديد
  async create(expense: CreateExpenseData): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  // تحديث مصروف
  async update(id: number, updates: Partial<CreateExpenseData>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  // حذف مصروف
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
};

// ==================== Projects API ====================

export const projectsApi = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, client:clients(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async create(project: CreateProjectData): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: number, updates: Partial<CreateProjectData>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
};

// ==================== Project Items API ====================

export const projectItemsApi = {
  async getAll(): Promise<ProjectItem[]> {
    const { data, error } = await supabase
      .from('project_items')
      .select('*, project:projects(*), unit:units(*)')
      .order('created_at', { ascending: false});
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async create(item: CreateProjectItemData): Promise<ProjectItem> {
    const { data, error } = await supabase
      .from('project_items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: number, updates: Partial<CreateProjectItemData>): Promise<ProjectItem> {
    const { data, error } = await supabase
      .from('project_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('project_items')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
};

// ==================== Units API ====================

export const unitsApi = {
  async getAll(): Promise<Unit[]> {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async create(unit: { name: string; symbol?: string }): Promise<Unit> {
    const { data, error } = await supabase
      .from('units')
      .insert([unit])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: number, updates: { name?: string; symbol?: string }): Promise<Unit> {
    const { data, error } = await supabase
      .from('units')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
};

// ==================== Payment Methods API ====================

export const paymentMethodsApi = {
  async getAll(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async create(method: CreatePaymentMethodData): Promise<PaymentMethod> {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([method])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: number, updates: Partial<CreatePaymentMethodData>): Promise<PaymentMethod> {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
};

// ==================== Clients API ====================

export const clientsApi = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async create(client: CreateClientData): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: number, updates: Partial<CreateClientData>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
};

