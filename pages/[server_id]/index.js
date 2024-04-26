import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import Image from 'next/image'
import Loading from '@/components/Loading'
import { toast } from 'react-toastify'
import { generate8CharId } from '@/utils/functions'
import {
  GET_USER_ROOMS,
  CREATE_NEW_ROOM,
  DELETE_ROOM,
  GET_SERVER_ROOMS,
  FETCH_SERVER_NAME,
} from '../../utils/Apollo/queries'
import { useQuery, useMutation } from '@apollo/client'
import Head from 'next/head'

export default function ServerHome() {
  const router = useRouter()
  const { server_id } = router.query
  const { user, error, isLoading } = useUser()
  const [rooms, setRooms] = useState([])

  const { loading: serverNameLoading, data: serverNameData } = useQuery(FETCH_SERVER_NAME, {
    variables: { server_id },
  })

  let serverName
  if (serverNameData && serverNameData.servers && serverNameData.servers.length > 0) {
    serverName = serverNameData.servers[0].server_name
  }

  const { loading: getServerRoomsLoading, data: getServerRoomsData } = useQuery(GET_SERVER_ROOMS, {
    variables: { server_id },
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

  const [newRoomInputOpen, setRoomInputOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  const [createNewRoom] = useMutation(CREATE_NEW_ROOM)
  const handleCreateNewRoom = async () => {
    const room_id = generate8CharId()

    try {
      await createNewRoom({
        variables: {
          room_id,
          room_name: newRoomName,
          server_id,
        },
        refetchQueries: [{ query: GET_SERVER_ROOMS, variables: { server_id } }],
      })
      setNewRoomName('')
    } catch (error) {
      toast.error('Failed to create room! Please try again.')
      console.error(error)
    }
  }

  const openRoomInput = () => {
    setRoomInputOpen(true)
  }
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleCreateNewRoom()
    }
  }

  const [deleteRoom] = useMutation(DELETE_ROOM)
  const handleDeleteRoom = async (roomId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this room?')

    if (confirmDelete) {
      try {
        await deleteRoom({
          variables: {
            server_id,
            room_id: roomId,
          },
          refetchQueries: [{ query: GET_SERVER_ROOMS, variables: { server_id } }],
        })
      } catch (error) {
        toast.error('Failed to delete room! Please try again.')
        console.error(error)
      }
    }
  }

  if (getServerRoomsLoading || serverNameLoading || isLoading) return <Loading />
  if (error) return <div>{error.message}</div>

  return (
    <>
      <Head>
        <title>{serverName}</title>
      </Head>
      <main>
        {user && (
          <div className="flex flex-col">
            <Image src={user.picture} alt={user.name} width={45} height={45} />
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <Link href="/api/auth/logout">Logout</Link>
            {rooms &&
              rooms.map(({ room_id, room }) => (
                <span key={room_id} className="flex flex-row justify-between m-2">
                  <Link href={`/room/${room_id}`}>
                    Room: {room.room_name}, RoomID: {room_id}
                  </Link>
                  <button onClick={() => handleDeleteRoom(room_id)}>Delete Room</button>
                </span>
              ))}

            <button onClick={openRoomInput}>New Room</button>
            {newRoomInputOpen && (
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter new room name here..."
              />
            )}
          </div>
        )}
      </main>
    </>
  )
}
