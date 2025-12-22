import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOutdatedPackages } from '../src/api';
import * as child_process from 'child_process';

vi.mock('child_process', () => {
  return {
    exec: vi.fn(),
  };
});

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

describe('fetchOutdatedPackages', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return empty object if no dependencies', async () => {
    const pkg = { name: 'test' };
    const result = await fetchOutdatedPackages(pkg);

    expect(result).toEqual({});
  });

  it('should filter out invalid version ranges', async () => {
    const pkg = {
      dependencies: {
        'local-pkg': 'file:./local',
        'git-pkg': 'git+ssh://git@github.com:user/repo.git',
        'valid-pkg': '1.0.0',
      },
    };

    const execMock = vi.mocked(child_process.exec);

    execMock.mockImplementation((cmd, cb: any) => {
      if (cmd.includes('valid-pkg')) {
        cb(null, { stdout: JSON.stringify({ version: '1.0.0' }) });
      } else {
        cb(null, { stdout: '' });
      }

      return {} as any;
    });

    // should verify valid-pkg was checked, others were skipped logic is inside the function
    // but since we mock exec, if it calls exec for invalid ones, we'd see it if we spy.
    // the implementation filters BEFORE calling exec.

    // we expect 'local-pkg' and 'git-pkg' to be filtered out.
    // 'valid-pkg' is checked.

    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith(
      expect.stringContaining('valid-pkg'),
      expect.anything(),
    );
  });

  it('should identify outdated packages', async () => {
    const pkg = {
      dependencies: {
        foo: '1.0.0',
      },
    };
    const execMock = vi.mocked(child_process.exec);

    execMock.mockImplementation((cb: any) => {
      cb(null, { stdout: JSON.stringify({ version: '2.0.0' }) });
      return {} as any;
    });

    const result = await fetchOutdatedPackages(pkg);

    expect(result.foo).toBeDefined();
    expect(result.foo!.current).toBe('1.0.0');
    expect(result.foo!.latest).toBe('2.0.0');
  });

  it('should handle packages that are up to date', async () => {
    const pkg = {
      dependencies: {
        foo: '2.0.0',
      },
    };
    const execMock = vi.mocked(child_process.exec);

    execMock.mockImplementation((cb: any) => {
      cb(null, { stdout: JSON.stringify({ version: '2.0.0' }) });
      return {} as any;
    });

    const result = await fetchOutdatedPackages(pkg);

    expect(result).toEqual({});
  });

  it('should handle exec errors gracefully', async () => {
    const pkg = {
      dependencies: {
        foo: '1.0.0',
      },
    };
    const execMock = vi.mocked(child_process.exec);

    execMock.mockImplementation((cb: any) => {
      cb(new Error('Network error'), { stdout: '' });
      return {} as any;
    });

    const result = await fetchOutdatedPackages(pkg);

    expect(result).toEqual({});
  });

  it('should handle array response from npm view (multiple versions)', async () => {
    const pkg = {
      dependencies: {
        foo: '1.0.0',
      },
    };
    const execMock = vi.mocked(child_process.exec);

    execMock.mockImplementation((cb: any) => {
      // npm view output can be an array of versions if requested poorly,
      // or an object with 'versions' array.
      // the code expects `data.version` OR `data[data.length - 1]` (if string array)
      // OR `data.versions` for the list.

      // case: simple version string? no! JSON.parse(stdout).
      // if npm view returns a list of versions as JSON: ["1.0.0", "1.1.0"]
      cb(null, { stdout: JSON.stringify(['1.0.0', '1.1.0']) });
      return {} as any;
    });

    const result = await fetchOutdatedPackages(pkg);

    expect(result.foo).toBeDefined();
    expect(result.foo!.latest).toBe('1.1.0');
  });
});
