import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  readPackageJson,
  writePackageJson,
  runInstall,
  detectPackageManager,
} from '../src/io';
import * as fs from 'fs';
import * as child_process from 'child_process';
import { EventEmitter } from 'events';

vi.mock('fs');
vi.mock('child_process');
vi.mock('nanospinner', () => {
  return {
    createSpinner: () => ({
      start: () => ({
        success: vi.fn(),
        error: vi.fn(),
      }),
    }),
  };
});

describe('io module', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('detectPackageManager', () => {
    it('defaults to npm if no lockfile found', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(detectPackageManager()).toEqual({
        cmd: 'npm',
        args: ['install'],
        lockFile: 'package-lock.json',
      });
    });

    it('detects yarn', () => {
      vi.mocked(fs.existsSync).mockImplementation((p) =>
        String(p).includes('yarn.lock'),
      );

      expect(detectPackageManager().cmd).toBe('yarn');
    });

    it('detects pnpm', () => {
      vi.mocked(fs.existsSync).mockImplementation((p) =>
        String(p).includes('pnpm-lock.yaml'),
      );

      expect(detectPackageManager().cmd).toBe('pnpm');
    });

    it('detects bun', () => {
      vi.mocked(fs.existsSync).mockImplementation((p) =>
        String(p).includes('bun.lockb'),
      );

      expect(detectPackageManager().cmd).toBe('bun');
    });
  });

  describe('readPackageJson', () => {
    it('should read and parse package.json', () => {
      const mockData = { name: 'test', version: '1.0.0' };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));

      const result = readPackageJson('package.json');

      expect(result).toEqual(mockData);
      expect(fs.readFileSync).toHaveBeenCalledWith('package.json', 'utf-8');
    });

    it('should throw error on read failure', () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => readPackageJson('package.json')).toThrow(
        'Failed to read package.json',
      );
    });

    it('should throw error on parse failure', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      expect(() => readPackageJson('package.json')).toThrow(
        'Failed to read package.json',
      );
    });
  });

  describe('writePackageJson', () => {
    it('should write content to package.json', () => {
      const mockData = { name: 'test' };

      writePackageJson('package.json', mockData);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'package.json',
        JSON.stringify(mockData, null, 2) + '\n',
      );
    });

    it('should throw error on write failure', () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => writePackageJson('package.json', {})).toThrow(
        'Failed to write package.json',
      );
    });
  });

  describe('runInstall', () => {
    it('should resolve on successful install', async () => {
      const mockChild = new EventEmitter();

      (mockChild as any).on = vi.fn((event, cb) => {
        if (event === 'close') {
          // simulate immediate close
          setTimeout(() => cb(0), 10);
        }

        return mockChild;
      });

      vi.mocked(child_process.spawn).mockReturnValue(mockChild as any);

      await expect(
        runInstall({
          cmd: 'npm',
          args: ['install'],
          lockFile: 'package-lock.json',
        }),
      ).resolves.toBeUndefined();
    });

    it('should reject on failed install (non-zero exit)', async () => {
      const mockChild = new EventEmitter();

      (mockChild as any).on = vi.fn((event, cb) => {
        if (event === 'close') {
          setTimeout(() => cb(1), 10);
        }

        return mockChild;
      });

      vi.mocked(child_process.spawn).mockReturnValue(mockChild as any);

      await expect(
        runInstall({
          cmd: 'npm',
          args: ['install'],
          lockFile: 'package-lock.json',
        }),
      ).rejects.toThrow('npm exit 1');
    });

    it('should reject on spawn error', async () => {
      const mockChild = new EventEmitter();

      // we can simulate error event
      (mockChild as any).on = vi.fn((event, cb) => {
        if (event === 'error') {
          setTimeout(() => cb(new Error('Spawn failed')), 10);
        }

        // we need to handle 'close' too so promise doesn't hang if implementation waits for it?
        // the implementation listens to both. if error fires, it rejectts.
        return mockChild;
      });

      vi.mocked(child_process.spawn).mockReturnValue(mockChild as any);

      await expect(
        runInstall({
          cmd: 'npm',
          args: ['install'],
          lockFile: 'package-lock.json',
        }),
      ).rejects.toThrow('Spawn failed');
    });
  });
});
