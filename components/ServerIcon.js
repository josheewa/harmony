import Avatar from 'react-avatar';

export default function ServerIcon({ serverName }) {
    // Split the server name and get the first letter of each word
    // const initials = serverName.split(' ').map(word => word[0]).join(' ');
    return (
        <Avatar 
            // color={Avatar.getRandomColor('sitebase', ['red', 'green', 'blue'])} 
            color={"transparent"}
            fgColor={"#000000"}
            name={serverName} 
            size={40} 
            round={false} 
        />
    );
}
