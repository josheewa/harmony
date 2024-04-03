import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import Image from 'next/image'

export default function Dashboard() {
  const { user, error, isLoading } = useUser()
  const [rooms, setRooms] = useState({})
  // let username = user?.['harmony/username']

  const uuid = user?.['harmony/user_uuid']

  useEffect(() => {
    const fetchUserRooms = async (uuid) => {
      try {
        const response = await fetch('https://harmony.hasura.app/api/rest/getvisiblerooms', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
          },
          body: JSON.stringify({ uuid }),
        })

        const data = await response.json()
        setRooms(data.users[0].visible_rooms)
      } catch (error) {
        console.error(error)
      }
    }
    fetchUserRooms(uuid)
  }, [uuid])
  // checkUserByEmail(user.email)
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>{error.message}</div>

  return (
    user && (
      <div className="flex flex-col">
        <Image src={user.picture} alt={user.name} width={45} height={45} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <Link href="/api/auth/logout">Logout</Link>
        {Object.entries(rooms).map(([roomName, roomId]) => (
          <Link key={roomId} href={`/room/${roomId}`}>
            Room: {roomName}, RoomID: {roomId}
          </Link>
        ))}
      </div>
    )
  )
}
