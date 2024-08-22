import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import { FaRocket } from 'react-icons/fa'
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
          <h1 className="home-title">Welcome to Harmony!</h1>
          <div className="home-banner">
            <p className="home-blurb">Connect with friends and the world around you on Harmony.</p>
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </>
  )
}

export default Home

/* <div className="home-auth-container">
          {user ? (
            <>
            <p className="home-welcome">Welcome back, {userData.username}!</p>
            <div className="home-logged-in">
            <Link href="/chat/dashboard" className="home-link home-dashboard-button">
            <FaRocket className="home-icon" /> Dashboard
            </Link>
            <Link href="/api/auth/logout" className="home-link home-logout-button">
            Logout
            </Link>
            </div>
            </>
            ) : (
              <Link href="/api/auth/login" className="home-link home-login-button">
              Login
              </Link>
              )}
              </div> */
