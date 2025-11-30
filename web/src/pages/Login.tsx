import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, User } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // مصادقة بسيطة محلية
      if (username === 'admin' && password === 'A@asd123') {
        login('simple-admin-token')
        navigate('/', { replace: true })
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة')
      }
    } catch (error: any) {
      setError(error.message || 'خطأ في تسجيل الدخول')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 px-3 sm:px-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
            <div className="text-3xl">💼</div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🔐 تسجيل الدخول
          </CardTitle>
          <p className="text-base sm:text-lg text-muted-foreground font-medium mt-2">
            💼 تطبيق إدارة المشاريع المتقدم
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-4 rounded-xl text-base font-medium flex items-center gap-2">
                <span className="text-xl">❌</span>
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="username" className="text-base font-bold flex items-center gap-2">
                👤 اسم المستخدم
              </Label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-base p-4 pr-12 border-2 rounded-xl min-h-[56px] focus:border-blue-500"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-base font-bold flex items-center gap-2">
                🔒 كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-base p-4 pr-12 border-2 rounded-xl min-h-[56px] focus:border-blue-500"
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-h-[64px] shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? '⏳ جاري تسجيل الدخول...' : '🚀 تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-8 text-center text-base text-muted-foreground font-medium">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="flex items-center justify-center gap-2">
                🛠️ للدعم الفني تواصل مع المطور
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}