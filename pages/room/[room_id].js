import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import { convertTimestamp, getUsername } from '@/utils/messageDisplayUtils'
import { useSubscription } from '@apollo/client'
import { MESSAGES_SUBSCRIPTION } from '@/utils/subscriptions'
import Loading from '@/components/Loading'

const Home = ({ roomName }) => {
  const { user, error: userError, isLoading } = useUser()

  const router = useRouter()
  const { room_id } = router.query
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')

 
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
            const username = await getUsername(message.user_id);
            return { ...message, username };
          })
        );
        setMessages(updatedMessages);
      }
    };
  
    fetchMessages();
  }, [loading, data, subscriptionError, room_id]);
  
  let user_id = user?.['harmony/user_uuid']
  let username = user?.['harmony/username']

  const handleMessageSend = async () => {
    if (inputText.trim() !== '') {
      // Optimistically update local state and print the message
      setMessages([...messages, { message_text: inputText, username, timestamp: Date.now() }])

      fetch('https://harmony.hasura.app/api/rest/sendmessage', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
        },
        body: JSON.stringify({
          message_text: inputText,
          room_id,
          user_id,
        }),
      })
        .then((response, data) => {
          if (!response.ok) {
            console.log(response)
            console.error('Failed to send message.')
            console.log(data)
            // ! handle failed message
          } else {
            setInputText('')
            console.log('Message sent successfully')
          }
        })
        .catch((error) => console.error('Error: ', error))
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleMessageSend()
    }
  }


  if (isLoading || loading) return <Loading/>
  if (userError) return <div>{userError.message}</div>
  if (subscriptionError) {
    console.log(data)
    console.log('Subscription error: ', subscriptionError)
    return <div>{subscriptionError.message}</div>
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

export default Home

export async function getServerSideProps({ query }) {
  const { room_id } = query
  try {
    const response = await fetch('https://harmony.hasura.app/api/rest/fetchroomname', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
      },
      body: JSON.stringify({ room_id }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const roomName = (await response.json()).rooms[0].room_name
    return { props: { roomName } }
  } catch (error) {
    console.error(error)
    return {
      props: {
        error: 'Failed to get room name.',
      },
    }
  }
}