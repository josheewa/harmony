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

export {convertTimestamp, getUsername}