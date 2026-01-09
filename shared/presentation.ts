/**
 * Presentation Data Structure
 * Defines the core types and data for the Web3 Matrix presentation
 */

export type SlideType = 'title' | 'intro' | 'hook' | 'value-prop' | 'cta';

export interface Slide {
  id: string;
  type: SlideType;
  title: string;
  subtitle?: string;
  content?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  startTime: number; // milliseconds
  duration: number; // milliseconds
  narration?: string; // Text to be narrated
  animationIn?: 'fade' | 'slide' | 'zoom';
  animationOut?: 'fade' | 'slide' | 'zoom';
}

export interface PresentationConfig {
  id: string;
  title: string;
  presenter: {
    name: string;
    title: string;
    avatarUrl: string;
    bio: string;
  };
  slides: Slide[];
  totalDuration: number; // milliseconds
  backgroundMusic?: {
    url: string;
    volume: number; // 0-1
    fadeIn?: number; // milliseconds
    fadeOut?: number; // milliseconds
  };
  narration?: {
    enabled: boolean;
    voice: 'male' | 'female';
    speed: number; // 0.8-1.5
    volume: number; // 0-1
  };
}

export interface PresentationState {
  isPlaying: boolean;
  currentTime: number; // milliseconds
  currentSlideIndex: number;
  progress: number; // 0-100
}

// Presentation data for the 2-3 minute POC
export const web3MatrixPresentation: PresentationConfig = {
  id: 'web3-matrix-hero',
  title: 'Web3 Matrix - Something Big is About to Happen',
  presenter: {
    name: 'Mario G. Rodriguez',
    title: 'The Hyper Driver',
    avatarUrl: '/mario-presenter.png',
    bio: 'Semi-retired professional driver from Galveston, Texas',
  },
  slides: [
    {
      id: 'slide-1',
      type: 'hook',
      title: 'Something Big',
      subtitle: 'And I Mean HUGE',
      startTime: 0,
      duration: 5000,
      narration: 'Something big — and I mean huge — is about to happen this coming week. What you\'re about to hear is not like anything you\'ve heard before.',
      animationIn: 'fade',
      backgroundColor: '#1a1a2e',
    },
    {
      id: 'slide-2',
      type: 'intro',
      title: 'Meet Mario',
      subtitle: 'The Hyper Driver',
      startTime: 5000,
      duration: 8000,
      narration: 'My name is Mario. Many people know me as "The Hyper Driver." I live in Galveston, Texas. I\'m semi-retired and work as a professional driver, security driver, and designated driver. What I enjoy most is meeting people, and over the years I\'ve met incredible souls from all over the world. That\'s why I\'m here today.',
      animationIn: 'fade',
      backgroundColor: '#0f3460',
    },
    {
      id: 'slide-3',
      type: 'value-prop',
      title: 'Real Value',
      subtitle: 'No Hype. No Smoke and Mirrors.',
      startTime: 13000,
      duration: 7000,
      narration: 'This is not hype. There\'s no smoke and mirrors. And there\'s no pie-in-the-sky promises. This is about real value, a real opportunity, and a real purpose.',
      animationIn: 'fade',
      backgroundColor: '#16213e',
    },
    {
      id: 'slide-4',
      type: 'cta',
      title: 'Web3 Matrix',
      subtitle: 'Like Groupon — On Steroids',
      startTime: 20000,
      duration: 5000,
      narration: 'Web3 Matrix is like Groupon — on steroids. In its first three years, Groupon reached over 150 million customers in 35 countries — and they never rewarded referrals. Now imagine that model — but this time, everyone wins.',
      animationIn: 'fade',
      backgroundColor: '#0f3460',
    },
  ],
  totalDuration: 30000, // 30 seconds for POC (will expand to 2-3 minutes)
  backgroundMusic: {
    url: '/ambient-music.mp3',
    volume: 0.3,
    fadeIn: 2000,
    fadeOut: 2000,
  },
  narration: {
    enabled: true,
    voice: 'male',
    speed: 1.0,
    volume: 0.8,
  },
};
