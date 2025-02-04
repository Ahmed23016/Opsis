import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";
import ReactAudioPlayer from "react-audio-player";

export default function SFVPage() {
  const [activeTab, setActiveTab] = useState("reddit");
  const [redditStory, setRedditStory] = useState("");
  const [videoStyle, setVideoStyle] = useState("default");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideoTop, setSelectedVideoTop] = useState(null);
  const [selectedVideoBottom, setSelectedVideoBottom] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [selectedMainVideo, setSelectedMainVideo] = useState(null);
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
    
    fetch("http://localhost:8000/list_audio")
      .then((res) => res.json())
      .then((data) => {
        if (data.audio_files) setAvailableAudios(data.audio_files);
      });
  }, []);

  const handleGenerate = async () => {
    if (activeTab === "reddit") {
      if (!redditStory.trim()) return alert("Please enter a Reddit story");
      if (videoStyle === "default" && !selectedVideo) return alert("Please select a background video");
      if (videoStyle === "split" && (!selectedVideoTop || !selectedVideoBottom)) return alert("Please select both videos");
      if (!selectedAudio) return alert("Please select background audio");

      const payload = {
        reddit_story: redditStory,
        style: videoStyle,
        background_video: videoStyle === "default" ? selectedVideo : undefined,
        background_video_top: videoStyle === "split" ? selectedVideoTop : undefined,
        background_video_bottom: videoStyle === "split" ? selectedVideoBottom : undefined,
        background_music: selectedAudio,
      };

      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/generate_reddit_video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setGeneratedVideo(data.video_file);
      } catch (error) {
        alert("Error generating video: " + error.message);
      }
    } else {
      if (!selectedMainVideo || !selectedVideo || !selectedAudio) {
        return alert("Please select all required media files");
      }

      const payload = {
        main_video: selectedMainVideo,
        background_video: selectedVideo,
        background_music: selectedAudio,
      };

      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/generate_video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setGeneratedVideo(data.video_file);
      } catch (error) {
        alert("Error generating video: " + error.message);
      }
    }
    setLoading(false);
  };

  const MediaCard = ({ type, url, isSelected, onSelect }) => {
    const [hovered, setHovered] = useState(false);

    return (
      <motion.div
        className={`relative group flex flex-col cursor-pointer rounded-lg overflow-hidden border ${
          isSelected ? "border-zinc-400 bg-zinc-700 text-white" : "border-zinc-700 hover:border-zinc-500"
        }`}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        <div className="relative aspect-video bg-zinc-900">
          {type === "video" && (
            <ReactPlayer
              url={`http://localhost:8000/BACKGROUND_VIDEOS/${url}`}
              width="100%"
              height="100%"
              playing={hovered}
              muted
              light={
                <img
                  src={`http://localhost:8000/video_thumbnail?filename=${url}`}
                  className="w-full h-full object-cover"
                  alt="Thumbnail"
                />
              }
            />
          )}
          {type === "audio" && (
            <div className="p-4 h-full flex items-center justify-center bg-zinc-800">
              <ReactAudioPlayer
                src={`http://localhost:8000/BACKGROUND_AUDIO/${url}`}
                controls
                className="w-full"
              />
            </div>
          )}
        </div>
        <div className="p-3 bg-zinc-900">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-300 truncate">{url}</span>
            <button
              className={` p-3  py-1 text-xs rounded-md ${
                isSelected ? "bg-green-500" : "bg-zinc-700 hover:bg-zinc-600"
              }`}
              onClick={onSelect}
            >
              {isSelected ? "Selected" : "Select"}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100 p-8">
      <header>
        <h1 className="font-bold text-5xl text-center font-babasneue">Short Form</h1>
      </header>
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-4 mb-8 border-b border-zinc-700 pb-4">
          <button
            className={`px-4 py-2 rounded-t-lg ${
              activeTab === "reddit" ? "bg-zinc-800 text-white" : "hover:bg-zinc-800/50"
            }`}
            onClick={() => setActiveTab("reddit")}
          >
            Reddit Video
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg ${
              activeTab === "tiktok" ? "bg-zinc-800 text-white" : "hover:bg-zinc-800/50"
            }`}
            onClick={() => setActiveTab("tiktok")}
          >
            TikTok Video
          </button>
        </div>

        {activeTab === "reddit" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Story Input</h2>
                <textarea
                  value={redditStory}
                  onChange={(e) => setRedditStory(e.target.value)}
                  placeholder="Paste Reddit story here..."
                  className="w-full h-48 p-4 bg-zinc-800 rounded-lg border border-zinc-700 focus:ring-2 focus:ring-zinc-500 focus:outline-none"
                />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Video Style</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className={`p-4 rounded-lg border ${
                      videoStyle === "default" 
                        ? "border-zinc-400 bg-zinc-800" 
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                    onClick={() => setVideoStyle("default")}
                  >
                    Single Background
                  </button>
                  <button
                    className={`p-4 rounded-lg border ${
                      videoStyle === "split" 
                        ? "border-zinc-400 bg-zinc-800" 
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                    onClick={() => setVideoStyle("split")}
                  >
                    Split Screen
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Media Selection</h2>
                {videoStyle === "split" ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-zinc-300">Top Video</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {availableVideos.map((video) => (
                          <MediaCard
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
                      <h3 className="mb-3 text-zinc-300">Bottom Video</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {availableVideos.map((video) => (
                          <MediaCard
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
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {availableVideos.map((video) => (
                      <MediaCard
                        key={video}
                        type="video"
                        url={video}
                        isSelected={selectedVideo === video}
                        onSelect={() => setSelectedVideo(video)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-4 text-zinc-300">Background Music</h3>
                <div className="grid grid-cols-1 gap-4">
                  {availableAudios.map((audio) => (
                    <MediaCard
                      key={audio}
                      type="audio"
                      url={audio}
                      isSelected={selectedAudio === audio}
                      onSelect={() => setSelectedAudio(audio)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Main Video</h2>
              <div className="grid grid-cols-1 gap-4">
                {availableVideos.map((video) => (
                  <MediaCard
                    key={video}
                    type="video"
                    url={video}
                    isSelected={selectedMainVideo === video}
                    onSelect={() => setSelectedMainVideo(video)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Background Video</h2>
              <div className="grid grid-cols-1 gap-4">
                {availableVideos.map((video) => (
                  <MediaCard
                    key={video}
                    type="video"
                    url={video}
                    isSelected={selectedVideo === video}
                    onSelect={() => setSelectedVideo(video)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Background Music</h2>
              <div className="grid grid-cols-1 gap-4">
                {availableAudios.map((audio) => (
                  <MediaCard
                    key={audio}
                    type="audio"
                    url={audio}
                    isSelected={selectedAudio === audio}
                    onSelect={() => setSelectedAudio(audio)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-4">
          <button
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Video"}
          </button>
        </div>

        {generatedVideo && (
          <div className="mt-8 p-6 bg-zinc-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Generated Video</h2>
            <div className="aspect-video w-full max-w-2xl">
              <ReactPlayer
                url={`http://localhost:8000/${generatedVideo}`}
                width="100%"
                height="100%"
                controls
                className="bg-black rounded-lg overflow-hidden"
              />
            </div>
            <a
              href={`http://localhost:8000/${generatedVideo}`}
              download
              className="inline-block mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
            >
              Download Video
            </a>
          </div>
        )}
      </div>
    </div>
  );
}