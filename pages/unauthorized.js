import { useRouter } from 'next/router'
import Link from 'next/link'

const Unauthorized = () => {
  const router = useRouter()

  return (
    <div className="unauth-container">
      <h1 className="unauth-title">Unauthorized Access</h1>
      <p className="unauth-text">You do not have permission to access this page.</p>
      <button onClick={() => router.push('/')} className="unauth-btn">
        Go to Home
      </button>
      <p className="unauth-text">or</p>
      <Link href="/api/auth/login" className="unauth-link">
        Login with another account
      </Link>
    </div>
  )
}

export default Unauthorized
