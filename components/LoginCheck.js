import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import Loading from './Loading'

const LoginCheck = ({ children }) => {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (router.pathname !== '/' && !user) {
        router.push('/api/auth/login')
      }
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    if (router.pathname !== '/') {
      return <Loading />
    }
  }

  return <>{children}</>
}

export default LoginCheck
