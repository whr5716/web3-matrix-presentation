import { describe, it, expect } from 'vitest';
import { web3MatrixPresentation } from '@shared/presentation';

describe('PresentationPlayer', () => {
  describe('Presentation Data', () => {
    it('should have valid presentation configuration', () => {
      expect(web3MatrixPresentation).toBeDefined();
      expect(web3MatrixPresentation.id).toBe('web3-matrix-hero');
      expect(web3MatrixPresentation.presenter).toBeDefined();
      expect(web3MatrixPresentation.slides).toBeDefined();
      expect(web3MatrixPresentation.slides.length).toBeGreaterThan(0);
    });

    it('should have presenter information', () => {
      const { presenter } = web3MatrixPresentation;
      expect(presenter.name).toBe('Mario G. Rodriguez');
      expect(presenter.title).toBe('The Hyper Driver');
      expect(presenter.avatarUrl).toBe('/mario-presenter.png');
      expect(presenter.bio).toBeTruthy();
    });

    it('should have valid slides with required properties', () => {
      web3MatrixPresentation.slides.forEach((slide) => {
        expect(slide.id).toBeTruthy();
        expect(slide.type).toBeTruthy();
        expect(slide.title).toBeTruthy();
        expect(slide.startTime).toBeGreaterThanOrEqual(0);
        expect(slide.duration).toBeGreaterThan(0);
        expect(slide.backgroundColor).toBeTruthy();
      });
    });

    it('should have proper slide timing', () => {
      let previousEndTime = 0;
      web3MatrixPresentation.slides.forEach((slide) => {
        expect(slide.startTime).toBeGreaterThanOrEqual(previousEndTime);
        previousEndTime = slide.startTime + slide.duration;
      });
    });

    it('should have background music configuration', () => {
      const { backgroundMusic } = web3MatrixPresentation;
      expect(backgroundMusic).toBeDefined();
      expect(backgroundMusic?.url).toBe('/ambient-music.mp3');
      expect(backgroundMusic?.volume).toBeGreaterThan(0);
      expect(backgroundMusic?.volume).toBeLessThanOrEqual(1);
    });

    it('should have narration enabled', () => {
      const { narration } = web3MatrixPresentation;
      expect(narration).toBeDefined();
      expect(narration?.enabled).toBe(true);
      expect(narration?.voice).toBe('male');
      expect(narration?.speed).toBeGreaterThan(0.5);
      expect(narration?.speed).toBeLessThan(2);
    });

    it('should have correct total duration', () => {
      expect(web3MatrixPresentation.totalDuration).toBeGreaterThan(0);
      expect(web3MatrixPresentation.totalDuration).toBe(30000); // 30 seconds
    });

    it('should have all required slide types', () => {
      const slideTypes = web3MatrixPresentation.slides.map((s) => s.type);
      expect(slideTypes).toContain('hook');
      expect(slideTypes).toContain('intro');
      expect(slideTypes).toContain('value-prop');
      expect(slideTypes).toContain('cta');
    });

    it('should have narration text for each slide', () => {
      web3MatrixPresentation.slides.forEach((slide) => {
        expect(slide.narration).toBeTruthy();
        expect(slide.narration?.length).toBeGreaterThan(0);
      });
    });

    it('should have animation properties for slides', () => {
      web3MatrixPresentation.slides.forEach((slide) => {
        expect(slide.animationIn).toBeTruthy();
        expect(['fade', 'slide', 'zoom']).toContain(slide.animationIn);
      });
    });
  });

  describe('Time Calculations', () => {
    it('should format time correctly', () => {
      const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        return `${minutes}:${displaySeconds.toString().padStart(2, '0')}`;
      };

      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(5000)).toBe('0:05');
      expect(formatTime(60000)).toBe('1:00');
      expect(formatTime(125000)).toBe('2:05');
    });

    it('should calculate progress correctly', () => {
      const totalDuration = web3MatrixPresentation.totalDuration;
      const currentTime = totalDuration / 2;
      const progress = (currentTime / totalDuration) * 100;

      expect(progress).toBe(50);
    });
  });

  describe('Slide Navigation', () => {
    it('should find current slide based on time', () => {
      const getCurrentSlide = (time: number) => {
        return web3MatrixPresentation.slides.find(
          (slide) => time >= slide.startTime && time < slide.startTime + slide.duration
        );
      };

      // Test first slide
      const slide1 = getCurrentSlide(2500);
      expect(slide1?.id).toBe('slide-1');

      // Test second slide
      const slide2 = getCurrentSlide(7000);
      expect(slide2?.id).toBe('slide-2');

      // Test third slide
      const slide3 = getCurrentSlide(15000);
      expect(slide3?.id).toBe('slide-3');

      // Test fourth slide
      const slide4 = getCurrentSlide(22000);
      expect(slide4?.id).toBe('slide-4');
    });

    it('should return undefined for time outside presentation', () => {
      const getCurrentSlide = (time: number) => {
        return web3MatrixPresentation.slides.find(
          (slide) => time >= slide.startTime && time < slide.startTime + slide.duration
        );
      };

      const slideBeforeStart = getCurrentSlide(-1000);
      expect(slideBeforeStart).toBeUndefined();

      const slideAfterEnd = getCurrentSlide(web3MatrixPresentation.totalDuration + 1000);
      expect(slideAfterEnd).toBeUndefined();
    });
  });
});
