import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";
import ReactAudioPlayer from "react-audio-player";

export default function SFVPage() {
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
  const [playingPreview, setPlayingPreview] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/list_videos")
      .then((res) => res.json())
      .then((data) => {
        if (data.video_files) setAvailableVideos(data.video_files);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/list_audio")
      .then((res) => res.json())
      .then((data) => {
        if (data.audio_files) setAvailableAudios(data.audio_files);
      });
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

  const MediaPreview = ({ type, url, isSelected, onSelect }) => {
    const [hovered, setHovered] = useState(false);
  
    return (
      <motion.div
        className={`relative group flex flex-col cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${
          isSelected
            ? "border-purple-500 bg-purple-500/20"
            : "border-gray-700 hover:border-purple-400"
        }`}
      >
        <div className="relative flex-1" onClick={onSelect}>
          {type === "video" ? (
            <div className="aspect-video bg-gray-900">
              <ReactPlayer
                url={`http://localhost:8000/BACKGROUND_VIDEOS/${url}`}
                width="100%"
                height="100%"
                playing={playingPreview === url}
                muted
                controls
                light={
                  <img
                    src={`http://localhost:8000/video_thumbnail?filename=${url}`}
                    className="w-full h-full object-cover"
                    alt="Video thumbnail"
                  />
                }
                config={{
                  file: {
                    attributes: {
                      crossOrigin: 'anonymous'
                    }
                  }
                }}
              />
              {/* Play/Pause Overlay Button */}
                
            </div>
          ) : (
            <div className="p-4 bg-gray-900/50">
              <ReactAudioPlayer
                src={`http://localhost:8000/BACKGROUND_AUDIO/${url}`}
                controls
                className="w-full audio-player"
                onPlay={() => setPlayingPreview(url)}
                onPause={() => setPlayingPreview(null)}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </div>
  
        {/* Selection Controls Section */}
        <div className="p-3 bg-gradient-to-t from-black/80 to-transparent space-y-2">
          <div className="flex justify-between items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{url}</span>
            <button
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              {isSelected ? "Selected" : "Select"}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };
  const stepVariants = {
    hidden: { x: 100, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-blue-900/20" />
      
      <header className="w-full py-8 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-300">
            SFV Maker
          </h1>
          <p className="mt-2 text-gray-300">Transform stories into videos</p>
        </motion.div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center py-8 relative z-10 max-w-3xl px-4">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full glass-panel p-6"
            >
              <h2 className="text-2xl font-bold text-center mb-6">
                Step 1: Story & Style
              </h2>
              <textarea
                value={redditStory}
                onChange={(e) => setRedditStory(e.target.value)}
                placeholder="Paste your Reddit story here..."
                className="w-full p-4 bg-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6 placeholder-gray-400"
                rows={6}
              />
              <div className="flex flex-col gap-4 mb-6">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer">
                  <input
                    type="radio"
                    value="default"
                    checked={videoStyle === "default"}
                    onChange={() => setVideoStyle("default")}
                    className="form-radio text-purple-500"
                  />
                  <span className="flex-1">Single Video Background</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer">
                  <input
                    type="radio"
                    value="split"
                    checked={videoStyle === "split"}
                    onChange={() => setVideoStyle("split")}
                    className="form-radio text-purple-500"
                  />
                  <span className="flex-1">Split Screen Style</span>
                </label>
              </div>
              <button
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-all"
                onClick={() => setStep(2)}
              >
                Continue
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
              className="w-full glass-panel p-6"
            >
              <h2 className="text-2xl font-bold text-center mb-6">
                Step 2: Select Media
              </h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">
                  {videoStyle === "split" ? "Background Videos" : "Background Video"}
                </h3>
                {videoStyle === "default" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableVideos.map((video) => (
                      <MediaPreview
                        key={video}
                        type="video"
                        url={video}
                        isSelected={selectedVideo === video}
                        onSelect={() => setSelectedVideo(video)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium mb-3">Top Section</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableVideos.map((video) => (
                          <MediaPreview
                            key={video}
                            type="video"
                            url={video}
                            isSelected={selectedVideoTop === video}
                            onSelect={() => setSelectedVideoTop(video)}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-3">Bottom Section</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableVideos.map((video) => (
                          <MediaPreview
                            key={video}
                            type="video"
                            url={video}
                            isSelected={selectedVideoBottom === video}
                            onSelect={() => setSelectedVideoBottom(video)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Background Music</h3>
                <div className="grid grid-cols-1 gap-4">
                  {availableAudios.map((audio) => (
                    <MediaPreview
                      key={audio}
                      type="audio"
                      url={audio}
                      isSelected={selectedAudio === audio}
                      onSelect={() => setSelectedAudio(audio)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <button
                  className="flex-1 py-2 px-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-xl"
                  onClick={() => setStep(3)}
                >
                  Continue
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
              className="w-full glass-panel p-6"
            >
              <h2 className="text-2xl font-bold text-center mb-6">
                Step 3: Confirm & Generate
              </h2>
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-gray-800/30 rounded-xl">
                  <p className="text-sm text-gray-300 mb-1">Reddit Story</p>
                  <p className="truncate">{redditStory.slice(0, 100)}...</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/30 rounded-xl">
                    <p className="text-sm text-gray-300 mb-1">Video Style</p>
                    <p className="capitalize">{videoStyle}</p>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-xl">
                    <p className="text-sm text-gray-300 mb-1">Background Music</p>
                    <p className="truncate">{selectedAudio}</p>
                  </div>
                </div>
                {videoStyle === "default" ? (
                  <div className="p-4 bg-gray-800/30 rounded-xl">
                    <p className="text-sm text-gray-300 mb-1">Selected Video</p>
                    <p className="truncate">{selectedVideo}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/30 rounded-xl">
                      <p className="text-sm text-gray-300 mb-1">Top Video</p>
                      <p className="truncate">{selectedVideoTop}</p>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-xl">
                      <p className="text-sm text-gray-300 mb-1">Bottom Video</p>
                      <p className="truncate">{selectedVideoBottom}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-4">
                <button
                  className="flex-1 py-2 px-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center justify-center"
                  onClick={handleGenerateVideo}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="loading-spinner" />
                  ) : (
                    "Generate Video"
                  )}
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
              className="w-full glass-panel p-6 text-center"
            >
              <h2 className="text-2xl font-bold mb-6">Video Ready! 🎉</h2>
              
              {generatedVideo ? (
                <div className="space-y-6">
                  <div className="aspect-[9/16] w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl">
                    <ReactPlayer
                      url={`http://localhost:8000/${generatedVideo}`}
                      width="100%"
                      height="100%"
                      controls
                      playing
                      className="bg-black"
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <a
                      href={`http://localhost:8000/${generatedVideo}`}
                      download
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium"
                    >
                      Download Video
                    </a>
                    <button
                      className="px-6 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl"
                      onClick={() => setStep(1)}
                    >
                      Create Another
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-gray-400">
                  Video generation failed. Please try again.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-6 text-gray-400 text-sm relative z-10">
        © 2025 OpsisAI
      </footer>
    </div>
  );
}

const PlayIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
  </svg>
);