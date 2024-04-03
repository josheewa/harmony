import React, { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import Head from 'next/head'
import Link from 'next/link'
import { userInfo } from 'os'

const Home = () => {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  // temp identification for testing
  let user_id = 'ae61fe18-a590-4cbd-a4e5-016057e3607a'
  let username = 'test-user'

  const handleMessageSend = async () => {
    if (inputText.trim() !== '') {
      // Optimistically update local state and print the message
      setMessages([...messages, { message_text: inputText, username, timestamp: Date.now() }])

      fetch('https://harmony.hasura.app/api/rest/send-msg', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
        },
        body: JSON.stringify({
          message_text: inputText,
          user_id,
        }),
      })
        .then((response, data) => {
          if (!response.ok) {
            console.error('Failed to send message.')
            console.log(data)
          } else {
            setInputText('')
            console.log('Message sent successfully')
          }
        })
        .catch((error) => console.error('Error: ', error))
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('https://harmony.hasura.app/api/rest/fetch-msgs', {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const updatedMessages = await Promise.all(
        data.messages.map(async (message) => {
          const username = await getUsername(message.user_id)
          return { ...message, username }
        })
      )
      setMessages(updatedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  // ? Fetch on load
  useEffect(() => {
    fetchMessages()
  })

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleMessageSend()
    }
  }

  const convertTimestamp = (timestamp) => {
    let date = new Date(timestamp)

    let hours = date.getHours()
    let minutes = date.getMinutes()
    let ampm = hours >= 12 ? 'PM' : 'AM'

    hours = hours % 12
    hours = hours ? hours : 12
    minutes = minutes < 10 ? '0' + minutes : minutes

    return hours + ':' + minutes + ' ' + ampm
  }

  const getUsername = async (user_id) => {
    try {
      const response = await fetch('https://harmony.hasura.app/v1/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
        },
        body: JSON.stringify({
          query: `
                query {
                  users_by_pk(id: "${user_id}") {
                    username
                  }
                }
                `,
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.data.users_by_pk.username
    } catch (error) {
      console.error('Error fetching username:', error)
    }
  }

  return (
    <>
      <Head>
        <title>{`Chat`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="mx-auto max-w-[1960px] p-4">
        <div>
          <div className="messages-container">
            {messages.length != 0 &&
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
