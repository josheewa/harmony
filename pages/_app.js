import React from 'react'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import LoginCheck from '@/components/LoginCheck'
import '../styles/index.css'

import { ApolloClient, HttpLink, InMemoryCache, split, ApolloProvider } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Head from 'next/head'
const httpLink = new HttpLink({
  uri: 'https://harmony.hasura.app/v1/graphql',
  headers: {
    'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
    'x-hasura-role': 'admin',
  },
})

const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: 'wss://harmony.hasura.app/v1/graphql',
          headers: {
            'x-hasura-admin-secret': `${process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET}`,
          },
          on: {
            closed: () => {
              console.log('Socket was closed, reconnecting...')
              if (wsLink && wsLink.subscriptionClient) {
                wsLink.subscriptionClient.connect()
              } else {
                console.log('wsLink or wsLink.subscriptionClient is undefined')
              }
            },
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
    <>
      <Head>
        <title>Harmony</title>
      </Head>
      <ApolloProvider client={client}>
        <UserProvider>
          <LoginCheck>
            <Component {...pageProps} />
            <ToastContainer />
          </LoginCheck>
        </UserProvider>
      </ApolloProvider>
    </>
  )
}
