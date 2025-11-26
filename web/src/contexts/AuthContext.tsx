import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api'

interface AuthContextType {
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
  checkAuth: () => Promise<boolean>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      setIsAuthenticated(false)
      setIsLoading(false)
      return false
    }

    try {
      // التحقق من صلاحية الرمز مع الخادم
      const response = await fetch(`${API_BASE}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setIsLoading(false)
        return true
      } else {
        // إذا كان الرمز غير صالح، جرب تجديده
        const refreshed = await refreshToken()
        setIsLoading(false)
        return refreshed
      }
    } catch (error) {
      console.error('خطأ في التحقق من الصلة:', error)
      logout()
      setIsLoading(false)
      return false
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      return false
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('adminToken', data.token)
        setIsAuthenticated(true)
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('خطأ في تجديد الرمز:', error)
      logout()
      return false
    }
  }

  const login = (token: string) => {
    localStorage.setItem('adminToken', token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
  }

  useEffect(() => {
    checkAuth()
    
    // إعداد تجديد تلقائي كل 30 دقيقة
    const refreshInterval = setInterval(() => {
      if (isAuthenticated) {
        refreshToken()
      }
    }, 30 * 60 * 1000) // 30 دقيقة

    return () => clearInterval(refreshInterval)
  }, [])

  // عرض شاشة تحميل أثناء التحقق من الصلة
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من صلة الاتصال...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, checkAuth, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}