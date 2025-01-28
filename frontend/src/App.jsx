import { useState } from "react";
import { motion } from "framer-motion";

function HomePage() {
  const [topic, setTopic] = useState("");


  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (topic.trim()) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 3000); 
    }
  };
  

  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center relative">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-80"></div>

      <header className="w-full py-20 relative z-10">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl py-5 md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-400">
            VideoForge
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mt-4">
          </p>
        </motion.div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center py-10 relative z-10">
        <motion.div 
          className="w-full max-w-lg p-6 bg-gray-800 rounded-xl shadow-lg backdrop-blur-lg bg-opacity-20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        >
          <p className="text-center text-gray-300 text-lg">
            Enter a topic.
          </p>
          <input 
            type="text" 
            placeholder="Type a topic..." 
            className="w-full p-3 mt-4 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={topic} 
            onChange={(e) => setTopic(e.target.value)}
          />
       
       <button 
  className="mt-4 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all flex justify-center items-center"
  onClick={handleGenerate}
  disabled={loading}
>
  {loading ? (
    <div className="flex items-center space-x-2">
      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M4 12a8 8 0 0 1 16 0" strokeOpacity="0.75" />
      </svg>
      <span>Processing...</span>
    </div>
  ) : (
    "Generate Video"
  )}
</button>
        </motion.div>
      </main>

      <footer className="w-full text-center py-6 text-gray-500 text-sm relative z-10">
        VideoForge 2025.
      </footer>
    </div>
  );
}

export default HomePage;
