import { useEffect, useRef, useState } from 'react';
import PresentationPlayer from '@/components/PresentationPlayer';
import { web3MatrixPresentation } from '@shared/presentation';
import type { PresentationState } from '@shared/presentation';

export default function Presentation() {
  const [presentationState, setPresentationState] = useState<PresentationState>({
    isPlaying: false,
    currentTime: 0,
    currentSlideIndex: 0,
    progress: 0,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);

  // Handle presentation state changes
  const handleStateChange = (state: PresentationState) => {
    setPresentationState(state);
  };

  // Sync background music with narration
  useEffect(() => {
    if (presentationState.isPlaying) {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.volume = web3MatrixPresentation.backgroundMusic?.volume || 0.3;
        backgroundAudioRef.current.play().catch(() => {
          // Autoplay might be blocked by browser
          console.log('Background music autoplay blocked');
        });
      }
    } else {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
    }
  }, [presentationState.isPlaying]);

  return (
    <div className="presentation-page">
      <PresentationPlayer
        presentation={web3MatrixPresentation}
        onStateChange={handleStateChange}
      />

      {/* Background music audio element */}
      <audio
        ref={backgroundAudioRef}
        src={web3MatrixPresentation.backgroundMusic?.url}
        loop
      />

      {/* Hidden narration audio element (for future integration) */}
      <audio
        ref={audioRef}
        src="/narration-opening.wav"
      />
    </div>
  );
}
