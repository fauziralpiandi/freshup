import { describe, it, expect } from 'vitest';
import { getModeDescription, getColorByDiff } from '../src/ui';
import pc from 'picocolors';

describe('ui module', () => {
  describe('getModeDescription', () => {
    it('returns correct descriptions', () => {
      expect(getModeDescription('latest')).toBe('latest');
      expect(getModeDescription('major')).toBe('major (breaking)');
      expect(getModeDescription('minor')).toBe('minor (feature)');
      expect(getModeDescription('patch')).toBe('patch (fix)');
    });
  });

  describe('getColorByDiff', () => {
    it('returns red for major changes', () => {
      // we can't easily check if it's the RED function because they are identical in some environments or just functions
      // but we can check if it returns something different or use a spy on pc.red if we mock it
      // since pc is a simple proxy usually, we can check if it behaves as expcted
      const red = getColorByDiff('1.0.0', '2.0.0');

      expect(red('test')).toBe(pc.red('test'));
    });

    it('returns cyan for minor changes', () => {
      const cyan = getColorByDiff('1.0.0', '1.1.0');

      expect(cyan('test')).toBe(pc.cyan('test'));
    });

    it('returns green for patch changes', () => {
      const green = getColorByDiff('1.0.0', '1.0.1');

      expect(green('test')).toBe(pc.green('test'));
    });

    it('returns green for invalid versions', () => {
      const green = getColorByDiff('invalid', '1.0.0');

      expect(green('test')).toBe(pc.green('test'));
    });
  });
});
