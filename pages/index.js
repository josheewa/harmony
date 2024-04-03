import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'

const Home = () => {
  const { user } = useUser()
  return (
    <div className="container">
      <h1>Home</h1>
      {user && <Link href="/api/auth/logout">Logout</Link>}
      {!user && <Link href="/api/auth/login">Login</Link>}
    </div>
  )
}

export default Home
