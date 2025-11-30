import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Plus, Edit, Trash2, Eye, Users, Search, ChevronLeft, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ClientForm from '@/components/forms/ClientForm';
import EditClientForm from '@/components/forms/EditClientForm';

export default function ClientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // حالات البحث والترقيم
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // جلب العملاء
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientApi.getClients,
  });

  // حذف عميل
  const deleteMutation = useMutation({
    mutationFn: clientApi.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
    },
    onError: (error: any) => {
      alert(error.message || 'حدث خطأ في حذف العميل');
    },
  });

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleView = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  // فلترة العملاء حسب البحث
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    return clients.filter(client => {
      const matchesSearch = searchQuery === '' || 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [clients, searchQuery]);

  // حساب الإحصائيات
  const statistics = useMemo(() => {
    if (!filteredClients) return null;
    
    return {
      total: filteredClients.length,
      totalProjects: filteredClients.reduce((sum, c) => sum + (c.projects_count || 0), 0),
      totalBudget: filteredClients.reduce((sum, c) => sum + (c.total_budget || 0), 0),
      activeProjects: filteredClients.reduce((sum, c) => sum + (c.active_projects || 0), 0),
    };
  }, [filteredClients]);

  // الترقيم
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            إدارة العملاء
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            إدارة بيانات العملاء ومشاريعهم
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="w-full sm:w-auto gap-2"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          إضافة عميل جديد
        </Button>
      </div>

      {/* الإحصائيات */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-600 font-medium">إجمالي العملاء</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1">{statistics.total}</p>
              </div>
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">إجمالي المشاريع</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-1">{statistics.totalProjects}</p>
              </div>
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-green-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-purple-600 font-medium">مشاريع نشطة</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-1">{statistics.activeProjects}</p>
              </div>
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-amber-600 font-medium">إجمالي الميزانيات</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-900 mt-1">
                  {statistics.totalBudget.toLocaleString()} ر.س
                </p>
              </div>
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-amber-400 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* البحث والفلترة */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث بالاسم، الرمز، الهاتف، أو البريد..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pr-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* قائمة العملاء */}
      {paginatedClients.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <Users className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            {filteredClients.length === 0 && (clients?.length || 0) > 0 
              ? 'لا توجد نتائج للبحث' 
              : 'لا يوجد عملاء'}
          </h3>
          <p className="text-gray-600 mb-4">
            {filteredClients.length === 0 && (clients?.length || 0) > 0 
              ? 'جرب تغيير معايير البحث' 
              : 'ابدأ بإضافة عميل جديد'}
          </p>
          {filteredClients.length === 0 && (clients?.length || 0) > 0 ? (
            <Button onClick={() => setSearchQuery('')}>
              إعادة تعيين البحث
            </Button>
          ) : (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عميل جديد
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {paginatedClients.map((client) => (
              <Card
                key={client.id}
                className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                style={{ borderRight: `4px solid ${client.color || '#3b82f6'}` }}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                  <div className="flex-1 w-full" onClick={() => handleView(client)}>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-2xl">{client.icon || '👤'}</span>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{client.name}</h3>
                      {client.code && (
                        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {client.code}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs text-gray-500">إجمالي المشاريع</p>
                        <p className="text-base sm:text-lg font-bold text-blue-600">
                          {client.projects_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">مشاريع نشطة</p>
                        <p className="text-base sm:text-lg font-bold text-green-600">
                          {client.active_projects || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">مشاريع مكتملة</p>
                        <p className="text-base sm:text-lg font-bold text-gray-600">
                          {client.completed_projects || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">إجمالي الميزانيات</p>
                        <p className="text-base sm:text-lg font-bold text-purple-600">
                          {(client.total_budget || 0).toLocaleString()} ر.س
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(client)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      عرض
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(client)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(client)}
                      className="flex-1 sm:flex-none"
                      disabled={client.id === 1} // لا يمكن حذف العميل التجريبي
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* الترقيم */}
          {totalPages > 1 && (
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    عرض {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredClients.length)} من {filteredClients.length}
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Button>
                  
                  <span className="text-sm text-gray-600 px-3">
                    {currentPage} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4 mr-1" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Dialog إضافة عميل */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات العميل الجديد
            </DialogDescription>
          </DialogHeader>
          <ClientForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog تعديل عميل */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات العميل</DialogTitle>
            <DialogDescription>
              تعديل بيانات {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <EditClientForm 
              client={selectedClient} 
              onSuccess={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog حذف عميل */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا العميل؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف العميل "{selectedClient?.name}" نهائياً.
              {selectedClient?.projects_count && selectedClient.projects_count > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  ⚠️ تنبيه: هذا العميل لديه {selectedClient.projects_count} مشروع مرتبط. 
                  لا يمكن حذف العميل حتى يتم نقل أو حذف جميع مشاريعه.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClient && deleteMutation.mutate(selectedClient.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending || (selectedClient?.projects_count || 0) > 0}
            >
              {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
