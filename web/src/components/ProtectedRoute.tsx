import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ReactNode, useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, checkAuth } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth()
      setIsChecking(false)
    }
    
    verifyAuth()
  }, [checkAuth])

  // عرض شاشة تحميل أثناء التحقق
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">💼 تطبيق إدارة المشاريع المتقدم</h2>
            <p className="text-lg text-gray-600 font-medium">جاري التحقق من صحة الاتصال...</p>
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}