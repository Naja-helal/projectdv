import { Link, useLocation } from 'react-router-dom'
import { ReactNode, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, X } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'لوحة التحكم', href: '/', icon: '📊' },
  { name: 'المشاريع', href: '/projects', icon: '📁' },
  { name: 'المصروفات', href: '/expenses', icon: '💰' },
  { name: 'الإحصائيات والتقارير', href: '/statistics', icon: '📈' },
  { name: 'الفئات', href: '/categories', icon: '🏷️' },
  { name: 'عناصر المشاريع', href: '/project-items', icon: '📦' },
  { name: 'طرق الدفع', href: '/payment-methods', icon: '💳' },
  { name: 'أنواع المشاريع', href: '/project-types', icon: '📂' },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* الشريط العلوي */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile menu button */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMobileMenu}
                className="lg:hidden min-h-[44px] px-3"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              
              <div className="text-2xl">💼</div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">تطبيق إدارة المشاريع المتقدم</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">إدارة مشاريعك بكفاءة وفعالية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground hidden md:block">
                {new Date().toLocaleDateString('ar-SA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 min-h-[44px] px-2 sm:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
                <span className="sm:hidden">خروج</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* الشريط الجانبي للديسكتوب */}
        <aside className="hidden lg:block w-64 min-h-screen border-l bg-card">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:shadow-sm'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-50 bg-black/50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile menu sidebar */}
        <aside className={`lg:hidden fixed top-0 right-0 z-50 w-80 sm:w-64 h-full bg-card border-l shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-4 border-b bg-primary/5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                📱 القائمة الرئيسية
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="min-h-[44px] px-3"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <nav className="p-4 max-h-[calc(100vh-100px)] overflow-y-auto">
            <ul className="space-y-3">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[56px] ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:shadow-sm active:bg-primary/10'
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 text-right">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
