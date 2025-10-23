import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { FaHome, FaHashtag, FaPlus } from 'react-icons/fa'
import { FaSquarePlus, FaPencil } from 'react-icons/fa6'
import { RiLogoutBoxLine } from 'react-icons/ri'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { IoMdClose, IoMdSettings, IoIosCloudUpload } from 'react-icons/io'
import { FaHouse } from 'react-icons/fa6'
import ServerIcon from '../ServerIcon'
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_USER_SERVERS,
  GET_SERVER_ROOMS,
  FETCH_SERVER_NAME,
  DELETE_ROOM,
  CREATE_NEW_ROOM,
  CREATE_NEW_SERVER,
  UPDATE_USER_PROFILE_PICTURE,
  ADD_USER_TO_DEMO_SERVER,
} from '@/utils/Apollo/queries'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { generate8CharId, isImageLinkValid, isValidURL } from '@/utils/functions'
import UserPfp from '../UserPfp'
import { useUserData } from '../InfoProvider'

const Layout = ({ children }) => {
  // User data
  const userData = useUserData().users[0]
  const user_id = userData.id
  const username = userData.username
  const pfp = userData.pfp

  // Router
  const router = useRouter()
  const isChatPath = router.pathname.startsWith('/chat/')
  const isInServer = isChatPath && !router.pathname.startsWith('/chat/dashboard')

  // ?States
  // Server-related states
  const [servers, setServers] = useState([])
  const { data: getUserServersData } = useQuery(GET_USER_SERVERS, {
    variables: { user_id },
  })

  const [rooms, setRooms] = useState([])
  const { server_id } = router.query

  const { data: getServerRoomsData } = useQuery(GET_SERVER_ROOMS, {
    variables: { server_id },
  })
  const { data: serverNameData } = useQuery(FETCH_SERVER_NAME, {
    variables: { server_id },
  })

  // User settings-related states
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [isCreatingServer, setIsCreatingServer] = useState(false)
  const [newServerName, setNewServerName] = useState('')

  const [userSettingsOpen, setUserSettingsOpen] = useState(false)

  const [dropdownVisible, setDropdownVisible] = useState(null)

  // Mutation handlers
  const [deleteRoom] = useMutation(DELETE_ROOM)
  const [createRoom] = useMutation(CREATE_NEW_ROOM)
  const [createServer] = useMutation(CREATE_NEW_SERVER)
  const [updateUserProfilePicture] = useMutation(UPDATE_USER_PROFILE_PICTURE)
  const [addUserToDemoServer] = useMutation(ADD_USER_TO_DEMO_SERVER)

  // Effects
  // Auto-add user to demo server if not already added
  useEffect(() => {
    if (getUserServersData && user_id) {
      const hasDemoServer = getUserServersData.user_servers.some(
        (userServer) => userServer.server_id === 'FMxYU3ZF'
      )
      
      if (!hasDemoServer) {
        // Automatically add user to demo server
        addUserToDemoServer({
          variables: { user_id },
          refetchQueries: [{ query: GET_USER_SERVERS, variables: { user_id } }],
        }).catch((error) => {
          console.log('User already added to demo server or error occurred:', error)
        })
      }
    }
  }, [getUserServersData, user_id, addUserToDemoServer])

  // Fetch user servers
  useEffect(() => {
    if (getUserServersData) {
      setServers(getUserServersData.user_servers)
    }
  }, [getUserServersData])

  // Fetch server rooms
  useEffect(() => {
    try {
      if (isInServer && getServerRoomsData) {
        setRooms(getServerRoomsData.server_rooms)
      }
    } catch (error) {
      console.log('Failed to fetch rooms!')
      console.error(error)
    }
  }, [getServerRoomsData, isInServer])

  // Handle escape key for settings modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleSettingsClose()
        setIsCreatingServer(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Fetch server name
  let serverName
  if (serverNameData && serverNameData.servers && serverNameData.servers.length > 0) {
    serverName = serverNameData.servers[0].server_name
  }

  // Function handlers
  const toggleDropdown = (roomId) => {
    setDropdownVisible((prev) => (prev === roomId ? null : roomId))
  }
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
  const handleCreateRoom = async (roomName) => {
    const room_id = generate8CharId()
    try {
      const formattedRoomName = roomName.trim().replace(/\s+/g, '-')
      await createRoom({
        variables: {
          server_id,
          room_name: formattedRoomName,
          room_id,
        },
        refetchQueries: [{ query: GET_SERVER_ROOMS, variables: { server_id } }],
      })
    } catch (error) {
      toast.error('Failed to create room! Please try again.')
      console.error(error)
    }
  }
  const handleCreateRoomClick = () => {
    setIsCreatingRoom(true)
  }
  const handleRoomNameChange = (e) => {
    setNewRoomName(e.target.value)
  }
  const handleRoomNameSubmit = () => {
    if (newRoomName.trim() !== '') {
      handleCreateRoom(newRoomName)
      setNewRoomName('')
      setIsCreatingRoom(false)
    }
  }
  const handleRoomNameCancel = () => {
    setNewRoomName('')
    setIsCreatingRoom(false)
  }
  const handleCreateServer = async () => {
    const server_id = generate8CharId()
    try {
      await createServer({
        variables: {
          server_id,
          user_id,
          server_name: newServerName.trim(),
        },
        refetchQueries: [{ query: GET_USER_SERVERS, variables: { user_id } }],
      })
      setNewServerName('')
      setIsCreatingServer(false)
    } catch (error) {
      console.error('Error creating server:', error)
    }
  }
  const handleSettingsClick = () => {
    setUserSettingsOpen(true)
  }
  const handleSettingsClose = () => {
    setUserSettingsOpen(false)
    setNewProfilePic('')
    setProfilePicSource('')
  }
  const [newProfilePic, setNewProfilePic] = useState('')
  const [profilePicSource, setProfilePicSource] = useState('')

  const cancelProfilePicSelection = () => {
    setNewProfilePic('')
    setProfilePicSource('')
  }

  const handleProfilePicFileUpload = (e) => {
    if (e.target.files[0]) {
      setNewProfilePic(e.target.files[0])
      setProfilePicSource(URL.createObjectURL(e.target.files[0]))
    }
  }

  const uploadProfilePicToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME)

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )
      const data = await response.json()

      if (data.error) {
        throw new Error('Failed to upload to Cloudinary')
      }

      const cloudPfpUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,g_face,h_200,w_200/${data.public_id}`
      // toast.success('Profile picture uploaded successfully!');
      return cloudPfpUrl
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      toast.error('Failed to upload profile picture.')
      throw error
    }
  }

  const handleProfilePicUpload = async () => {
    try {
      const cloudPfpUrl = await uploadProfilePicToCloudinary(newProfilePic)
      await updateProfilePic(cloudPfpUrl)
    } catch (error) {
      console.error('Profile picture upload failed:', error)
    }
  }

  const updateProfilePic = async (url) => {
    if (!isValidURL(url) || !(await isImageLinkValid(url))) {
      toast.error('Invalid image URL.')
      return
    }

    try {
      await updateUserProfilePicture({
        variables: {
          user_id,
          pfp: url,
        },
      })
      toast.success('Profile picture updated successfully!')
    } catch (error) {
      console.error('Failed to update profile picture:', error)
      toast.error('Failed to update profile picture! Please try again.')
    } finally {
      handleSettingsClose()
    }
  }

  return (
    <div className="sidebar-container h-screen w-full flex fixed">
      {isChatPath && (
        <div className="server-nav-panel relative w-20 bg-gray-900 flex text-white text-center flex-col items-center justify-start p-3">
          <Link href="/chat/dashboard" className="server-nav-item group">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
              <FaHouse size={20} className="text-white" />
            </div>
            <span className="sidebar-tooltip group-hover:scale-100">Home</span>
          </Link>
          {servers.map(({ server_id, server }) => (
            <Link
              key={server_id}
              href={`/chat/${server_id}${
                router.query.server_id === server_id ? `/${router.query.room_id}` : ''
              }`}
              className="server-nav-item sidebar-server-icon group flex items-center bg-white hover:bg-gray-500 rounded-[100%] hover:rounded-[30%] transition-all duration-300 ease-in-out">
              <ServerIcon key={server_id} serverName={server.server_name} serverId={server_id} />
              <span class="sidebar-tooltip group-hover:scale-100">{server.server_name}</span>
            </Link>
          ))}
          <button 
            className="new-server-button p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-gray-400 hover:text-white" 
            onClick={() => setIsCreatingServer(true)}
            title="Create Server">
            <FaSquarePlus size={24} />
          </button>
          <Link
            href="/api/auth/logout"
            className="sidebar-logout absolute bottom-0 server-nav-item text-gray-400 hover:text-red-400 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-800"
            title="Logout">
            <RiLogoutBoxLine size={24} />
          </Link>
        </div>
      )}

      <div className="second-nav-panel w-56 bg-gray-800 text-white text-center overflow-y-auto py-3">
        {isInServer && (
          <>
            <div className="sidebar-server-name font-bold text-xl my-5 text-white">{serverName}</div>
            <div className="sidebar-rooms-wrapper bg-gray-700 rounded-xl shadow-lg border border-gray-600">
              {rooms &&
                rooms.map(({ room_id, room }) => (
                  <div className="room-link-container flex flex-row" key={room_id}>
                    <Link
                      href={`/chat/${server_id}/${room_id}`}
                      className={`sidebar-rooms bg-gray-700 h-full w-full text-left px-3 py-3 text-gray-200 flex flex-row justify-between rounded-xl hover:bg-gray-600 transition-all duration-200 group ${
                        room_id === router.query.room_id ? 'current-room bg-gray-600 shadow-inner' : ''
                      }`}>
                      <div className="room-nametext-gray-200 flex flex-row items-center font-medium">
                        <FaHashtag className="text-gray-400 mr-2" />
                        <span className="text-gray-200 group-hover:text-white transition-colors">{room.room_name}</span>
                      </div>
                      <div className="more-button-container relative items-center flex px-1 text-white hover:text-gray-400">
                        <button className="more-button" onClick={() => toggleDropdown(room_id)}>
                          <BsThreeDotsVertical />
                        </button>
                        <div
                          className={`dropdown-content ${
                            dropdownVisible === room_id ? 'visible' : 'hidden'
                          }`}>
                          <button onClick={() => handleDeleteRoom(room_id)}>Delete Room</button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
            </div>
            {isCreatingRoom ? (
              <div className="new-room-container w-full flex flex-row items-center px-3">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={handleRoomNameChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRoomNameSubmit()
                    else if (e.key === 'Escape') handleRoomNameCancel()
                  }}
                  autoFocus
                  className="new-room-input w-fit text-black p-2 outline-none rounded-lg placeholder:text-gray-500"
                  placeholder="Enter new room name"
                />
                <button className="cancel-button mx-2" onClick={handleRoomNameCancel}>
                  <IoMdClose />
                </button>
              </div>
            ) : (
              <button
                className="create-room-button flex w-52 justify-center items-center bg-gray-700 hover:bg-gray-600 py-2 rounded-lg mx-2 my-2 text-white font-medium transition-colors duration-200"
                onClick={handleCreateRoomClick}
                title="Create a new room">
                <FaPlus className="mr-2" />
                Create Room
              </button>
            )}
          </>
        )}
        {isCreatingServer && (
          <div className="modal">
            <div className="modal-content bg-white p-5 rounded-xl w-96 max-w-[80%]">
              <span className="close" onClick={() => setIsCreatingServer(false)}>
                &times;
              </span>
              <h2 className="modal-title text-center font-bold text-xl m-2 text-black">
                Create a New Server
              </h2>
              <input
                type="text"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                placeholder="Enter server name"
                className="new-server-input rounded-xl px-3 border border-black h-10 text-black w-full"
              />
              <button onClick={handleCreateServer}>Create</button>
              <button onClick={() => setIsCreatingServer(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="user-info-pane bottom-0 absolute flex flex-row items-center bg-gray-900 w-56 p-4 border-t border-gray-700">
          {pfp ? (
            <Image
              className="user-info-pfp rounded-full shadow-gray-500 shadow-sm"
              src={pfp}
              alt={username}
              width={40}
              height={40}
            />
          ) : (
            <UserPfp username={username} />
          )}
          <h2 className="text-gray-200 font-medium">{username.length > 8 ? username.slice(0, 8) + '...' : username}</h2>
          <button
            className="user-settings-button text-gray-400 hover:text-white cursor-pointer transition-colors duration-200 p-1 rounded-lg hover:bg-gray-800"
            onClick={handleSettingsClick}>
            <IoMdSettings size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1">{children}</div>
      {userSettingsOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleSettingsClose}>
              &times;
            </span>
            <h2 className="modal-title">Edit User Profile</h2>
            <div className="profile-pic-upload mb-5">
              <div className="upload-container flex flex-col items-center justify-center">
                {!newProfilePic && (
                  <>
                    <label
                      htmlFor="file-upload"
                      className="relative custom-file-upload flex rounded-full p-0 cursor-pointer">
                      <div className="relative flex group rounded-full justify-center items-center shadow-gray-400 shadow-lg w-[75px] h-[75px] box-border">
                        <Image
                          src={pfp}
                          alt="profile picture"
                          width={75}
                          height={75}
                          className="rounded-full transition-all duration-300 filter brightness-100 group-hover:brightness-50 group-hover:saturate-50 pointer-events-none"
                        />
                        <div className="absolute inset-0 flex items-center justify-center w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto rounded-full bg-black bg-opacity-50">
                          <FaPencil className="text-white text-2xl" />
                        </div>
                      </div>
                    </label>

                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicFileUpload}
                      className="hidden"
                    />
                    <span className="username-label text-xl">{username}</span>
                  </>
                )}

                {/* Image preview */}
                {profilePicSource && (
                  <div className="profile-pic-preview mt-3 text-center p-3">
                    Preview:
                    <Image
                      src={profilePicSource}
                      alt="Profile Picture Preview"
                      width={100}
                      height={100}
                      className="rounded-full mt-3 h-32 w-32 object-cover  shadow-gray-400 shadow-lg"
                    />
                  </div>
                )}

                {profilePicSource && (
                  <span className="pfp-menu-btns flex flex-row w-full justify-center items-center">
                    <button
                      onClick={cancelProfilePicSelection}
                      className="cancel-upload-pfp-btn bg-red-500 hover:bg-red-700">
                      Cancel
                    </button>
                    <button
                      onClick={handleProfilePicUpload}
                      className="upload-pfp-btn bg-cyan-600 flex flex-row hover:bg-cyan-800">
                      <span>Upload</span> <IoIosCloudUpload size={20} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
