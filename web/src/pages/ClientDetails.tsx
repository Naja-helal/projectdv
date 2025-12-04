import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientsApi, projectsApi, projectItemsApi } from '@/lib/supabaseApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,

  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Hash,

  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  console.log('🚀 ClientDetails page loaded! ID:', id);

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      console.log('🔍 Fetching client with id:', id);
      const clients = await clientsApi.getAll();
      console.log('👥 All clients:', clients);
      const foundClient = clients.find(c => c.id === Number(id));
      console.log('✅ Found client:', foundClient);
      return foundClient;
    },
    enabled: !!id,
  });

  // جلب مشاريع العميل
  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  // جلب تصنيفات المشاريع
  const { data: projectItems = [] } = useQuery({
    queryKey: ['project-items'],
    queryFn: projectItemsApi.getAll,
  });

  // فلترة المشاريع الخاصة بالعميل وإضافة بيانات التصنيف
  const clientProjects = allProjects
    .filter(p => p.client_id === Number(id))
    .map(project => {
      const projectItem = projectItems.find(item => item.id === project.project_item_id);
      return {
        ...project,
        project_item_name: projectItem?.name || project.project_item_name,
        project_item_icon: projectItem?.icon || project.project_item_icon,
      };
    });
  console.log('📁 Client projects:', clientProjects);

  // حساب الإحصائيات
  const statistics = {
    total: clientProjects.length,
    active: clientProjects.filter(p => p.status === 'active').length,
    completed: clientProjects.filter(p => p.status === 'completed').length,
    onHold: clientProjects.filter(p => p.status === 'on_hold').length,
    cancelled: clientProjects.filter(p => p.status === 'cancelled').length,
    totalBudget: clientProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            حدث خطأ في تحميل بيانات العميل
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/clients')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">تفاصيل العميل</h1>
        </div>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-4xl"
                style={{ backgroundColor: (client.color || '#3b82f6') + '20' }}
              >
                {client.icon || '👤'}
              </div>
              <div>
                <CardTitle className="text-2xl">{client.name}</CardTitle>
                {client.code && (
                  <p className="text-sm text-gray-500 mt-1">
                    الكود: {client.code}
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant={client.is_active ? 'default' : 'secondary'}
              className="text-sm"
            >
              {client.is_active ? 'نشط' : 'غير نشط'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">رقم الهاتف</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">البريد الإلكتروني</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">العنوان</p>
                  <p className="font-medium">{client.address}</p>
                </div>
              </div>
            )}

            {client.contact_person && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">الشخص المسؤول</p>
                  <p className="font-medium">{client.contact_person}</p>
                </div>
              </div>
            )}

            {client.tax_number && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Hash className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">الرقم الضريبي</p>
                  <p className="font-medium">{client.tax_number}</p>
                </div>
              </div>
            )}
          </div>

          {client.notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">ملاحظات</p>
              <p className="text-sm">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-xs text-blue-600 mb-1">إجمالي المشاريع</p>
          <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-xs text-green-600 mb-1">نشط</p>
          <p className="text-2xl font-bold text-green-900">{statistics.active}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <p className="text-xs text-indigo-600 mb-1">مكتمل</p>
          <p className="text-2xl font-bold text-indigo-900">{statistics.completed}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <p className="text-xs text-yellow-600 mb-1">متوقف</p>
          <p className="text-2xl font-bold text-yellow-900">{statistics.onHold}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <p className="text-xs text-red-600 mb-1">ملغي</p>
          <p className="text-2xl font-bold text-red-900">{statistics.cancelled}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <p className="text-xs text-purple-600 mb-1">إجمالي الميزانيات</p>
          <p className="text-lg font-bold text-purple-900">{(statistics.totalBudget / 1000).toFixed(0)}K ر.س</p>
        </Card>
      </div>

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle>المشاريع ({clientProjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clientProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مشاريع لهذا العميل</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientProjects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {project.name}
                          </h3>
                          <Badge
                            variant={
                              project.status === 'completed'
                                ? 'default'
                                : project.status === 'active'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {project.status === 'completed'
                              ? 'مكتمل'
                              : project.status === 'active'
                              ? 'نشط'
                              : project.status === 'on_hold'
                              ? 'متوقف'
                              : 'ملغي'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">الميزانية</p>
                            <p className="font-semibold">
                              {project.budget?.toLocaleString() || 0} ريال
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">تاريخ البداية</p>
                            <p className="font-semibold">
                              {project.start_date
                                ? new Date(project.start_date).toLocaleDateString('ar-SA')
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">تاريخ النهاية</p>
                            <p className="font-semibold">
                              {project.end_date
                                ? new Date(project.end_date).toLocaleDateString('ar-SA')
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">التصنيف</p>
                            <p className="font-semibold">
                              {project.project_item_name || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
