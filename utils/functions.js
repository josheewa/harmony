const generate8CharId = () => {
  let id = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return id
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

  // Function to display timestamps with labels (e.g., "today", "yesterday", or the actual date)
  const formatDateLabel = (dateString) => {
    const messageDate = new Date(dateString)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      // Return the actual date in a desired format
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
  }

 // Group messages by date and return an array of grouped messages
 const groupMessagesByDate = (messages) => {
  const groupedMessages = []

  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp).toDateString()

    // Check if a group with the current date already exists
    const existingGroup = groupedMessages.find((group) => group.date === messageDate)

    if (existingGroup) {
      // Add the message to the existing group
      existingGroup.messages.push(message)
    } else {
      // Create a new group for the current date
      groupedMessages.push({ date: messageDate, messages: [message] })
    }
  })

  return groupedMessages
}
export { generate8CharId, convertTimestamp, formatDateLabel, groupMessagesByDate }
