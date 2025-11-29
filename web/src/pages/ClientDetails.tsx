import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
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
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Hash,
  CreditCard,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientApi.getClient(Number(id)),
    enabled: !!id,
  });

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

  const Icon = {
    Building2,
    User,
    CreditCard,
    FileText,
    Phone,
    Mail,
    MapPin,
    Hash,
  }[client.icon || 'Building2'] || Building2;

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
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: client.color + '20' }}
              >
                <Icon className="h-8 w-8" style={{ color: client.color }} />
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

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>المشاريع ({client.projects?.length || 0})</CardTitle>
            <Button
              onClick={() => navigate('/projects/new', { state: { clientId: client.id } })}
            >
              إضافة مشروع جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!client.projects || client.projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مشاريع لهذا العميل</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.projects.map((project) => (
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
