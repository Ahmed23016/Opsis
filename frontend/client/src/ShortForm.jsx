import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RedditTikTokPage() {
  const [step, setStep] = useState(1);
  const [redditStory, setRedditStory] = useState("");
  const [videoStyle, setVideoStyle] = useState("default"); 
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideoTop, setSelectedVideoTop] = useState(null);
  const [selectedVideoBottom, setSelectedVideoBottom] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [availableVideos, setAvailableVideos] = useState([]);
  const [availableAudios, setAvailableAudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/list_videos")
      .then((res) => res.json())
      .then((data) => {
        if (data.video_files) setAvailableVideos(data.video_files);
      })
      .catch((err) => console.error("Error fetching videos:", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/list_audio")
      .then((res) => res.json())
      .then((data) => {
        if (data.audio_files) setAvailableAudios(data.audio_files);
      })
      .catch((err) => console.error("Error fetching audios:", err));
  }, []);

  const handleGenerateVideo = async () => {
    if (!redditStory.trim()) {
      alert("Please enter a Reddit story.");
      return;
    }
    if (videoStyle === "default" && !selectedVideo) {
      alert("Please select a background video.");
      return;
    }
    if (videoStyle === "split" && (!selectedVideoTop || !selectedVideoBottom)) {
      alert("Please select both a top and a bottom video.");
      return;
    }
    if (!selectedAudio) {
      alert("Please select a background audio.");
      return;
    }

    const payload = {
      reddit_story: redditStory,
      style: videoStyle,
      background_video: videoStyle === "default" ? selectedVideo : undefined,
      background_video_top: videoStyle === "split" ? selectedVideoTop : undefined,
      background_video_bottom: videoStyle === "split" ? selectedVideoBottom : undefined,
      background_music: selectedAudio,
    };

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/generate_video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Video generation failed");
      const data = await res.json();
      setGeneratedVideo(data.video_file);
      setStep(4);
    } catch (error) {
      console.error(error);
      alert("Error generating video: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    hidden: { x: 100, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
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
            Reddit TikTok Video Maker
          </h1>
        </motion.div>
      </header>
      <main className="flex-1 w-full flex flex-col items-center py-8 relative z-10 max-w-3xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full p-6 bg-gray-800 rounded-xl shadow-lg backdrop-blur-lg bg-opacity-20"
            >
              <h2 className="text-2xl font-bold text-center mb-4">
                Step 1: Enter Reddit Story & Choose Style
              </h2>
              <textarea
                value={redditStory}
                onChange={(e) => setRedditStory(e.target.value)}
                placeholder="Paste your Reddit story here..."
                className="w-full p-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                rows={6}
              />
              <div className="flex items-center justify-center space-x-4 mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="default"
                    checked={videoStyle === "default"}
                    onChange={() => setVideoStyle("default")}
                    className="form-radio text-purple-600"
                  />
                  <span>Default Style</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="split"
                    checked={videoStyle === "split"}
                    onChange={() => setVideoStyle("split")}
                    className="form-radio text-purple-600"
                  />
                  <span>Split Screen</span>
                </label>
              </div>
              <button
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
                onClick={() => setStep(2)}
              >
                Next
              </button>
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
              <h2 className="text-2xl font-bold text-center mb-4">
                Step 2: Select Background Media
              </h2>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">
                  Background Video{videoStyle === "split" ? "s" : ""}
                </h3>
                {videoStyle === "default" ? (
                  <div className="grid grid-cols-2 gap-4">
                    {availableVideos.map((video, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg cursor-pointer ${
                          selectedVideo === video
                            ? "border-purple-500"
                            : "border-gray-700"
                        }`}
                        onClick={() => setSelectedVideo(video)}
                      >
                        <p className="text-sm">{video}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-medium mb-2">Top Video</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {availableVideos.map((video, index) => (
                          <div
                            key={index}
                            className={`p-3 border rounded-lg cursor-pointer ${
                              selectedVideoTop === video
                                ? "border-purple-500"
                                : "border-gray-700"
                            }`}
                            onClick={() => setSelectedVideoTop(video)}
                          >
                            <p className="text-sm">{video}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-2">Bottom Video</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {availableVideos.map((video, index) => (
                          <div
                            key={index}
                            className={`p-3 border rounded-lg cursor-pointer ${
                              selectedVideoBottom === video
                                ? "border-purple-500"
                                : "border-gray-700"
                            }`}
                            onClick={() => setSelectedVideoBottom(video)}
                          >
                            <p className="text-sm">{video}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">
                  Background Audio
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {availableAudios.map((audio, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedAudio === audio
                          ? "border-purple-500"
                          : "border-gray-700"
                      }`}
                      onClick={() => setSelectedAudio(audio)}
                    >
                      <p className="text-sm">{audio}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg"
                  onClick={() => setStep(3)}
                >
                  Next
                </button>
              </div>
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
              <h2 className="text-2xl font-bold text-center mb-4">
                Step 3: Generate Video
              </h2>
              <div className="mb-4 text-center">
                <p>
                  <span className="font-semibold">Reddit Story:</span>{" "}
                  {redditStory.slice(0, 100)}
                  {redditStory.length > 100 && "..."}
                </p>
                <p>
                  <span className="font-semibold">Video Style:</span>{" "}
                  {videoStyle}
                </p>
                {videoStyle === "default" ? (
                  <p>
                    <span className="font-semibold">Background Video:</span>{" "}
                    {selectedVideo}
                  </p>
                ) : (
                  <>
                    <p>
                      <span className="font-semibold">Top Video:</span>{" "}
                      {selectedVideoTop}
                    </p>
                    <p>
                      <span className="font-semibold">Bottom Video:</span>{" "}
                      {selectedVideoBottom}
                    </p>
                  </>
                )}
                <p>
                  <span className="font-semibold">Background Audio:</span>{" "}
                  {selectedAudio}
                </p>
              </div>
              <div className="flex justify-between">
                <button
                  className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button
                  className="py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg"
                  onClick={handleGenerateVideo}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Video"}
                </button>
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
              className="w-full p-6 bg-gray-800 rounded-xl shadow-lg backdrop-blur-lg bg-opacity-20 text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Video Generated!</h2>
              {generatedVideo ? (
                <div>
                  <p className="mb-4">
                    Your video file is:{" "}
                    <span className="text-purple-400">{generatedVideo}</span>
                  </p>
                  <a
                    href={`http://localhost:8000/${generatedVideo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Watch Video
                  </a>
                </div>
              ) : (
                <p>No video generated.</p>
              )}
              <button
                className="mt-6 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                onClick={() => setStep(1)}
              >
                Start Over
              </button>
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
