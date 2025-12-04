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
    console.log('📊 [categoriesApi.getAll] Fetching categories...');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ [categoriesApi.getAll] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [categoriesApi.getAll] Success:', data?.length, 'categories');
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
    console.log('📝 [categoriesApi.create] Creating category:', category);
    const { data, error} = await supabase
      .from('categories')
      .insert([{
        name: category.name,
        description: category.description || null,
        color: category.color || '#3B82F6'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ [categoriesApi.create] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [categoriesApi.create] Success:', data);
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
    console.log('📁 [projectsApi.getAll] Fetching projects...');
    const { data, error } = await supabase
      .from('projects')
      .select('*, client:clients(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ [projectsApi.getAll] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [projectsApi.getAll] Success:', data?.length, 'projects');
    console.log('📋 [projectsApi.getAll] Projects data:', data);
    
    // تحويل البيانات لإضافة الحقول المشتقة
    return (data || []).map((project: any) => ({
      ...project,
      client_name: project.client?.name,
      client_icon: project.client?.icon,
    }));
  },

  async create(project: CreateProjectData): Promise<Project> {
    console.log('📝 [projectsApi.create] Creating project:', project);
    
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select('*, client:clients(*)')
      .single();
    
    if (error) {
      console.error('❌ [projectsApi.create] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [projectsApi.create] Success:', data);
    
    // تحويل البيانات لإضافة الحقول المشتقة
    const enrichedData = {
      ...data,
      client_name: (data as any).client?.name,
      client_icon: (data as any).client?.icon,
    };
    return enrichedData as Project;
  },

  async update(id: number, updates: Partial<CreateProjectData>): Promise<Project> {
    console.log('✏️ [projectsApi.update] Updating project:', id, updates);
    
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(*)')
      .single();
    
    if (error) {
      console.error('❌ [projectsApi.update] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [projectsApi.update] Success:', data);
    
    // تحويل البيانات لإضافة الحقول المشتقة
    const enrichedData = {
      ...data,
      client_name: (data as any).client?.name,
      client_icon: (data as any).client?.icon,
    };
    return enrichedData as Project;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  // تفعيل/إيقاف مشاركة المشروع
  async toggleShare(id: number, isShared: boolean): Promise<Project> {
    console.log('🔗 [projectsApi.toggleShare] Toggling share:', id, isShared);
    
    // أولاً: تحديث حالة المشاركة
    const { data: updateData, error: updateError, count } = await supabase
      .from('projects')
      .update({ is_shared: isShared })
      .eq('id', id)
      .select();
    
    console.log('📊 [projectsApi.toggleShare] Update result:', { updateData, count, error: updateError });
    
    if (updateError) {
      console.error('❌ [projectsApi.toggleShare] Update error:', updateError);
      throw new Error(updateError.message);
    }
    
    if (!updateData || updateData.length === 0) {
      console.error('❌ [projectsApi.toggleShare] No rows updated! RLS might be blocking.');
      throw new Error('فشل في تحديث المشروع - قد تكون هناك مشكلة في الصلاحيات');
    }
    
    console.log('✅ [projectsApi.toggleShare] Update successful, fetching updated data...');
    
    // ثانياً: جلب البيانات المحدثة
    const { data, error: fetchError } = await supabase
      .from('projects')
      .select('*, client:clients(*)')
      .eq('id', id)
      .single();
    
    if (fetchError || !data) {
      console.error('❌ [projectsApi.toggleShare] Fetch error:', fetchError);
      throw new Error(fetchError?.message || 'فشل في جلب البيانات المحدثة');
    }
    
    console.log('✅ [projectsApi.toggleShare] Success:', data);
    console.log('📌 [projectsApi.toggleShare] is_shared value:', data.is_shared);
    
    const enrichedData = {
      ...data,
      client_name: (data as any).client?.name,
      client_icon: (data as any).client?.icon,
    };
    return enrichedData as Project;
  },

  // جلب مشروع للمشاركة العامة (بدون حماية)
  async getShared(id: number): Promise<Project | null> {
    console.log('🌐 [projectsApi.getShared] Fetching shared project:', id);
    
    try {
      // أولاً: جلب المشروع الأساسي
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      console.log('📊 [projectsApi.getShared] Project data:', projectData);
      console.log('📊 [projectsApi.getShared] Project error:', projectError);
      
      if (projectError) {
        console.error('❌ [projectsApi.getShared] Error details:', {
          message: projectError.message,
          details: projectError.details,
          hint: projectError.hint,
          code: projectError.code
        });
        return null;
      }
      
      if (!projectData) {
        console.log('⚠️ [projectsApi.getShared] Project not found');
        return null;
      }
      
      // التحقق من حالة المشاركة
      if (!projectData.is_shared) {
        console.log('⚠️ [projectsApi.getShared] Project is not shared');
        return null;
      }
      
      // جلب بيانات العميل إذا وجد
      let clientData = null;
      if (projectData.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', projectData.client_id)
          .maybeSingle();
        clientData = client;
      }
      
      console.log('✅ [projectsApi.getShared] Success:', projectData);
      
      const enrichedData = {
        ...projectData,
        client_name: clientData?.name,
        client_icon: clientData?.icon,
      };
      return enrichedData as Project;
    } catch (err) {
      console.error('❌ [projectsApi.getShared] Unexpected error:', err);
      return null;
    }
  }
};

// ==================== Project Items API ====================

export const projectItemsApi = {
  async getAll(): Promise<ProjectItem[]> {
    console.log('📦 [projectItemsApi.getAll] Fetching project items...');
    const { data, error } = await supabase
      .from('project_items')
      .select('*, unit:units(*)')
      .order('created_at', { ascending: false});
    
    if (error) {
      console.error('❌ [projectItemsApi.getAll] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [projectItemsApi.getAll] Success:', data?.length, 'items');
    return data || [];
  },

  async create(item: CreateProjectItemData): Promise<ProjectItem> {
    console.log('📝 [projectItemsApi.create] Creating project item:', item);
    const { data, error } = await supabase
      .from('project_items')
      .insert([item])
      .select()
      .single();
    
    if (error) {
      console.error('❌ [projectItemsApi.create] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [projectItemsApi.create] Success:', data);
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
    console.log('📏 [unitsApi.getAll] Fetching units...');
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ [unitsApi.getAll] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [unitsApi.getAll] Success:', data?.length, 'units');
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
    console.log('💳 [paymentMethodsApi.getAll] Fetching payment methods...');
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ [paymentMethodsApi.getAll] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [paymentMethodsApi.getAll] Success:', data?.length, 'methods');
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
    console.log('👥 [clientsApi.getAll] Fetching clients...');
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ [clientsApi.getAll] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [clientsApi.getAll] Success:', data?.length, 'clients');
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

// ==================== Expected Expenses API ====================

export const expectedExpensesApi = {
  // جلب كل الإنفاق المتوقع - مطابق لـ expensesApi
  async getAll() {
    console.log('💸 [expectedExpensesApi.getAll] Fetching expected expenses...');
    const { data, error } = await supabase
      .from('expected_expenses')
      .select(`
        *,
        category:categories(*),
        project:projects(*),
        project_item:project_items(*),
        unit:units(*),
        payment_method:payment_methods(*)
      `)
      .order('expected_date', { ascending: false });
    
    if (error) {
      console.error('❌ [expectedExpensesApi.getAll] Error:', error);
      throw new Error(error.message);
    }
    console.log(`✅ [expectedExpensesApi.getAll] Success: ${data?.length || 0} expected expenses`);
    console.log('📋 [expectedExpensesApi.getAll] Expected expenses data:', data);
    return data || [];
  },

  // إنشاء إنفاق متوقع جديد
  async create(expectedExpense: any) {
    console.log('💸 [expectedExpensesApi.create] Creating expected expense...');
    console.log('💸 [expectedExpensesApi.create] Input data:', expectedExpense);
    
    // تحويل البيانات لتتوافق مع بنية الجدول
    const formattedData: any = {
      category_id: expectedExpense.categoryId,
      project_id: expectedExpense.projectId || null,
      project_item_id: expectedExpense.projectItemId || null,
      quantity: expectedExpense.quantity || null,
      unit_id: expectedExpense.unit_id || null,
      estimated_amount: expectedExpense.amount,
      expected_date: new Date(expectedExpense.date).toISOString().split('T')[0],
      description: expectedExpense.description || expectedExpense.details || null,
      notes: expectedExpense.notes || null,
      status: 'pending'
    };
    
    console.log('💸 [expectedExpensesApi.create] Formatted data:', formattedData);
    
    const { data, error } = await supabase
      .from('expected_expenses')
      .insert([formattedData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ [expectedExpensesApi.create] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [expectedExpensesApi.create] Success:', data);
    return data;
  },

  // تحديث إنفاق متوقع
  async update(id: number, updates: any) {
    console.log(`💸 [expectedExpensesApi.update] Updating expected expense ${id}...`);
    console.log('💸 [expectedExpensesApi.update] Updates data:', updates);
    
    // تحويل البيانات من صيغة CreateExpenseData إلى صيغة جدول expected_expenses
    // استخدام فقط الحقول الموجودة في الجدول
    const formattedUpdates: any = {
      category_id: updates.categoryId,
      project_id: updates.projectId || null,
      project_item_id: updates.projectItemId || null,
      quantity: updates.quantity || null,
      unit_id: updates.unit_id || null,
      estimated_amount: updates.amount,
      expected_date: new Date(updates.date).toISOString().split('T')[0], // تحويل timestamp إلى تاريخ
      description: updates.description || updates.details || null,
      notes: updates.notes || null,
      status: 'pending' // الحالة الافتراضية
    };
    
    console.log('💸 [expectedExpensesApi.update] Formatted updates:', formattedUpdates);
    
    const { data, error } = await supabase
      .from('expected_expenses')
      .update(formattedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ [expectedExpensesApi.update] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [expectedExpensesApi.update] Success:', data);
    return data;
  },

  // حذف إنفاق متوقع
  async delete(id: number): Promise<void> {
    console.log(`💸 [expectedExpensesApi.delete] Deleting expected expense ${id}...`);
    const { error } = await supabase
      .from('expected_expenses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ [expectedExpensesApi.delete] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [expectedExpensesApi.delete] Success');
  },

  // حذف عدة إنفاقات متوقعة
  async deleteMultiple(ids: number[]): Promise<void> {
    console.log(`💸 [expectedExpensesApi.deleteMultiple] Deleting ${ids.length} expected expenses...`);
    const { error } = await supabase
      .from('expected_expenses')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.error('❌ [expectedExpensesApi.deleteMultiple] Error:', error);
      throw new Error(error.message);
    }
    console.log('✅ [expectedExpensesApi.deleteMultiple] Success');
  }
};

