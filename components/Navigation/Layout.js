import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { FaHome, FaHashtag, FaPlus } from 'react-icons/fa'
import { FaSquarePlus, FaPencil } from 'react-icons/fa6'
import { RiLogoutBoxLine } from 'react-icons/ri'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { IoMdClose, IoMdSettings, IoIosCloudUpload } from 'react-icons/io'
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

  // Effects
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

  // Mutation handlers
  const [deleteRoom] = useMutation(DELETE_ROOM)
  const [createRoom] = useMutation(CREATE_NEW_ROOM)
  const [createServer] = useMutation(CREATE_NEW_SERVER)
  const [updateUserProfilePicture] = useMutation(UPDATE_USER_PROFILE_PICTURE)

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
          <Link href="/chat/dashboard" className="server-nav-item">
            <FaHome size={35} className="fa-icon" />
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
          <button className="new-server-button" onClick={() => setIsCreatingServer(true)}>
            <FaSquarePlus size={40} />
          </button>
          <Link
            href="/api/auth/logout"
            className="sidebar-logout absolute bottom-0 server-nav-item text-red-500"
            title="Logout">
            <RiLogoutBoxLine size={40} />
          </Link>
        </div>
      )}

      <div className="second-nav-panel w-56 bg-gray-800 text-white text-center overflow-y-auto py-3">
        {isInServer && (
          <>
            <div className="sidebar-server-name font-bold text-xl my-5">{serverName}</div>
            <div className="sidebar-rooms-wrapper bg-gray-700 rounded-lg">
              {rooms &&
                rooms.map(({ room_id, room }) => (
                  <div className="room-link-container flex flex-row" key={room_id}>
                    <Link
                      href={`/chat/${server_id}/${room_id}`}
                      className={`sidebar-rooms bg-gray-700 h-full w-full text-left px-3 py-2 text-gray-200 flex flex-row justify-between rounded-lg hover:bg-gray-800 ${
                        room_id === router.query.room_id ? 'current-room' : ''
                      }`}>
                      <div className="room-nametext-gray-200 flex flex-row items-center">
                        <FaHashtag />
                        {room.room_name}
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
                className="create-room-button flex w-52 justify-center bg-gray-700 py-2 rounded-full mx-2 my-2"
                onClick={handleCreateRoomClick}
                title="Create a new room">
                <FaPlus />
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

        <div className="user-info-pane bottom-0 absolute flex flex-row items-center bg-gray-900 w-56 p-3">
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
          <h2>{username.length > 8 ? username.slice(0, 8) + '...' : username}</h2>
          <button
            className="user-settings-button text-gray-200 hover:text-gray-500 cursor-pointer"
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
