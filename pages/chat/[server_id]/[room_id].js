import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useSubscription, useMutation, useQuery } from '@apollo/client'
import Head from 'next/head'
import { IoMdSend, IoMdRefresh } from 'react-icons/io'
import { MdError } from 'react-icons/md'
import { FaHashtag } from 'react-icons/fa'
import Loading from '@/components/Loading'
import { convertTimestamp, formatDateLabel, groupMessagesByDate } from '@/utils/functions'
import {
  MESSAGES_SUBSCRIPTION,
  SEND_MESSAGE,
  FETCH_ROOM_NAME,
  CHECK_USER_SERVER_PERMISSIONS,
} from '@/utils/Apollo/queries'
import UserPfp from '@/components/UserPfp'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { useUserData } from '@/components/InfoProvider'

export default function ChatRoom() {
  // const { user, isLoading } = useUser()
  const router = useRouter()
  const { room_id, server_id } = router.query
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const { ref: topRef, inView } = useInView({ threshold: 0 })
  const userData = useUserData().users[0]

  const { loading: roomNameLoading, data: roomNameData } = useQuery(FETCH_ROOM_NAME, {
    variables: { room_id },
    skip: !room_id, // Skip the query if room_id is not defined
  })

  // Query to check user permissions
  const {
    loading: checkPermissionsLoading,
    data: checkPermissionsData,
    error: checkPermissionsError,
  } = useQuery(CHECK_USER_SERVER_PERMISSIONS, {
    variables: { user_id: userData.id, server_id },
    skip: !userData, // Skip the query if user is not loaded
  })

  const { error: subsError, loading: subsLoading } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: {
      roomId: room_id,
      limit,
      offset,
    },
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData) {
        const newMessages = subscriptionData.data.messages

        setMessages((prevMessages) => {
          const combinedMessages = [...newMessages, ...prevMessages].filter((m) => !m.isTemporary)

          // Create a map to ensure uniqueness by message id
          const messageMap = new Map()
          combinedMessages.forEach((message) => {
            messageMap.set(message.id, message)
          })
          const uniqueMessages = Array.from(messageMap.values())
          uniqueMessages.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )

          return uniqueMessages
        })

        setHasMore(newMessages.length === limit)
        setIsFetching(false)
        setInitialLoad(false)
      }
    },
  })

  useEffect(() => {
    if (checkPermissionsData && checkPermissionsData.user_servers.length === 0) {
      router.push('/unauthorized')
    }
  }, [checkPermissionsData, router])

  useEffect(() => {
    if (room_id) {
      // Reset state variables and refetch data when room_id changes
      setMessages([])
      setInputText('')
      setOffset(0)
      setHasMore(true)
      setInitialLoad(true)
      setIsFetching(false)
    }
  }, [room_id])

  let roomName = roomNameData?.rooms?.[0]?.room_name || ''

  const user_id = userData.id
  const username = userData.username
  const pfp = userData.pfp
  // let username = user?.['harmony/username']

  const [sendMessage] = useMutation(SEND_MESSAGE)

  const handleMessageSend = async () => {
    if (inputText.trim() !== '') {
      const tempId = `temp-${Date.now()}`
      const newMessage = {
        id: tempId,
        message_text: inputText,
        user: { username, pfp },
        timestamp: new Date().toISOString(),
        isTemporary: true,
      }
      setMessages((prevMessages) => [newMessage, ...prevMessages])
      setInputText('')

      try {
        await sendMessage({
          variables: {
            message_text: inputText,
            room_id,
            user_id,
          },
        })
      } catch (error) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg.id === tempId ? { ...msg, failed: true } : msg))
        )
        console.error('Failed to send message.', error)
      }
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleMessageSend()
    }
  }

  const handleReSendMessage = async (failedMessage) => {
    const { message_text, timestamp } = failedMessage
    try {
      await sendMessage({
        variables: {
          message_text,
          room_id,
          user_id,
        },
      })
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.timestamp === timestamp ? { ...msg, failed: false } : msg))
      )
    } catch (error) {
      console.error('Failed to resend message.', error)
    }
  }

  const groupedMessages = groupMessagesByDate(messages) // Group messages after sorting

  // console.log(groupedMessages)
  useEffect(() => {
    if (!initialLoad && inView && hasMore && !isFetching) {
      setIsFetching(true)
      setOffset((prevOffset) => prevOffset + limit)
    }
  }, [inView, hasMore, isFetching, initialLoad, limit])

  if (subsLoading || roomNameLoading) return <Loading />
  if (subsError) {
    console.log('Subscription error: ', subsError)
  }

  return (
    <>
      <Head>
        <title>{`#${roomName}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="relative">
        <div className="chat-wrapper flex flex-col h-screen">
          <div className="chat-header flex flex-row sticky items-center text-2xl justify-center w-full bg-gray-700 text-white py-6">
            <FaHashtag />
            {`${roomName}`}
          </div>

          <div className="messages-container flex flex-col-reverse overflow-auto justify-start h-full">
            <div ref={messagesEndRef}></div>
            {/* Iterate over date groups */}
            {groupedMessages.map((dateGroup, dateIndex) => (
              <div key={dateIndex} className="date-group flex flex-col-reverse">
                {/* Iterate over subgroups within each date group */}
                {dateGroup.groups.map((subGroup, subGroupIndex) => (
                  <div
                    key={subGroupIndex}
                    className="subgroup-container flex flex-row items-start p-2 bg-gray-100 my-[0.5px] rounded-lg">
                    {/* Display profile picture and username for the subgroup */}
                    <div className="message-pfp mr-4">
                      {!subGroup[0].user.pfp && <UserPfp username={subGroup[0].user.username} />}
                      {subGroup[0].user.pfp && (
                        <Image
                          src={`${subGroup[0].user.pfp}`}
                          alt="profile picture"
                          width={40}
                          height={40}
                          className="chat-pfp rounded-full"
                        />
                      )}
                    </div>

                    {/* Messages Container for the Subgroup */}
                    <div className="messages-content flex flex-col">
                      {/* Display Username and Timestamp once for the entire subgroup */}
                      <div className="message-header">
                        <span className="username font-bold">{subGroup[0].user.username}</span>
                        <span className="timestamp mx-2 text-gray-600 text-xs">
                          {convertTimestamp(subGroup[0].timestamp)}
                        </span>
                      </div>
                      <div className="submessages flex flex-col-reverse">
                        {/* Display all messages in the subgroup */}
                        {subGroup.map((message, messageIndex) => (
                          <div key={messageIndex} className="message-text mb-1">
                            {message.message_text}
                          </div>
                        ))}
                      </div>

                      {/* If any message failed, show the retry button for the entire subgroup */}
                      {subGroup.some((message) => message.failed) && (
                        <span className="message-fail-banner flex flex-row items-center text-red-500 mt-2">
                          <MdError />
                          <span className="mx-2">
                            Some messages failed to send. Please try again.
                          </span>
                          <button
                            onClick={() => handleReSendMessage(subGroup)}
                            className="resend-button text-black mx-2 border-none flex flex-row bg-gray-300 px-2 p-1 rounded-lg items-center hover:bg-gray-400">
                            Retry
                            <IoMdRefresh size={20} />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {/* Date separator for each group */}
                <div className="date-separator flex items-center text-center w-full text-gray-400 text-sm my-2">
                  {formatDateLabel(dateGroup.date)}
                </div>
              </div>
            ))}

            {/* Room Start Banner */}
            {!hasMore && (
              <div className="room-start-banner p-5 text-gray-800 border-b-4 border-double border-gray-300">
                <FaHashtag size={50} />
                <h1 className="my-2">Welcome to #{roomName}</h1>
                <h2>This is the start of the #{roomName} room.</h2>
              </div>
            )}

            <div ref={topRef}></div>
          </div>

          <div className="input-container bottom-0 flex mt-auto p-2 bg-gray-500 rounded-e-full rounded-s-lg m-1 border border-gray-300">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${roomName}`}
              className="input-field border-none outline-none bg-transparent w-full text-lg p-2 text-white placeholder:text-gray-50"
            />
            <button
              onClick={handleMessageSend}
              className="send-button bg-transparent rounded-full px-3 text-gray-50 hover:text-gray-800">
              <IoMdSend size={20} />
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
