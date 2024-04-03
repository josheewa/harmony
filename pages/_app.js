import React from 'react'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import LoginCheck from '@/components/LoginCheck'
import '../styles/index.css'

// import { ApolloClient, ApolloProvider, InMemoryCache, HttpLink, split } from '@apollo/client'
// import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
// import { createClient } from 'graphql-ws'
// import { getMainDefinition } from '@apollo/client/utilities'

// const httpLink =
//   new HttpLink({
//     uri: 'https://harmony.hasura.app/v1/graphql',
//     headers: {
//       'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
//     },
//   })

// const wsLink =
//   new GraphQLWsLink(
//     createClient({
//       url: 'wss://harmony.hasura.app/v1/graphql',
//       headers: {
//         'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
//       },
//     })
//   )

// const splitLink = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query)
//     return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
//   },
//   wsLink,
//   httpLink
// )

// const client = new ApolloClient({
//   link: splitLink,
//   cache: new InMemoryCache(),
//   defaultOptions: {
//     watchQuery: {
//       fetchPolicy: 'no-cache',
//     },
//   },
// })
import { ApolloClient, HttpLink, InMemoryCache, split, ApolloProvider } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'
const httpLink = new HttpLink({
  uri: 'https://harmony.hasura.app/v1/graphql',
})

const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: 'wss://harmony.hasura.app/v1/graphql',
          headers: {
            'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
          },
        })
      )
    : null

const link =
  typeof window !== 'undefined' && wsLink != null
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query)
          return (
            definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
          )
        },
        wsLink,
        httpLink
      )
    : httpLink

const client = new ApolloClient({
  link: link,
  cache: new InMemoryCache(),
})
// headers: {
//   'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
// },
// const client = new ApolloClient({
//   uri: 'https://harmony.hasura.app/v1/graphql',
//   cache: new InMemoryCache(),
//       headers: {
//       'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
//     },
// });

export default function App({ Component, pageProps }) {
  return (
    // <>
    // <meta http-equiv="Content-Security-Policy" content="connect-src 'ws://localhost:8080'"/>

    <ApolloProvider client={client}>
      <UserProvider>
        <LoginCheck>
          <Component {...pageProps} />
        </LoginCheck>
      </UserProvider>
    </ApolloProvider>
    // </>
  )
}
