import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { FaHome, FaHashtag, FaPlus, FaFileUpload } from 'react-icons/fa'
import { FaSquarePlus } from 'react-icons/fa6'
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
  GET_USER_PROFILE,
  UPDATE_USER_PROFILE_PICTURE,
} from '@/utils/Apollo/queries'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { generate8CharId } from '@/utils/functions'
import UserPfp from '../UserPfp'
import { useUserData } from '../InfoProvider'

const Layout = ({ children }) => {
  const userData = useUserData().users[0]
  const router = useRouter()

  const user_id = userData.id
  const username = userData.username
  const pfp = userData.pfp

  const isChatPath = router.pathname.startsWith('/chat/')
  const isInServer = isChatPath && !router.pathname.startsWith('/chat/dashboard')
  const [servers, setServers] = useState([])
  const { data: getUserServersData } = useQuery(GET_USER_SERVERS, {
    variables: { user_id },
  })
  const { data: userProfileData } = useQuery(GET_USER_PROFILE, {
    variables: { user_id },
  })

  useEffect(() => {
    if (getUserServersData) {
      setServers(getUserServersData.user_servers)
    }
  }, [getUserServersData])

  const [rooms, setRooms] = useState([])
  const { server_id } = router.query

  const { data: getServerRoomsData } = useQuery(GET_SERVER_ROOMS, {
    variables: { server_id },
  })
  const { data: serverNameData } = useQuery(FETCH_SERVER_NAME, {
    variables: { server_id },
  })

  let serverName
  if (serverNameData && serverNameData.servers && serverNameData.servers.length > 0) {
    serverName = serverNameData.servers[0].server_name
  }

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

  const [dropdownVisible, setDropdownVisible] = useState(null)

  const toggleDropdown = (roomId) => {
    setDropdownVisible((prev) => (prev === roomId ? null : roomId))
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

  const [createRoom] = useMutation(CREATE_NEW_ROOM)
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

  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

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

  const [createServer] = useMutation(CREATE_NEW_SERVER)

  const [isCreatingServer, setIsCreatingServer] = useState(false)
  const [newServerName, setNewServerName] = useState('')

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

  const [userSettingsOpen, setUserSettingsOpen] = useState(false)

  const [newProfilePic, setNewProfilePic] = useState('')
  const [profilePicSource, setProfilePicSource] = useState('')

  const handleSettingsClick = () => {
    setUserSettingsOpen(true)
  }

  const handleSettingsClose = () => {
    setUserSettingsOpen(false)
    setNewProfilePic('')
    setProfilePicSource('')
  }

  const cancelProfilePicSelection = () => {
    setNewProfilePic('')
    setProfilePicSource('')
  }

  const handleProfilePicFileChange = (e) => {
    if (e.target.files[0]) {
      setNewProfilePic(e.target.files[0])
      setProfilePicSource(URL.createObjectURL(e.target.files[0]))
    }
  }

  const cloudinaryUploadProfilePic = async (file) => {
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
      console.log('File uploaded successfully:', data)
      setProfilePicSource(
        `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,g_face,h_200,w_200/${data.public_id}`
      )
      handleProfilePicSubmit()
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const handleProfilePicUpload = () => {
    const file = newProfilePic
    cloudinaryUploadProfilePic(file)
  }
  const [updateUserProfilePicture] = useMutation(UPDATE_USER_PROFILE_PICTURE)

  const handleProfilePicSubmit = async () => {
    try {
      if (profilePicSource) {
        await updateUserProfilePicture({
          variables: {
            user_id,
            pfp: profilePicSource,
          },
        })
        toast.success('Profile picture updated successfully!')
      }
    } catch (error) {
      toast.error('Failed to update profile picture! Please try again.')
      console.error(error)
    } finally {
      handleSettingsClose()
    }
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleSettingsClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="sidebar-container">
      {isChatPath && (
        <div className="server-nav-panel">
          <Link href="/chat/dashboard" className="server-nav-item">
            <FaHome size={35} className="fa-icon" />
          </Link>
          {servers.map(({ server_id, server }) => (
            <Link
              key={server_id}
              href={`/chat/${server_id}${
                router.query.server_id === server_id ? `/${router.query.room_id}` : ''
              }`}
              className="server-nav-item sidebar-server-icon">
              <ServerIcon key={server_id} serverName={server.server_name} serverId={server_id} />
            </Link>
          ))}
          <button className="new-server-button" onClick={() => setIsCreatingServer(true)}>
            <FaSquarePlus size={40} />
          </button>
          <Link href="/api/auth/logout" className="sidebar-logout" title="Logout">
            <RiLogoutBoxLine size={40} />
          </Link>
        </div>
      )}

      <div className="second-nav-panel">
        {isInServer && (
          <>
            <div className="sidebar-room-name">{serverName}</div>
            {rooms &&
              rooms.map(({ room_id, room }) => (
                <div className="room-link-container" key={room_id}>
                  <Link
                    href={`/chat/${server_id}/${room_id}`}
                    className={`sidebar-rooms ${
                      room_id === router.query.room_id ? 'current-room' : ''
                    }`}>
                    <div className="room-name">
                      <FaHashtag />
                      {room.room_name}
                    </div>
                  </Link>
                  <div className="more-button-container">
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
                </div>
              ))}
            {isCreatingRoom ? (
              <div className="new-room-container">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={handleRoomNameChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRoomNameSubmit()
                    else if (e.key === 'Escape') handleRoomNameCancel()
                  }}
                  autoFocus
                  className="new-room-input"
                  placeholder="Enter new room name"
                />
                <button className="cancel-button" onClick={handleRoomNameCancel}>
                  <IoMdClose />
                </button>
              </div>
            ) : (
              <button
                className="create-room-button"
                onClick={handleCreateRoomClick}
                title="Create a new room">
                <FaPlus />
              </button>
            )}
          </>
        )}
        {isCreatingServer && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={() => setIsCreatingServer(false)}>
                &times;
              </span>
              <input
                type="text"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                placeholder="Enter server name"
                className="new-server-input"
              />
              <button onClick={handleCreateServer}>Create</button>
              <button onClick={() => setIsCreatingServer(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="user-info-pane">
          {pfp && (
            <Image className="user-info-pfp" src={pfp} alt={username} width={40} height={40} />
          )}
          {!pfp && <UserPfp username={username} />}
          <h2>{username}</h2>
          <button className="user-settings-button" onClick={handleSettingsClick}>
            <IoMdSettings size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1">{children}</div>
      {userSettingsOpen && (
        <div className="user-settings-modal">
          <div className="user-settings-modal-content">
            <span className="user-settings-close" onClick={handleSettingsClose}>
              &times;
            </span>
            <h2 className="user-settings-title">User Settings</h2>
            <div className="profile-pic-upload">
              <h3 className="user-settings-description">Upload Profile Picture</h3>
              <div className="upload-container">
                <label htmlFor="file-upload" className="custom-file-upload">
                  <FaFileUpload size={20} />{' '}
                  <span>Choose {profilePicSource && 'Another'} File</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicFileChange}
                  style={{ display: 'none' }}
                />
                {/* Image preview */}
                {profilePicSource && (
                  <div className="profile-pic-preview">
                    Preview:
                    <Image src={profilePicSource} alt="Profile Preview" width={100} height={100} />
                  </div>
                )}
                {profilePicSource && (
                  <span className="pfp-menu-btns">
                    <button onClick={cancelProfilePicSelection} className="cancel-upload-pfp-btn">
                      Cancel
                    </button>
                    <button onClick={handleProfilePicUpload} className="upload-pfp-btn">
                      <span>Upload</span> <IoIosCloudUpload size={20} />
                    </button>
                  </span>
                )}
              </div>
            </div>
            {!profilePicSource && (
              <div className="profile-pic-link">
                <h3 className="user-settings-description">Or use an image link</h3>
                <div className="link-container">
                  <input
                    type="text"
                    value={newProfilePic}
                    onChange={(e) => setProfilePicSource(e.target.value)}
                    placeholder="Enter image URL"
                  />
                  <button onClick={handleProfilePicSubmit} className='link-upload-btn'>
                    <IoIosCloudUpload size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
