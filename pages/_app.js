import React from 'react'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import LoginCheck from '@/components/LoginCheck'
import '../styles/index.css'

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

export default function App({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <UserProvider>
        <LoginCheck>
          <Component {...pageProps} />
        </LoginCheck>
      </UserProvider>
    </ApolloProvider>
  )
}
