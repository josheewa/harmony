import { gql } from '@apollo/client'

const MESSAGES_SUBSCRIPTION = gql`
  subscription OnNewMessage($roomId: String!, $limit: Int!, $offset: Int!) {
    messages(
      order_by: { timestamp: desc }
      where: { room_id: { _eq: $roomId } }
      limit: $limit
      offset: $offset
    ) {
      id
      message_text
      timestamp
      user_id
      user {
        username
        pfp
      }
    }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($message_text: String!, $room_id: String!, $user_id: uuid!) {
    insert_messages_one(
      object: { message_text: $message_text, room_id: $room_id, user_id: $user_id }
    ) {
      id
    }
  }
`
const FETCH_ROOM_NAME = gql`
  query FetchRoomName($room_id: String!) {
    rooms(where: { id: { _eq: $room_id } }) {
      room_name
    }
  }
`
const GET_USER_ROOMS = gql`
  query GetUserRooms($user_id: uuid!) {
    user_rooms(where: { user_id: { _eq: $user_id } }) {
      room_id
      room {
        id
        room_name
      }
    }
  }
`
const CREATE_NEW_ROOM = gql`
  mutation CreateNewRoom($room_id: String!, $room_name: String!, $server_id: String!) {
    insert_rooms_one(object: { id: $room_id, room_name: $room_name }) {
      id
    }
    insert_server_rooms_one(object: { room_id: $room_id, server_id: $server_id }) {
      id
    }
  }
`
const DELETE_ROOM = gql`
  mutation DeleteRoom($server_id: String!, $room_id: String!) {
    delete_server_rooms(where: { room_id: { _eq: $room_id }, server_id: { _eq: $server_id } }) {
      affected_rows
    }
  }
`
const GET_SERVER_ROOMS = gql`
  query GetServerRooms($server_id: String!) {
    server_rooms(where: { server_id: { _eq: $server_id } }) {
      room_id
      server_id
      room {
        room_name
      }
      server {
        server_name
        default_room
      }
    }
  }
`
const GET_USER_SERVERS = gql`
  query GetUserServers($user_id: uuid!) {
    user_servers(where: { user_id: { _eq: $user_id } }) {
      server_id
      server {
        server_name
      }
    }
  }
`
const FETCH_SERVER_NAME = gql`
  query FetchServerName($server_id: String!) {
    servers(where: { id: { _eq: $server_id } }) {
      server_name
      default_room
    }
  }
`
const CREATE_NEW_SERVER = gql`
  mutation CreateNewServer($server_id: String!, $server_name: String!, $user_id: uuid!) {
    insert_servers_one(object: { id: $server_id, server_name: $server_name }) {
      id
    }
    insert_user_servers(objects: { server_id: $server_id, user_id: $user_id }) {
      returning {
        id
      }
    }
  }
`
const LEAVE_SERVER = gql`
  mutation LeaveServer($user_id: uuid!, $server_id: String!) {
    delete_user_servers(where: { user_id: { _eq: $user_id }, server_id: { _eq: $server_id } }) {
      affected_rows
    }
  }
`

const GET_USER_PROFILE = gql`
  query GetUserProfile($user_id: uuid!) {
    users(where: { id: { _eq: $user_id } }) {
      id
      pfp
      username
    }
  }
`
const UPDATE_USER_PROFILE_PICTURE = gql`
  mutation UpdateUserProfilePicture($user_id: uuid!, $pfp: String!) {
    update_users(where: { id: { _eq: $user_id } }, _set: { pfp: $pfp }) {
      returning {
        pfp
        id
      }
    }
  }
`

export {
  MESSAGES_SUBSCRIPTION,
  SEND_MESSAGE,
  FETCH_ROOM_NAME,
  GET_USER_ROOMS,
  CREATE_NEW_ROOM,
  DELETE_ROOM,
  GET_SERVER_ROOMS,
  GET_USER_SERVERS,
  FETCH_SERVER_NAME,
  CREATE_NEW_SERVER,
  LEAVE_SERVER,
  GET_USER_PROFILE,
  UPDATE_USER_PROFILE_PICTURE,
}
