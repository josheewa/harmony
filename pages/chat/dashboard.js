export default function Dashboard() {
  return (
    <>
      <div className="p-6 text-gray-800">
        <div className="bg-white rounded-lg shadow-md p-5">
          <h2 className="text-xl font-bold mb-4">Welcome to Harmony!</h2>
          <p className="mb-4">
            If you&apos;re new here, you can check out the demo server added by default to your
            account. Just click on the icon with a {'"D"'} on the left panel.
          </p>
          <p className="mb-4">
            Harmony is currently a work in progress, aimed to emulate Discord, starting from
            scratch. It&apos;s built with Next.js, uses Hasura Neon&apos;s database for storage, relies
            on Auth0 for authentication, and implements Cloudinary&apos;s image hosting services.
          </p>
          <h3 className="text-lg font-semibold mb-3">Currently Implemented Features:</h3>
          <ul className="list-disc list-inside mb-4">
            <li>Fully functional chatrooms, with plans for optimized fetching.</li>
            <li>Servers containing chatrooms are functional, with ongoing customization work.</li>
            <li>Server and room creation implemented, with more flexibility coming.</li>
            <li>User login complete with added profile picture customization.</li>
          </ul>
          <h3 className="text-lg font-semibold mb-3">Features in Development:</h3>
          <ul className="list-disc list-inside mb-4">
            <li>Friends and private direct messaging.</li>
            <li>Server customization.</li>
          </ul>
          <p>
            If you find any bugs or have any ideas/suggestions for the app, please open an Issue on
            Harmony&apos;s{' '}
            <a href="https://github.com/josheewa/harmony" target='_blank'className="text-blue-500 underline">
              GitHub Repo
            </a>
            . The more detail, the better!
          </p>
        </div>
      </div>
    </>
  )
}
