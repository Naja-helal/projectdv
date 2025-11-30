import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

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

    // مصادقة بسيطة بدون backend - التحقق من وجود الرمز فقط
    setIsAuthenticated(true)
    setIsLoading(false)
    return true
  }

  const refreshToken = async (): Promise<boolean> => {
    // لا حاجة للتجديد في النظام البسيط
    return isAuthenticated
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