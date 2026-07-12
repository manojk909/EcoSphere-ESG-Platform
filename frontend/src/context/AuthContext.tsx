import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  departmentId: string
  xp: number
  pointsBalance: number
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

interface SignupData {
  name: string
  email: string
  password: string
  departmentId: string
}

interface AuthResponse {
  token: string
  user: User
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  useEffect(() => {
    const storedToken = localStorage.getItem('ecosphere_token')
    const storedUser = localStorage.getItem('ecosphere_user')

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User
        api.setToken(storedToken)
        setState({ user, token: storedToken, isLoading: false })
      } catch {
        localStorage.removeItem('ecosphere_token')
        localStorage.removeItem('ecosphere_user')
        setState({ user: null, token: null, isLoading: false })
      }
    } else {
      setState({ user: null, token: null, isLoading: false })
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password })
    const { token, user } = response

    api.setToken(token)
    localStorage.setItem('ecosphere_token', token)
    localStorage.setItem('ecosphere_user', JSON.stringify(user))
    setState({ user, token, isLoading: false })
  }, [])

  const signup = useCallback(async (data: SignupData) => {
    const response = await api.post<AuthResponse>('/auth/signup', data)
    const { token, user } = response

    api.setToken(token)
    localStorage.setItem('ecosphere_token', token)
    localStorage.setItem('ecosphere_user', JSON.stringify(user))
    setState({ user, token, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    api.setToken(null)
    localStorage.removeItem('ecosphere_token')
    localStorage.removeItem('ecosphere_user')
    setState({ user: null, token: null, isLoading: false })
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    isAuthenticated: !!state.token && !!state.user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
