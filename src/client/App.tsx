export const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono flex flex-col justify-center items-center">
      {/* Cyberpunk background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 text-center">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-4 border-2 border-green-400 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">2701</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 text-green-400">
          Hello 2701
        </h1>
        
        <p className="text-lg text-gray-300 mb-8">
          Welcome to the Vault
        </p>
        
        <div className="text-sm text-gray-500">
          <p>Devvit Web Application</p>
          <p>Status: <span className="text-green-400">Online</span></p>
        </div>
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-green-400 opacity-50"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-400 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-green-400 opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-green-400 opacity-50"></div>
    </div>
  );
};
