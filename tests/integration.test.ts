import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';

const mocks = vi.hoisted(() => ({
  fetchOutdatedPackages: vi.fn(),
  prompts: vi.fn(),
  detectPackageManager: vi.fn(),
}));

vi.mock('../src/api', () => ({
  fetchOutdatedPackages: mocks.fetchOutdatedPackages,
}));

vi.mock('../src/io', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/io')>();

  return {
    ...actual,
    detectPackageManager: mocks.detectPackageManager,
    runInstall: vi.fn(),
  };
});

vi.mock('prompts', () => ({ default: mocks.prompts }));

import { main } from '../src/index';

describe('Freshup Integration', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'freshup-test-'));
    originalCwd = process.cwd();

    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    mocks.fetchOutdatedPackages.mockReset();
    mocks.prompts.mockReset();
    mocks.detectPackageManager.mockReturnValue({
      cmd: 'npm',
      args: ['install'],
      lockFile: 'package-lock.json',
    });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should update outdated packages when user selects them', async () => {
    const initialPkg = {
      name: 'test-app',
      dependencies: {
        react: '17.0.0',
        lodash: '4.0.0',
      },
    };

    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify(initialPkg, null, 2),
    );

    mocks.fetchOutdatedPackages.mockResolvedValue({
      react: {
        current: '17.0.0',
        latest: '18.2.0',
        wanted: '18.2.0',
        dependent: 'workspace',
        location: 'node_modules',
      },
    });

    mocks.prompts.mockResolvedValue({ packages: ['react'] });

    process.argv = ['node', 'freshup'];
    await main();

    const updatedPkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'),
    );

    expect(updatedPkg.dependencies.react).toBe('18.2.0');
    expect(updatedPkg.dependencies.lodash).toBe('4.0.0');
  });

  it('should handle no outdated packages gracefully', async () => {
    const initialPkg = { name: 'test-app', dependencies: { react: '18.2.0' } };

    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify(initialPkg),
    );

    mocks.fetchOutdatedPackages.mockResolvedValue({});

    process.argv = ['node', 'freshup'];
    await main();

    expect(mocks.prompts).not.toHaveBeenCalled();
  });

  it('should preserve version prefix (e.g. ^) when updating', async () => {
    const initialPkg = {
      name: 'test-app',
      dependencies: {
        react: '^17.0.0', // has caret
      },
    };

    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify(initialPkg, null, 2),
    );

    mocks.fetchOutdatedPackages.mockResolvedValue({
      react: {
        current: '17.0.0',
        latest: '18.2.0',
        wanted: '18.2.0',
        dependent: 'workspace',
        location: 'node_modules',
      },
    });

    mocks.prompts.mockResolvedValue({ packages: ['react'] });

    process.argv = ['node', 'freshup'];
    await main();

    const updatedPkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'),
    );

    expect(updatedPkg.dependencies.react).toBe('^18.2.0');
  });

  it('should not update package.json in dry-run mode', async () => {
    const initialPkg = {
      name: 'test-app',
      dependencies: { react: '17.0.0' },
    };

    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify(initialPkg, null, 2),
    );

    mocks.fetchOutdatedPackages.mockResolvedValue({
      react: {
        current: '17.0.0',
        latest: '18.0.0',
        wanted: '18.0.0',
        dependent: '',
        location: '',
      },
    });
    mocks.prompts.mockResolvedValue({ packages: ['react'] });

    process.argv = ['node', 'freshup', '--dry-run'];
    await main();

    const updatedPkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'),
    );

    expect(updatedPkg.dependencies.react).toBe('17.0.0');
  });

  it('should skip prompt when --write flag is used', async () => {
    const initialPkg = {
      name: 'test-app',
      dependencies: { react: '17.0.0' },
    };

    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify(initialPkg, null, 2),
    );

    mocks.fetchOutdatedPackages.mockResolvedValue({
      react: {
        current: '17.0.0',
        latest: '18.0.0',
        wanted: '18.0.0',
        dependent: '',
        location: '',
      },
    });

    process.argv = ['node', 'freshup', '--write'];
    await main();

    expect(mocks.prompts).not.toHaveBeenCalled();

    const updatedPkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'),
    );

    expect(updatedPkg.dependencies.react).toBe('18.0.0');
  });
});
