"use client"

import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { CheckSquare } from 'lucide-react'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <CheckSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">TaskFlow</span>
          </div>
          <p className="text-muted-foreground">
            {isLogin ? 'Sign in to continue' : 'Create your account to get started'}
          </p>
        </div>

        {/* Auth Form */}
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}
