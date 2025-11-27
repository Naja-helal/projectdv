import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/lib/api';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Eye, Folder, AlertCircle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProjectForm from './ProjectForm';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // حالات البحث والفلترة والترقيم
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // جلب المشاريع
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.getProjects,
  });

  // حذف مشروع
  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    },
  });

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleView = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'completed':
        return 'مكتمل';
      case 'on_hold':
        return 'متوقف مؤقتاً';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // فلترة وبحث المشاريع
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter((project) => {
      // البحث بالاسم أو الكود
      const matchesSearch = 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.code && project.code.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // الفلترة بالحالة
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      // الفلترة بالنوع
      const matchesType = typeFilter === 'all' || project.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [projects, searchQuery, statusFilter, typeFilter]);

  // حساب الإحصائيات
  const statistics = useMemo(() => {
    if (!filteredProjects) return null;
    
    return {
      total: filteredProjects.length,
      active: filteredProjects.filter(p => p.status === 'active').length,
      completed: filteredProjects.filter(p => p.status === 'completed').length,
      onHold: filteredProjects.filter(p => p.status === 'on_hold').length,
      totalBudget: filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
      totalExpectedSpending: filteredProjects.reduce((sum, p) => sum + (p.expected_spending || 0), 0),
      totalSpent: filteredProjects.reduce((sum, p) => sum + (p.total_spent || 0), 0),
      overBudget: filteredProjects.filter(p => (p.completion_percentage || 0) >= 100).length,
    };
  }, [filteredProjects]);

  // ترقيم الصفحات
  const totalPages = Math.ceil((filteredProjects?.length || 0) / itemsPerPage);
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects?.slice(startIndex, startIndex + itemsPerPage) || [];
  }, [filteredProjects, currentPage, itemsPerPage]);

  // الحصول على الأنواع الفريدة
  const uniqueTypes = useMemo(() => {
    if (!projects) return [];
    const types = new Set(projects.map(p => p.type));
    return Array.from(types);
  }, [projects]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المشاريع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            المشاريع
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">إدارة المشاريع والميزانيات</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto gap-2 min-h-[48px]">
          <Plus className="h-4 w-4" />
          مشروع جديد
        </Button>
      </div>

      {/* إحصائيات مفصلة */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 sm:gap-3">
          <Card className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">إجمالي</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.total}</p>
              <p className="text-xs text-gray-400">مشروع</p>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 bg-green-50">
            <div className="text-center">
              <p className="text-xs text-green-600 mb-1">نشط</p>
              <p className="text-2xl font-bold text-green-700">{statistics.active}</p>
              <p className="text-xs text-green-500">مشروع</p>
            </div>
          </Card>
          <Card className="p-4 bg-blue-50">
            <div className="text-center">
              <p className="text-xs text-blue-600 mb-1">مكتمل</p>
              <p className="text-2xl font-bold text-blue-700">{statistics.completed}</p>
              <p className="text-xs text-blue-500">مشروع</p>
            </div>
          </Card>
          <Card className="p-4 bg-yellow-50">
            <div className="text-center">
              <p className="text-xs text-yellow-600 mb-1">متوقف</p>
              <p className="text-2xl font-bold text-yellow-700">{statistics.onHold}</p>
              <p className="text-xs text-yellow-500">مشروع</p>
            </div>
          </Card>
          <Card className="p-4 bg-red-50">
            <div className="text-center">
              <p className="text-xs text-red-600 mb-1">تجاوز</p>
              <p className="text-2xl font-bold text-red-700">{statistics.overBudget}</p>
              <p className="text-xs text-red-500">مشروع</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">قيمة العقود</p>
              <p className="text-xl font-bold text-blue-600">{(statistics.totalBudget / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-400">ر.س</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">إنفاق متوقع</p>
              <p className="text-xl font-bold text-indigo-600">{(statistics.totalExpectedSpending / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-400">ر.س</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">إنفاق فعلي</p>
              <p className="text-xl font-bold text-purple-600">{(statistics.totalSpent / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-400">ر.س</p>
            </div>
          </Card>
          <Card className="p-4 bg-emerald-50">
            <div className="text-center">
              <p className="text-xs text-emerald-600 mb-1">ربح متوقع</p>
              <p className="text-xl font-bold text-emerald-700">
                {(statistics.totalBudget - statistics.totalExpectedSpending).toLocaleString()}
              </p>
              <p className="text-xs text-emerald-500">ر.س</p>
            </div>
          </Card>
        </div>
      )}

      {/* شريط البحث والفلترة */}
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          {/* البحث */}
          <div className="md:col-span-2">
            <Label htmlFor="search" className="text-xs sm:text-sm mb-2 block">بحث</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="ابحث بالاسم أو الكود..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pr-10 min-h-[44px] text-sm sm:text-base"
              />
            </div>
          </div>

          {/* فلترة الحالة */}
          <div>
            <Label htmlFor="status" className="text-xs sm:text-sm mb-2 block">الحالة</Label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-3 border rounded-md text-sm sm:text-base min-h-[44px]"
            >
              <option value="all">الكل</option>
              <option value="active">نشط</option>
              <option value="completed">مكتمل</option>
              <option value="on_hold">متوقف مؤقتاً</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {/* فلترة النوع */}
          <div>
            <Label htmlFor="type" className="text-xs sm:text-sm mb-2 block">النوع</Label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-3 border rounded-md text-sm sm:text-base min-h-[44px]"
            >
              <option value="all">الكل</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* عدد النتائج وحجم الصفحة */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>عرض {paginatedProjects.length} من {filteredProjects.length} مشروع</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="perPage" className="text-sm">عدد العناصر:</Label>
            <select
              id="perPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1 border rounded text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </Card>

      {/* قائمة المشاريع */}
      {!paginatedProjects || paginatedProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filteredProjects.length === 0 && (projects?.length || 0) > 0 
              ? 'لا توجد نتائج للبحث' 
              : 'لا توجد مشاريع'}
          </h3>
          <p className="text-gray-600 mb-4">
            {filteredProjects.length === 0 && (projects?.length || 0) > 0 
              ? 'جرب تغيير معايير البحث أو الفلترة' 
              : 'ابدأ بإضافة مشروع جديد لتتبع الميزانيات والمصروفات'}
          </p>
          {filteredProjects.length === 0 && (projects?.length || 0) > 0 ? (
            <Button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); }}>
              إعادة تعيين الفلترة
            </Button>
          ) : (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة مشروع جديد
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {paginatedProjects.map((project) => {
            const completionPercentage = project.completion_percentage || 0;
            const remaining = (project.budget || 0) - (project.total_spent || 0);

            return (
              <Card
                key={project.id}
                className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                style={{ borderRight: `4px solid ${project.color || '#3b82f6'}` }}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                  <div className="flex-1 w-full" onClick={() => handleView(project)}>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{project.name}</h3>
                      {project.code && (
                        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {project.code}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {project.type}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-gray-600 mb-3 text-xs sm:text-sm">{project.description}</p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">قيمة العقد</p>
                        <p className="text-base sm:text-lg font-bold text-blue-600">
                          {(project.budget || 0).toLocaleString()} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">الإنفاق المتوقع</p>
                        <p className="text-base sm:text-lg font-bold text-indigo-600">
                          {(project.expected_spending || 0).toLocaleString()} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">الإنفاق الفعلي</p>
                        <p className="text-base sm:text-lg font-bold text-purple-600">
                          {(project.total_spent || 0).toLocaleString()} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">المتبقي</p>
                        <p className={`text-base sm:text-lg font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {remaining.toLocaleString()} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">نسبة الإنجاز</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          {completionPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">الربح المتوقع</p>
                        <p className="text-base sm:text-lg font-bold text-emerald-600">
                          {((project.budget || 0) - (project.expected_spending || 0)).toLocaleString()} ر.س
                        </p>
                      </div>
                    </div>

                    {/* شريط التقدم */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div
                        className={`h-2.5 rounded-full transition-all ${getProgressColor(completionPercentage)}`}
                        style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                      ></div>
                    </div>

                    {completionPercentage >= 100 && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>تجاوز الميزانية المحددة</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(project)}
                      className="text-blue-600 hover:text-blue-700 min-h-[40px] w-10 sm:w-auto p-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(project)}
                      className="text-gray-600 hover:text-gray-700 min-h-[40px] w-10 sm:w-auto p-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project)}
                      className="text-red-600 hover:text-red-700 min-h-[40px] w-10 sm:w-auto p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          </div>

          {/* نظام الترقيم */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-2"
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // عرض الصفحات: الأولى، الأخيرة، الحالية، وصفحتين قبل وبعد الحالية
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-2"
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* نافذة إضافة مشروع */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>إضافة مشروع جديد</DialogTitle>
            <DialogDescription>أدخل معلومات المشروع والميزانية المخصصة</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <ProjectForm onSuccess={() => setIsAddDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل مشروع */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>تعديل المشروع</DialogTitle>
            <DialogDescription>تحديث معلومات المشروع</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            {selectedProject && (
              <ProjectForm
                project={selectedProject}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setSelectedProject(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المشروع؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المشروع "{selectedProject?.name}" وجميع عناصره. المصروفات المرتبطة بالمشروع لن يتم حذفها
              ولكن سيتم إزالة ارتباطها بالمشروع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProject && deleteMutation.mutate(selectedProject.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
