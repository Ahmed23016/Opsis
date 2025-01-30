import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

function HomePage() {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [selectedThread, setSelectedThread] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [generatedScript, setGeneratedScript] = useState("");

  useEffect(() => {
    if (step === 1) {
      const resetData = async () => {
        try {
          const response = await fetch("http://localhost:3000/reset");
          if (response.ok) {
            const data = await response.json();
            console.log("Reset: ", data);
          }
        } catch (error) {
          console.error("Reset error:", error);
        }
      };
      resetData();
    }
  }, [step]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/queue-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      if (!response.ok) throw new Error('Failed to queue keywords job');

      pollForKeywords();
    } catch (error) {
      console.error("API Error:", error);
      setTerminalOutput([`Error: ${error.message}`]);
    }
  };

  const pollForKeywords = async () => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:3000/latest-data");
        if (response.ok) {
          const data = await response.json();
          setLoading(false);
          setKeywords(data.keywords || []);
          clearInterval(intervalId);
          setStep(2);
        }
      } catch (err) {
        console.log("Waiting for data...", err);
      }
    }, 3000);
  };

  const fetchTweets = async () => {
    try {
      const selectedKeyword = keywords[selectedIndex];
      const response = await fetch(
        `http://localhost:8000/search?topic=${encodeURIComponent(selectedKeyword)}`,
        { method: 'POST' }
      );
      
      if (!response.ok) throw new Error('Failed to fetch tweets');
      const data = await response.json();
      
      const processedThreads = data.threads.map(thread => 
        parseThreadTree(thread.tweets)
      );
      
      setGeneratedScript(processedThreads);
      setStep(4);
    } catch (error) {
      console.error("Tweet fetch error:", error);
      setTerminalOutput(prev => [...prev, `Error: ${error.message}`]);
    }
  };
  const parseThreadTree = (tweetNode) => {
    if (!tweetNode) return null;
    
    return {
      id: tweetNode.id,
      content: tweetNode.text,
      children: tweetNode.child ? [parseThreadTree(tweetNode.child)] : []
    };
  };
  const ThreadTree = ({ thread, depth = 0 }) => {
    const isExpanded = expandedThreads.has(thread.id);
    
    return (
      <div className="ml-4 border-l-2 border-gray-600 pl-4">
        <div className="flex items-start gap-2">
          <button
            onClick={() => {
              const newSet = new Set(expandedThreads);
              isExpanded ? newSet.delete(thread.id) : newSet.add(thread.id);
              setExpandedThreads(newSet);
            }}
            className={`text-purple-400 ${thread.children.length ? 'cursor-pointer' : 'invisible'}`}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <div className="flex-1">
            <p className="text-gray-300">{thread.content}</p>
            {thread.content.includes('http') && (
              <a
                href={thread.content.match(/https?:\/\/[^\s]+/)[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View Source
              </a>
            )}
          </div>
        </div>
        
        {isExpanded && thread.children.map(child => (
          <ThreadTree key={child.id} thread={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  const handleGenerateScript = () => {
    if (selectedIndex === null) {
      alert('Please select a keyword first!');
      return;
    }
    setStep(3);
    setTerminalOutput([]);
    fetchTweets();
  };

  const handleApprove = (index) => {
    setSelectedIndex(prev => prev === index ? null : index);
  };

  const stepVariants = {
    hidden: { x: 100, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center relative">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-80"></div>

      <header className="w-full py-12 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold py-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-400">
            Opsis AI
          </h1>
        </motion.div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center py-8 relative z-10 max-w-2xl">
        <AnimatePresence mode='wait'>
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full p-6 bg-gray-800 rounded-xl shadow-lg backdrop-blur-lg bg-opacity-20"
            >
              <div className="space-y-4">
                <p className="text-center text-gray-300 text-lg">
                  Enter a topic for your video
                </p>
                <input
                  type="text"
                  placeholder="Type a topic..."
                  className="w-full p-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <button
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all relative"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center"
                    >
                      <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
                        />
                      </motion.svg>
                      Generating Keywords...
                    </motion.div>
                  ) : (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Generate Keywords
                    </motion.span>
                  )}
                </button>
                <button
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all relative"
                  onClick={()=>{
                    setKeywords([topic])

                    setSelectedIndex(0)
                    console.log(keywords)
                    fetchTweets();
                    setStep(3)
                  }}
                  >Go to Online Research Analysis</button>
                  
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full p-6 bg-gray-800 rounded-xl shadow-lg backdrop-blur-lg bg-opacity-20"
            >
              <h3 className="text-2xl text-center font-bold mb-6">Select One Keyword</h3>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {keywords.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      selectedIndex === index
                        ? "bg-green-500/20 border border-green-500/30"
                        : "bg-gray-900/50 border border-gray-700/50"
                    }`}
                  >
                    <span className="text-gray-200">{item}</span>
                    <button
                      onClick={() => handleApprove(index)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        selectedIndex === index
                          ? "bg-green-600/80 text-white"
                          : "bg-gray-700/80 text-gray-300"
                      }`}
                    >
                      {selectedIndex === index ? '✓ Selected' : 'Select'}
                    </button>
                  </motion.div>
                ))}
              </div>
              <button
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
                onClick={handleGenerateScript}
              >
                Find Related Tweets
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full p-6 bg-gray-800 rounded-xl shadow-lg backdrop-blur-lg bg-opacity-20"
            >
              <div className="terminal-container bg-black p-4 rounded-lg font-mono text-sm">
                <div className="terminal-header text-gray-400 mb-4">
                  Twitter Search Engine v1.0
                </div>
                <div className="terminal-content text-green-400 space-y-2">
                  {terminalOutput.map((line, index) => (
                    <div key={index} className="terminal-line">
                      <span className="text-purple-400">$&gt;</span> {line}
                    </div>
                  ))}
                  {terminalOutput.length === 0 && (
                    <div className="text-gray-500">Searching Twitter for relevant content...</div>
                  )}
                </div>
                <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 6 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

{step === 4 && (
    <motion.div
      key="step4"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full p-6 bg-gray-800 rounded-xl shadow-lg backdrop-blur-lg bg-opacity-20 max-w-4xl"
    >
      <h3 className="text-2xl text-center font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-300">
        Thread Analysis
      </h3>
      <div className="bg-gray-900 p-6 rounded-lg max-h-[70vh] overflow-y-auto custom-scrollbar">
        {generatedScript.length > 0 ? (
          generatedScript.map((thread, index) => (
            <div key={thread.id} className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-purple-400">🧵</span>
                <h4 className="text-lg font-semibold text-blue-300">
                  Thread {index + 1}
                </h4>
              </div>
              <ThreadTree thread={thread} />
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No threads found</p>
        )}
      </div>
      <div className="mt-6 flex gap-4">
        <button
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all hover:scale-105"
          onClick={() => setStep(1)}
        >
          New Analysis
        </button>
        <button
          className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-lg transition-all hover:scale-105"
          onClick={() => navigator.clipboard.writeText(JSON.stringify(generatedScript, null, 2))}
        >
          Copy Analysis
        </button>
      </div>
    </motion.div>
  )}
        </AnimatePresence>
      </main>

      <footer className="w-full text-center py-6 text-gray-500 text-sm relative z-10">
        Opsis AI 2024
      </footer>
    </div>
  );
}

export default HomePage;