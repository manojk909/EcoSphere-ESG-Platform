import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Leaf, Mail, Lock, User, Building2, Loader2, AlertCircle } from 'lucide-react'

interface Department {
  _id: string
  name: string
}

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await api.get<Department[]>('/departments')
        setDepartments(data)
      } catch {
        // Departments will be empty — user can still enter manually or API is down
        setDepartments([])
      }
    }
    fetchDepartments()
  }, [])

  const validateForm = (): string | null => {
    if (!name.trim()) return 'Please enter your full name'
    if (!email.trim()) return 'Please enter your email address'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address'
    if (!password) return 'Please enter a password'
    if (password.length < 8) return 'Password must be at least 8 characters long'
    if (password !== confirmPassword) return 'Passwords do not match'
    if (!departmentId) return 'Please select a department'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    try {
      await signup({ name, email, password, departmentId })
      navigate('/')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Signup failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-social-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-env-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gov-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-env-primary to-emerald-600 shadow-lg shadow-env-primary/25 mb-4">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            EcoSphere
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Create your account
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Get started</CardTitle>
            <CardDescription>
              Join your organization&apos;s sustainability journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-danger/5 border border-danger/20 text-danger text-sm animate-in fade-in-0 slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label>Department</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary z-10 pointer-events-none" />
                  <Select value={departmentId} onValueChange={setDepartmentId} disabled={isLoading}>
                    <SelectTrigger className="pl-9">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="default" disabled>
                          No departments available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-text-secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-env-primary hover:text-env-primary/80 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-text-secondary mt-6">
          &copy; 2026 EcoSphere. Sustainable by design.
        </p>
      </div>
    </div>
  )
}
