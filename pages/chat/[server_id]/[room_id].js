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
            user_id: '',
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
          <div className="chat-header flex flex-row justify-center sticky items-center text-2xl w-full bg-gray-700 text-white py-6">
            <FaHashtag />
            {`${roomName}`}
          </div>

          <div className="messages-container flex flex-col-reverse overflow-auto justify-start h-full">
            <div ref={messagesEndRef}></div>
            {groupedMessages.map((group, index) => (
              <div key={index} className="message-group flex flex-col">
                {/* Date separator for each group */}
                <div className="date-separator flex items-center text-center w-full text-gray-400 text-sm my-2">
                  {formatDateLabel(group.date)}
                </div>
                {group.messages
                  .slice() // Create a shallow copy of the array
                  .reverse() // Reverse the order of messages
                  .map((message, msgIndex, reversedMessages) => {
                    const previousMessage = reversedMessages[msgIndex - 1]
                    const isSameUserAsPrevious =
                      msgIndex > 0 &&
                      previousMessage.user.username === message.user.username &&
                      new Date(message.timestamp).toDateString() ===
                        new Date(previousMessage.timestamp).toDateString() &&
                      new Date(message.timestamp).getTime() -
                        new Date(previousMessage.timestamp).getTime() <=
                        5 * 60 * 1000

                    return (
                      <div
                        key={msgIndex}
                        className={`message-wrapper flex items-start bg-gray-100 hover:bg-gray-300 group rounded-lg relative p-1`}>
                        {/* Display Profile Picture or Timestamp to the left */}
                        {isSameUserAsPrevious ? (
                          <div className="sub-timestamps flex items-center justify-end w-20 h-full opacity-0 mr-2 group-hover:opacity-100 text-xs text-gray-600">
                            {convertTimestamp(message.timestamp)}
                          </div>
                        ) : (
                          <div className="message-pfp w-20 flex justify-center mr-2">
                            {!message.user.pfp && <UserPfp username={message.user.username} />}
                            {message.user.pfp && (
                              <Image
                                src={`${message.user.pfp}`}
                                alt="profile picture"
                                width={40}
                                height={40}
                                className="chat-pfp rounded-full"
                              />
                            )}
                          </div>
                        )}
                        <div className="messages-content flex flex-col w-full">
                          {/* Display Username and Timestamp for the First Message in a Group */}
                          {!isSameUserAsPrevious && (
                            <div className="message-header flex items-center">
                              <span className="username font-bold">{message.user.username}</span>
                              <span className="timestamp mx-2 text-gray-600 text-xs">
                                {convertTimestamp(message.timestamp)}
                              </span>
                            </div>
                          )}

                          <div className="message-body flex bg-gray-40">
                            <span
                              className={`message-text flex-1 ${!isSameUserAsPrevious && 'mt-1'}`}>
                              {message.message_text}
                            </span>
                          </div>

                          {/* Display retry option if the message failed */}
                          {message.failed && (
                            <span className="message-fail-banner flex flex-row items-center text-red-500 mt-2 failed">
                              <MdError />
                              <span className="mx-2">
                                Message failed to send. Please try again.
                              </span>
                              <button
                                onClick={() => handleReSendMessage(message)}
                                className="resend-button text-black mx-2 border-none flex flex-row bg-gray-300 px-2 p-1 rounded-lg items-center hover:bg-gray-400">
                                Retry
                                <IoMdRefresh size={20} />
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
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

          {room_id != 'PHkbABjm' && (
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
          )}
        </div>
      </main>
    </>
  )
}
