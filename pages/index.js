import Image from 'next/image'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser, loginWithRedirect } from '@auth0/nextjs-auth0/client'

const Home = () => {
  const { user, error, isLoading } = useUser()
  // const router = useRouter()
  // if (user) {
    // router.push('/dashboard'); // Redirect to dashboard if authenticated
  // }
  return (
    <div className="container">
      <h1>Home</h1>
      {user && <Link href="/api/auth/logout">Logout</Link>}
      {!user && <Link href="/api/auth/login">Login</Link>}
    </div>
  )
}

export default Home
