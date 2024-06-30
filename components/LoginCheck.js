import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import Loading from './Loading'

const LoginCheck = ({ children }) => {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      const currentPath = router.pathname
      if (currentPath !== '/' && !user) {
        router.push('/api/auth/login')
      }
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return <Loading />
  }

  return <>{children}</>
}

export default LoginCheck
