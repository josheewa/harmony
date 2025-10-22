import Image from 'next/image'

export default function Dashboard() {
  return (
    <>
      <div className="p-6 text-gray-800 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Image
                src="/favicon.png"
                alt="Harmony Logo"
                width={64}
                height={64}
                className="rounded-full"
              />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Welcome to Harmony!</h2>
          </div>
          
          <div className="space-y-6 text-gray-700">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <p className="text-lg leading-relaxed">
                If you&apos;re new here, you can check out the demo server added by default to your
                account. Just click on the icon with a {'"D"'} on the left panel.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <p className="text-lg leading-relaxed">
                Harmony is currently a work in progress, aimed to emulate Discord, starting from
                scratch. It&apos;s built with Next.js, uses Hasura Neon&apos;s database for storage, relies
                on Auth0 for authentication, and implements Cloudinary&apos;s image hosting services.
              </p>
            </div>
          </div>
          
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Currently Implemented Features
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Fully functional chatrooms, with plans for optimized fetching.</li>
                <li>Servers containing chatrooms are functional, with ongoing customization work.</li>
                <li>Server and room creation implemented, with more flexibility coming.</li>
                <li>User login complete with added profile picture customization.</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                Features in Development
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Friends and private direct messaging.</li>
                <li>Server customization.</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-700 text-center">
              If you find any bugs or have any ideas/suggestions for the app, please open an Issue on
              Harmony&apos;s{' '}
              <a 
                href="https://github.com/josheewa/harmony" 
                target='_blank'
                className="text-blue-600 hover:text-blue-700 underline font-medium transition-colors">
                GitHub Repo
              </a>
              . The more detail, the better!
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
