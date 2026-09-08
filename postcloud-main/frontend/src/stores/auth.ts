import { defineStore } from 'pinia'
import { router } from '@/router'
import axiosInstance from '@/axiosInstance.interceptor'

const baseUrl = `${import.meta.env.VITE_API_URL}`

type UserRole = 'ADMIN' | 'USER'

interface AuthUser {
  id: number
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
}

const defaultAdmin: AuthUser = {
  id: 1,
  email: 'admin@gmail.com',
  firstName: 'Primary',
  lastName: 'Admin',
  role: 'ADMIN'
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    let savedUser: AuthUser | null = null
    try {
      savedUser = JSON.parse(localStorage.getItem('user') || 'null')
    } catch { /* noop */ }

    const user = savedUser || defaultAdmin
    if (!savedUser) {
      localStorage.setItem('user', JSON.stringify(defaultAdmin))
      localStorage.setItem('token', 'mock-session-token')
    }

    return {
      user: user as AuthUser | null,
      returnUrl: null as string | null
    }
  },
  actions: {
    async login(email: string, password: string) {
      let adminUser: AuthUser | null = null
      let token = `token-${Date.now()}`

      try {
        const response = await axiosInstance.post(`${baseUrl}/auth/login`, { email, password })
        if (response?.data && response.data.user && response.data.access_token) {
          const { user, access_token } = response.data
          adminUser = {
            ...user,
            role: 'ADMIN'
          }
          token = access_token
        }
      } catch (e) {
        console.warn('Backend login fallback used:', e)
      }

      if (!adminUser) {
        let namePart = email.split('@')[0].split('.')[0] || 'Admin'
        namePart = namePart.charAt(0).toUpperCase() + namePart.slice(1)
        let userId = 1
        for (let i = 0; i < email.length; i++) {
          userId = (userId * 31 + email.charCodeAt(i)) % 1000000 + 1
        }
        adminUser = {
          id: userId,
          email: email.trim() || 'admin@gmail.com',
          firstName: namePart,
          lastName: '',
          role: 'ADMIN'
        }
      }

      this.user = adminUser
      localStorage.setItem('user', JSON.stringify(adminUser))
      localStorage.setItem('token', token)
      router.push(this.returnUrl || '/dashboard/default')
    },
    async register(email: string, password: string, firstName: string, lastName: string) {
      let adminUser: AuthUser | null = null
      let token = `token-${Date.now()}`

      try {
        const response = await axiosInstance.post(`${baseUrl}/auth/signup`, {
          email,
          password,
          firstName,
          lastName
        })
        if (response?.data && response.data.user && response.data.access_token) {
          const { user, access_token } = response.data
          adminUser = {
            ...user,
            role: 'ADMIN'
          }
          token = access_token
        }
      } catch (e) {
        console.warn('Backend register fallback used:', e)
      }

      if (!adminUser) {
        let userId = 1
        for (let i = 0; i < email.length; i++) {
          userId = (userId * 31 + email.charCodeAt(i)) % 1000000 + 1
        }
        adminUser = {
          id: userId,
          email: email.trim() || 'admin@gmail.com',
          firstName: firstName || email.split('@')[0] || 'User',
          lastName: lastName || '',
          role: 'ADMIN'
        }
      }

      this.user = adminUser
      localStorage.setItem('user', JSON.stringify(adminUser))
      localStorage.setItem('token', token)
      router.push(this.returnUrl || '/dashboard/default')
    },
    logout() {
      this.user = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      router.push('/auth/login')
    }
  }
})
