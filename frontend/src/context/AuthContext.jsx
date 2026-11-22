import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('clinic-user') || 'null')
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('clinic-token')))

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener('clinic:unauthorized', handleUnauthorized)

    if (localStorage.getItem('clinic-token')) {
      api.get('/auth/me')
        .then(({ data }) => {
          const nextUser = data.data
          setUser(nextUser)
          localStorage.setItem('clinic-user', JSON.stringify(nextUser))
        })
        .catch(() => {
          localStorage.removeItem('clinic-token')
          localStorage.removeItem('clinic-user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    return () => window.removeEventListener('clinic:unauthorized', handleUnauthorized)
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    async login(identifier, password) {
      const { data } = await api.post('/auth/login', { identifier, password, client: 'web' })
      localStorage.setItem('clinic-token', data.data.token)
      localStorage.setItem('clinic-user', JSON.stringify(data.data.user))
      setUser(data.data.user)
      return data.data.user
    },
    async logout() {
      try {
        await api.post('/auth/logout')
      } finally {
        localStorage.removeItem('clinic-token')
        localStorage.removeItem('clinic-user')
        setUser(null)
      }
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
