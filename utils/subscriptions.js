import { gql } from "@apollo/client"

const MESSAGES_SUBSCRIPTION = gql`
subscription OnNewMessage($roomId: uuid!) {
  messages(order_by: { timestamp: asc }, where: { room_id: { _eq: $roomId } }) {
    id
    message_text
    timestamp
    user_id
  }
}
`

export {MESSAGES_SUBSCRIPTION}