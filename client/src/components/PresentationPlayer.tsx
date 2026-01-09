import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { PresentationConfig, PresentationState, Slide } from '@shared/presentation';
import './PresentationPlayer.css';

interface PresentationPlayerProps {
  presentation: PresentationConfig;
  onStateChange?: (state: PresentationState) => void;
}

export default function PresentationPlayer({ presentation, onStateChange }: PresentationPlayerProps) {
  const [state, setState] = useState<PresentationState>({
    isPlaying: false,
    currentTime: 0,
    currentSlideIndex: 0,
    progress: 0,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Find current slide based on time
  const getCurrentSlide = (time: number): Slide | undefined => {
    return presentation.slides.find(
      (slide) => time >= slide.startTime && time < slide.startTime + slide.duration
    );
  };

  // Get current slide for rendering
  const currentSlide = presentation.slides[state.currentSlideIndex];

  // Update state on time change
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // Animation loop for playback
  useEffect(() => {
    if (!state.isPlaying) return;

    const animate = () => {
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime * 1000; // Convert to ms
        const progress = (currentTime / presentation.totalDuration) * 100;
        const slide = getCurrentSlide(currentTime);
        const slideIndex = presentation.slides.findIndex(
          (s) => s === slide
        );

        setState((prev) => ({
          ...prev,
          currentTime,
          progress: Math.min(progress, 100),
          currentSlideIndex: slideIndex >= 0 ? slideIndex : 0,
        }));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying, presentation, getCurrentSlide]);

  // Handle play/pause
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  // Handle progress bar change
  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * presentation.totalDuration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime / 1000; // Convert back to seconds
      setState((prev) => ({
        ...prev,
        currentTime: newTime,
        progress: value[0],
      }));
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setMasterVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Format time display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;
    return `${minutes}:${displaySeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="presentation-player">
      {/* Main presentation area */}
      <div className="presentation-viewport">
        {/* Slide background */}
        <div
          className="slide-background"
          style={{
            backgroundColor: currentSlide?.backgroundColor || '#000',
            backgroundImage: currentSlide?.backgroundImage
              ? `url(${currentSlide.backgroundImage})`
              : undefined,
          }}
        />

        {/* Slide content */}
        <div className="slide-content">
          <div className="slide-text">
            {currentSlide?.title && (
              <h1 className="slide-title">{currentSlide.title}</h1>
            )}
            {currentSlide?.subtitle && (
              <h2 className="slide-subtitle">{currentSlide.subtitle}</h2>
            )}
          </div>
        </div>

        {/* Presenter avatar (placeholder) */}
        <div className="presenter-avatar">
          <div className="avatar-placeholder">
            {presentation.presenter.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="presentation-controls">
        {/* Play/Pause button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handlePlayPause}
          className="control-button"
        >
          {state.isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        {/* Progress bar */}
        <div className="progress-section">
          <Slider
            value={[state.progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className="progress-slider"
          />
          <div className="time-display">
            <span>{formatTime(state.currentTime)}</span>
            <span>/</span>
            <span>{formatTime(presentation.totalDuration)}</span>
          </div>
        </div>

        {/* Volume control */}
        <div className="volume-section">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="control-button"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : masterVolume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.01}
            className="volume-slider"
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setState((prev) => ({ ...prev, isPlaying: false }))}
      />
    </div>
  );
}
