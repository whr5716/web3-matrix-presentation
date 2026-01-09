import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export default function Presentation() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
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
    if (videoRef.current && audioRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        audioRef.current.pause();
      } else {
        videoRef.current.play();
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && audioRef.current) {
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
    if (videoRef.current && audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      videoRef.current.currentTime = newTime;
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Main Presentation Container */}
      <div className="w-full max-w-6xl">
        {/* Video Section */}
        <div className="relative w-full mb-8 rounded-lg overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-auto bg-black"
            style={{ aspectRatio: "16/9" }}
          >
            <source src="/mario-talking-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Slide Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-2">{slides[currentSlide].title}</h1>
              <h2 className="text-3xl font-semibold text-blue-400 mb-2">
                {slides[currentSlide].subtitle}
              </h2>
              <p className="text-xl text-gray-200">{slides[currentSlide].description}</p>
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          {/* Progress Bar */}
          <div
            onClick={handleProgressClick}
            className="w-full h-2 bg-slate-700 rounded-full cursor-pointer mb-4 hover:h-3 transition-all"
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Time Display and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePlayPause}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>

              <Button
                onClick={handleMute}
                variant="outline"
                className="text-white border-slate-600 hover:bg-slate-700"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
            </div>

            <div className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-white">
          <p className="text-lg text-gray-300">
            Web3 Matrix AI Presentation Demo
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click play to experience the full presentation with Mario's narration
          </p>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src="/mario-narration-full.wav" />
    </div>
  );
}
