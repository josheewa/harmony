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
          <h1 className="home-title">Welcome to Harmony!</h1>
          <div className="home-banner">
            <p className="home-blurb">Connect with friends and the world around you on Harmony.</p>
          </div>
          <Link
            href="/api/auth/login"
            className="flex items-center text-white py-2 px-4 rounded-full mb-4 hover:bg-opacity-75 bg-cyan-500 hover:bg-cyan-700">
            Login <AiOutlineLogin size={20} className="ml-1" />
          </Link>
        </div>
      ) : (
        <Loading />
      )}
    </>
  )
}

export default Home
