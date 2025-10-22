import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import { FaRocket } from 'react-icons/fa'
import { AiOutlineLogin } from 'react-icons/ai'

import { useUserData } from '@/components/InfoProvider'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Loading from '@/components/Loading'

const Home = () => {
  const { user, isLoading } = useUser()
  const userHookData = useUserData()
  const userData = userHookData?.users[0]
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/chat/dashboard')
    }
  }, [user, isLoading, router])
  return (
    <>
      {!user && !isLoading ? (
        <div className="home-container">
          <div className="home-content">
            <h1 className="home-title">Welcome to Harmony!</h1>
            <div className="home-banner">
              <p className="home-blurb">Connect with friends and the world around you on Harmony.</p>
            </div>
            <div className="home-auth-container">
              <Link
                href="/api/auth/login"
                className="discord-login-btn">
                <AiOutlineLogin size={20} className="mr-2" />
                Login
              </Link>
              <p className="text-white/80 text-sm mt-4">
                Join millions of users worldwide
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </>
  )
}

export default Home
