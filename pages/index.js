import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import { FaRocket } from 'react-icons/fa'
import { useUserData } from '@/components/InfoProvider'

const Home = () => {
  const { user } = useUser()
  const userHookData = useUserData()
  const userData = userHookData?.users[0]

  return (
    <>
      <div className="home-container">
        <h1 className="home-title">Welcome to Harmony!</h1>
        <div className="home-banner">
          <p className="home-blurb">Connect with friends and the world around you on Harmony.</p>
        </div>
        <div className="home-auth-container">
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
        </div>
      </div>
    </>
  )
}

export default Home
