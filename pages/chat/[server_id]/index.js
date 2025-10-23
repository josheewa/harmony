import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import Loading from '@/components/Loading'
import { GET_SERVER_ROOMS, CHECK_USER_SERVER_PERMISSIONS } from '@/utils/Apollo/queries'
import { useQuery } from '@apollo/client'
import { useUserData } from '@/components/InfoProvider'

export default function ServerHome() {
  const router = useRouter()
  const { server_id } = router.query
  const { error: userError, isLoading: userLoading } = useUser()
  const [rooms, setRooms] = useState([])
  const userData = useUserData().users[0]
  // Query to get server rooms
  const { loading: getServerRoomsLoading, data: getServerRoomsData } = useQuery(GET_SERVER_ROOMS, {
    variables: { server_id },
  })

  // Query to check user permissions
  const {
    loading: checkPermissionsLoading,
    data: checkPermissionsData,
    error: checkPermissionsError,
  } = useQuery(CHECK_USER_SERVER_PERMISSIONS, {
    variables: { user_id: userData.id, server_id },
    skip: !userData || server_id === 'FMxYU3ZF', // Skip the query if user is not loaded or demo server
  })

  useEffect(() => {
    try {
      if (getServerRoomsData) {
        setRooms(getServerRoomsData.server_rooms)
      }
    } catch (error) {
      console.log('Failed to fetch rooms!')
      console.error(error)
    }
  }, [getServerRoomsData])

  useEffect(() => {
    if (rooms.length > 0) {
      router.push(`/chat/${server_id}/${rooms[0].room_id}`)
    }
  }, [rooms, router, server_id])

  useEffect(() => {
    // Allow access to demo server without permission check
    if (server_id === 'FMxYU3ZF') {
      return
    }
    if (checkPermissionsData && checkPermissionsData.user_servers.length === 0) {
      router.push('/unauthorized')
    }
  }, [checkPermissionsData, router, server_id])

  if (getServerRoomsLoading || userLoading || (checkPermissionsLoading && server_id !== 'FMxYU3ZF')) return <Loading />
  if (userError || (checkPermissionsError && server_id !== 'FMxYU3ZF'))
    return <div>{(userError || checkPermissionsError).message}</div>

  return <></>
}
