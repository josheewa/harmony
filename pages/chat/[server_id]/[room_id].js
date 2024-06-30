import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
// import { useUser } from '@auth0/nextjs-auth0/client'
import { useSubscription, useMutation, useQuery } from '@apollo/client'
import Head from 'next/head'
import { IoMdSend, IoMdRefresh } from 'react-icons/io'
import { MdError } from 'react-icons/md'
import { FaHashtag } from 'react-icons/fa'
import Loading from '@/components/Loading'
import { convertTimestamp, formatDateLabel, groupMessagesByDate } from '@/utils/functions'
import { MESSAGES_SUBSCRIPTION, SEND_MESSAGE, FETCH_ROOM_NAME } from '@/utils/Apollo/queries'
import UserPfp from '@/components/UserPfp'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { useUserData } from '@/components/InfoProvider'

export default function ChatRoom() {
  // const { user, isLoading } = useUser()
  const router = useRouter()
  const { room_id } = router.query
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
        <div className="chat-wrapper">
          <div className="chat-header">
            <FaHashtag />
            {`${roomName}`}
          </div>

          <div className="messages-container">
            <div ref={messagesEndRef}></div>
            {groupedMessages.map((group, index) => (
              <div key={index} className="message-group">
                {group.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${message.failed ? 'failed' : ''} flex flex-row `}>
                    <div className="message-pfp">
                      {!message.user.pfp && <UserPfp username={message.user.username} />}
                      {message.user.pfp && (
                        <Image
                          src={`${message.user.pfp}`}
                          alt="profile picture"
                          width={40}
                          height={40}
                          className="chat-pfp"
                        />
                      )}
                    </div>
                    <div className="message-body flex flex-col">
                      <div className="message-header">
                        <span className="username">{message.user.username}</span>
                        <span className="timestamp">{convertTimestamp(message.timestamp)}</span>
                      </div>
                      <span className="message-text">{message.message_text}</span>
                      {message.failed && (
                        <span className="message-fail-banner">
                          <MdError />
                          <span>Message failed to send. Please try again.</span>
                          <button
                            onClick={() => handleReSendMessage(message)}
                            className="resend-button">
                            Retry
                            <IoMdRefresh size={20} />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="date-separator">{formatDateLabel(group.date)}</div>
              </div>
            ))}
            {!hasMore && (
              <div className="room-start-banner">
                <FaHashtag size={50} />
                <h1>Welcome to #{roomName}</h1>
                <h2>This is the start of the #{roomName} room.</h2>
              </div>
            )}
            <div ref={topRef}></div>
          </div>

          <div className="input-container">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${roomName}`}
              className="input-field"
            />
            <button onClick={handleMessageSend} className="send-button">
              <IoMdSend size={20} />
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
