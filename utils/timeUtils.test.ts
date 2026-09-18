import { describe, it, expect } from 'vitest';
import { formatTime, parseISO8601Duration } from './timeUtils';

describe('timeUtils', () => {
  describe('formatTime', () => {
    it('formats seconds into MM:SS correctly', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(59)).toBe('00:59');
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(3599)).toBe('59:59');
    });
  });

  describe('parseISO8601Duration', () => {
    it('parses valid ISO8601 durations correctly', () => {
      expect(parseISO8601Duration('PT0S')).toBe('0:00');
      expect(parseISO8601Duration('PT30S')).toBe('0:30');
      expect(parseISO8601Duration('PT5M')).toBe('5:00');
      expect(parseISO8601Duration('PT5M30S')).toBe('5:30');
      expect(parseISO8601Duration('PT1H5M30S')).toBe('1:05:30');
    });

    it('handles empty or invalid strings', () => {
      expect(parseISO8601Duration('')).toBe('0:00');
      expect(parseISO8601Duration('invalid')).toBe('0:00');
    });
  });
});
