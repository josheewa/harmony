import Avatar from 'react-avatar'

export default function UserPfp({ username }) {
  return (
    <Avatar
      // color={Avatar.getRandomColor('sitebase', ['red', 'green', 'blue'])}
      // color={"transparent"}
      color={'#4682B4'}
      fgColor={'#fff'}
      name={username}
      size={40}
      round={true}
    />
  )
}
