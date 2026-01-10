import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export default function Presentation() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Something Big",
      subtitle: "And I Mean HUGE",
      description: "Is About to Happen This Coming Week",
    },
    {
      title: "Meet Mario",
      subtitle: "The Hyper Driver",
      description: "From Galveston, Texas",
    },
    {
      title: "Real Value",
      subtitle: "Real Opportunity",
      description: "Real Purpose",
    },
    {
      title: "No Apologies",
      subtitle: "No Regrets",
      description: "Something You'll Be Proud to Share",
    },
  ];

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      // Update slide based on time
      const timeInSeconds = videoRef.current.currentTime;
      if (timeInSeconds < 15) setCurrentSlide(0);
      else if (timeInSeconds < 30) setCurrentSlide(1);
      else if (timeInSeconds < 45) setCurrentSlide(2);
      else setCurrentSlide(3);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Main Presentation Container */}
      <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-6xl">
        {/* Video Section - Responsive */}
        <div className="relative w-full mb-4 sm:mb-6 md:mb-8 rounded-lg overflow-hidden shadow-2xl bg-black">
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-auto bg-black"
            style={{ aspectRatio: "16/9" }}
            controls
          >
            <source src="/mario-talking-30sec.mp4" type="video/mp4" />
            <p className="text-white p-4 sm:p-6 md:p-8 text-center text-sm sm:text-base">
              Your browser does not support HTML5 video.
            </p>
          </video>

          {/* Slide Overlay - Responsive Text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="text-white">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 leading-tight">
                {slides[currentSlide].title}
              </h1>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-blue-400 mb-1 sm:mb-2">
                {slides[currentSlide].subtitle}
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200">
                {slides[currentSlide].description}
              </p>
            </div>
          </div>
        </div>

        {/* Player Controls - Responsive */}
        <div className="bg-slate-800 rounded-lg p-3 sm:p-4 md:p-6 shadow-xl">
          {/* Progress Bar */}
          <div
            onClick={handleProgressClick}
            className="w-full h-1.5 sm:h-2 bg-slate-700 rounded-full cursor-pointer mb-3 sm:mb-4 hover:h-2 sm:hover:h-3 transition-all"
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Time Display and Controls - Responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <Button
                onClick={handlePlayPause}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 sm:p-3"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </Button>

              <Button
                onClick={handleMute}
                variant="outline"
                className="text-white border-slate-600 hover:bg-slate-700 p-2 sm:p-3"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>

            <div className="text-white text-xs sm:text-sm font-mono whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Info Section - Responsive */}
        <div className="mt-6 sm:mt-8 text-center text-white">
          <p className="text-base sm:text-lg md:text-xl text-gray-300">
            Web3 Matrix AI Presentation Demo
          </p>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-2">
            Click play to experience the full presentation with Mario's narration
          </p>

          {/* Fallback links for older browsers - Responsive */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-600">
            <p className="text-xs sm:text-sm text-gray-400 mb-3">Having trouble? Try these direct links:</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 justify-center">
              <a
                href="/mario-talking-video.mp4"
                className="text-blue-400 hover:text-blue-300 underline text-xs sm:text-sm"
                download
              >
                Download Video
              </a>
              <a
                href="/mario-narration-full.wav"
                className="text-blue-400 hover:text-blue-300 underline text-xs sm:text-sm"
                download
              >
                Download Audio
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
