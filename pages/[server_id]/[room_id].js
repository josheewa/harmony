import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import { convertTimestamp } from '@/utils/functions'
import { useSubscription, useMutation, useQuery } from '@apollo/client'
import { MESSAGES_SUBSCRIPTION, SEND_MESSAGE, FETCH_ROOM_NAME } from '@/utils/Apollo/queries'
import Loading from '@/components/Loading'

export default function ChatRoom() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const { room_id } = router.query
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')

  const { loading: roomNameLoading, data: roomNameData } = useQuery(FETCH_ROOM_NAME, {
    variables: { room_id },
  })

  let roomName
  if (roomNameData && roomNameData.rooms && roomNameData.rooms.length > 0) {
    roomName = roomNameData.rooms[0].room_name
  }

  const {
    data,
    loading,
    error: subscriptionError,
  } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: {
      roomId: room_id,
    },
  })

  useEffect(() => {
    const fetchMessages = async () => {
      if (!loading && data) {
        const updatedMessages = await Promise.all(
          data.messages.map(async (message) => {
            const username = message.user.username
            return { ...message, username }
          })
        )
        setMessages(updatedMessages)
      }
    }
    fetchMessages()
  }, [loading, data, subscriptionError, room_id])

  let user_id = user?.['harmony/user_uuid']
  let username = user?.['harmony/username']

  const [sendMessage] = useMutation(SEND_MESSAGE)
  const handleMessageSend = async () => {
    if (inputText.trim() !== '') {
      // Optimistically update local state and print the message
      setMessages([...messages, { message_text: inputText, username, timestamp: Date.now() }])

      sendMessage({
        variables: {
          message_text: inputText,
          room_id,
          user_id,
        },
      })
        .then(() => {
          setInputText('')
          console.log('Message sent successfully')
        })
        .catch((error) => {
          console.error('Failed to send message.', error)
        })
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleMessageSend()
    }
  }

  if (roomNameLoading || isLoading || loading) return <Loading />
  if (subscriptionError) {
    console.log('Subscription error: ', subscriptionError)
    console.log(subscriptionError.graphQLErrors)
  }

  return (
    <>
      <Head>
        <title>{`#${roomName}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="">
        <div>
          <Link href="/api/auth/logout">Logout</Link>
          <div className="messages-container">
            {messages &&
              messages.length != 0 &&
              messages.map((message, index) => (
                <div key={index} className="message">
                  <span className="timestamp">{convertTimestamp(message.timestamp)}</span>
                  <span className="username">{message.username}</span>
                  <span className="message-text">{message.message_text}</span>
                </div>
              ))}
          </div>
          <div className="input-container">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="input-field"
            />
            <button onClick={handleMessageSend} className="send-button">
              Send
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
