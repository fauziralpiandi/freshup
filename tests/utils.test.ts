import { describe, it, expect, vi } from 'vitest';
import {
  resolveTargetVersion,
  extractVersionPrefix,
  validateDependencies,
  applyUpdates,
  getVersionFromPkgJson,
} from '../src/core';

describe('extractVersionPrefix', () => {
  it('detects caret (^)', () => {
    expect(extractVersionPrefix('^1.2.3')).toBe('^');
  });

  it('detects tilde (~)', () => {
    expect(extractVersionPrefix('~1.2.3')).toBe('~');
  });

  it('detects no prefix', () => {
    expect(extractVersionPrefix('1.2.3')).toBe('');
  });

  it('detects exact version', () => {
    expect(extractVersionPrefix('1.2.3')).toBe('');
  });

  it('handles x notation', () => {
    expect(extractVersionPrefix('1.x')).toBe('^');
    expect(extractVersionPrefix('1.2.x')).toBe('~');
  });
});

describe('resolveTargetVersion', () => {
  const current = '^1.2.0';
  const latest = '2.5.1';

  it('handles "latest" mode (preserves prefix)', () => {
    expect(resolveTargetVersion(current, latest, 'latest')).toBe('^2.5.1');
  });

  it('handles "major" mode', () => {
    expect(resolveTargetVersion(current, latest, 'major')).toBe('^2.0.0');
  });

  it('handles "minor" mode', () => {
    expect(resolveTargetVersion(current, latest, 'minor')).toBe('^2.5.0');
  });

  it('handles "patch" mode', () => {
    expect(resolveTargetVersion(current, latest, 'patch')).toBe('~2.5.0');
  });

  it('handles non-prefixed versions', () => {
    expect(resolveTargetVersion('1.0.0', '2.0.0', 'latest')).toBe('2.0.0');
  });

  it('uses versions array for patch/minor/major modes', () => {
    const versions = ['1.0.0', '1.0.1', '1.1.0', '2.0.0'];

    expect(resolveTargetVersion('1.0.0', '2.0.0', 'patch', versions)).toBe(
      '1.0.1',
    );
    expect(resolveTargetVersion('1.0.0', '2.0.0', 'minor', versions)).toBe(
      '1.1.0',
    );
    expect(resolveTargetVersion('1.0.0', '2.0.0', 'major', versions)).toBe(
      '2.0.0',
    );
  });
});

describe('validateDependencies', () => {
  it('should log warnings for invalid versions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const pkg = {
      dependencies: {
        'invalid-pkg': 'invalid',
        'valid-pkg': '1.0.0',
      },
    };

    validateDependencies(pkg);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Found invalid versions'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('invalid-pkg@invalid'),
    );

    consoleSpy.mockRestore();
  });

  it('should not log if all valid', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const pkg = {
      dependencies: {
        'valid-pkg': '1.0.0',
      },
    };

    validateDependencies(pkg);

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('getVersionFromPkgJson', () => {
  const pkg = {
    dependencies: { dep1: '1.0.0' },
    devDependencies: { devDep1: '2.0.0' },
  };

  it('gets dependency version', () => {
    expect(getVersionFromPkgJson(pkg, 'dep1')).toBe('1.0.0');
  });

  it('gets devDependency version', () => {
    expect(getVersionFromPkgJson(pkg, 'devDep1')).toBe('2.0.0');
  });

  it('returns empty string if not found', () => {
    expect(getVersionFromPkgJson(pkg, 'missing')).toBe('');
  });
});

describe('applyUpdates', () => {
  it('updates dependencies', () => {
    const pkg = {
      dependencies: { pkg1: '1.0.0' },
    };
    const updates = {
      pkg1: {
        current: '1.0.0',
        latest: '2.0.0',
        wanted: '2.0.0',
        dependent: 'workspace',
        location: '',
      },
    };

    const count = applyUpdates(pkg, ['pkg1'], updates, 'latest');

    expect(count).toBe(1);
    expect(pkg.dependencies['pkg1']).toBe('2.0.0');
  });

  it('updates devDependencies', () => {
    const pkg = {
      devDependencies: { pkg1: '1.0.0' },
    };
    const updates = {
      pkg1: {
        current: '1.0.0',
        latest: '2.0.0',
        wanted: '2.0.0',
        dependent: 'workspace',
        location: '',
      },
    };

    const count = applyUpdates(pkg, ['pkg1'], updates, 'latest');

    expect(count).toBe(1);
    expect(pkg.devDependencies['pkg1']).toBe('2.0.0');
  });

  it('preserves prefix logic via resolveTargetVersion', () => {
    const pkg = {
      dependencies: { pkg1: '^1.0.0' },
    };
    const updates = {
      pkg1: {
        current: '1.0.0',
        latest: '2.0.0',
        wanted: '2.0.0',
        dependent: 'workspace',
        location: '',
      },
    };

    applyUpdates(pkg, ['pkg1'], updates, 'latest');

    expect(pkg.dependencies['pkg1']).toBe('^2.0.0');
  });
});
