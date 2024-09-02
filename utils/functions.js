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
  const groupedMessages = new Map(); // Use a Map for efficient lookups

  // Group messages by date
  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp).toDateString();

    if (!groupedMessages.has(messageDate)) {
      groupedMessages.set(messageDate, []);
    }

    groupedMessages.get(messageDate).push(message);
  });

  // Process grouped messages into subgroups
  const finalGroups = Array.from(groupedMessages.entries()).map(([date, msgs]) => {
    const currentDateGroup = [];
    let tempGroup = [msgs[0]]; // Start with the first message

    for (let i = 1; i < msgs.length; i++) {
      // If the current message is by the same user and within 5 minutes of the previous message
      if (
        msgs[i].user_id === msgs[i - 1].user_id &&
        new Date(msgs[i].timestamp).getTime() - new Date(msgs[i - 1].timestamp).getTime() <= 5 * 60 * 1000
      ) {
        tempGroup.push(msgs[i]);
      } else {
        currentDateGroup.push(tempGroup);
        tempGroup = [msgs[i]]; // Start a new subgroup
      }
    }

    currentDateGroup.push(tempGroup); // Add the last group

    return { date, groups: currentDateGroup }; // Include date in the final structure
  });

  return finalGroups;
};

const isImageLinkValid = async (url) => {
  try {
    const response = await fetch(url)
    const contentType = response.headers.get('content-type')
    return contentType && contentType.startsWith('image')
  } catch (error) {
    console.error('Error validating image link:', error)
    return false
  }
}

const isValidURL = (url) => {
  const urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-zA-Z\\d])([a-zA-Z\\d-])*[a-zA-Z\\d])\\.)+([a-zA-Z]{2,6})(\\/[^\\s]*)?$'
  )
  return urlPattern.test(url)
}

export { generate8CharId, convertTimestamp, formatDateLabel, groupMessagesByDate, isImageLinkValid, isValidURL }
