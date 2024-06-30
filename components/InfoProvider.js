import React, { createContext, useContext } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useQuery } from '@apollo/client'
import { GET_USER_PROFILE } from '@/utils/Apollo/queries'
import Loading from '@/components/Loading'

const UserContext = createContext(null)

export const useUserData = () => useContext(UserContext)

const InfoProvider = ({ children }) => {
  const { user, isLoading } = useUser()

  const user_id = user?.['harmony/user_uuid']

  const {
    data: userProfileData,
    loading: userProfileLoading,
    error: userProfileError,
  } = useQuery(GET_USER_PROFILE, {
    variables: { user_id },
    skip: !user_id,
  })
  if (!user) {
    return <>{children}</>
  }
  if (isLoading || userProfileLoading) return <Loading />
  if (userProfileError) {
    console.error('Failed to load user profile data:', userProfileError)
    return <div>Error loading user data</div>
  }

  const userData = userProfileData

  return <UserContext.Provider value={userData}>{children}</UserContext.Provider>
}

export default InfoProvider
