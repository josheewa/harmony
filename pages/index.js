import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'

const Home = () => {
  const { user } = useUser()
  return (
    <>
      <div className="container">
        <h1>Home</h1>
        {user && (
          <div className="flex flex-col">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/api/auth/logout">Logout</Link>
          </div>
        )}
        {!user && <Link href="/api/auth/login">Login</Link>}
      </div>
    </>
  )
}

export default Home
