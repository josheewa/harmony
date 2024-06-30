import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import Image from 'next/image'
import Loading from '@/components/Loading'
import { toast } from 'react-toastify'
import { generate8CharId } from '@/utils/functions'
import { CREATE_NEW_SERVER, GET_USER_SERVERS, LEAVE_SERVER } from '@/utils/Apollo/queries'
import { useQuery, useMutation } from '@apollo/client'

export default function Dashboard() {
  const { user, error, isLoading } = useUser()
  const [servers, setServers] = useState([])

  const user_id = user?.['harmony/user_uuid']

  const { loading: getUserServersLoading, data: getUserServersData } = useQuery(GET_USER_SERVERS, {
    variables: { user_id },
  })

  useEffect(() => {
    try {
      if (getUserServersData) {
        setServers(getUserServersData.user_servers)
      }
    } catch (error) {
      console.log('Failed to fetch servers!')
      console.error(error)
    }
  }, [getUserServersData])

  const [newServerInputOpen, setServerInputOpen] = useState(false)
  const [newServerName, setNewServerName] = useState('')

  const [createNewServer] = useMutation(CREATE_NEW_SERVER)
  const handleCreateNewServer = async () => {
    const server_id = generate8CharId()

    try {
      await createNewServer({
        variables: {
          server_id,
          server_name: newServerName,
          user_id,
        },
        refetchQueries: [{ query: GET_USER_SERVERS, variables: { user_id } }],
      })
      setNewServerName('')
    } catch (error) {
      toast.error('Failed to create server! Please try again.')
      console.error(error)
    }
  }

  const openServerInput = () => {
    setServerInputOpen(true)
  }
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleCreateNewServer()
    }
  }

  const [leaveServer] = useMutation(LEAVE_SERVER)
  const handleLeaveServer = async (server_id) => {
    const confirmLeave = window.confirm('Are you sure you want to leave this server?')

    if (confirmLeave) {
      try {
        await leaveServer({
          variables: {
            user_id,
            server_id,
          },
          refetchQueries: [{ query: GET_USER_SERVERS, variables: { user_id } }],
        })
        setNewServerName('')
      } catch (error) {
        toast.error('Failed to leave server! Please try again.')
        console.error(error)
      }
    }
  }

  if (getUserServersLoading || isLoading) return <Loading />
  if (error) return <div>{error.message}</div>

  return (
    user && (
      <div className="flex flex-col">
        <Image src={user.picture} alt={user.name} width={45} height={45} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <Link href="/api/auth/logout">Logout</Link>
        {servers &&
          servers.map(({ server_id, server }) => (
            <span key={server_id} className="flex flex-row justify-between m-2">
              <Link href={`/${server_id}`}>
                Server: {server.server_name}, ServerID: {server_id}
              </Link>
              <button onClick={() => handleLeaveServer(server_id)}>Leave Server</button>
            </span>
          ))}

        <button onClick={openServerInput}>New Server</button>
        {newServerInputOpen && (
          <input
            type="text"
            value={newServerName}
            onChange={(e) => setNewServerName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter new server name here..."
          />
        )}
      </div>
    )
  )
}
