import pc from 'picocolors';
import semver from 'semver';

import { OutdatedOutput, UpdateMode } from './types';

export function extractVersionPrefix(versionString: string): string {
  const prefixes = ['>=', '<=', '>', '<', '~', '^'];
  const trimmed = versionString.trim();

  if (trimmed === '*' || trimmed === '') return '';

  for (const prefix of prefixes) if (trimmed.startsWith(prefix)) return prefix;

  if (trimmed.includes('x')) {
    const parts = trimmed.split('.');

    if (parts[0] === 'x') return '';
    if (parts[1] === 'x') return '^';
    if (parts[2] === 'x') return '~';
  }

  return '';
}

export function resolveTargetVersion(
  current: string,
  latest: string,
  mode: UpdateMode,
  versions: string[] = [],
): string {
  const prefix = extractVersionPrefix(current);
  const currentClean = current.replace(/^[~^]/, '') || '0.0.0';

  if (mode === 'latest') return `${prefix}${latest}`;

  if (versions.length > 0) {
    let target: string | null = null;

    if (mode === 'patch') {
      target = semver.maxSatisfying(versions, `~${currentClean}`);
    } else if (mode === 'minor') {
      target = semver.maxSatisfying(versions, `^${currentClean}`);
    } else if (mode === 'major') {
      target = latest;
    }

    if (target) return `${prefix}${target}`;
  }

  const latestCoerced = semver.coerce(latest);

  if (!latestCoerced) return `${prefix}${latest}`;

  const modeMap: Record<UpdateMode, string> = {
    patch: `~${latestCoerced.major}.${latestCoerced.minor}.0`,
    minor: `^${latestCoerced.major}.${latestCoerced.minor}.0`,
    major: `^${latestCoerced.major}.0.0`,
    latest: `${prefix}${latest}`,
  };

  return modeMap[mode];
}

export function validateDependencies(pkgJson: Record<string, unknown>): void {
  const deps = {
    ...((pkgJson.dependencies as Record<string, string>) || {}),
    ...((pkgJson.devDependencies as Record<string, string>) || {}),
  };
  const invalid: string[] = [];

  for (const [name, version] of Object.entries(deps)) {
    if (
      !semver.validRange(version) &&
      !version.includes('/') &&
      !version.includes(':') &&
      version !== 'latest'
    ) {
      invalid.push(`${name}@${version}`);
    }
  }

  if (invalid.length > 0) {
    console.log(pc.yellow('⚠️ Warning: Found invalid versions (skipped):'));
    invalid.forEach((msg) => {
      console.log(pc.yellow(`  - ${msg}`));
    });
    console.log('');
  }
}

export function applyUpdates(
  pkgJson: Record<string, unknown>,
  selectedPackages: string[],
  outdatedData: OutdatedOutput,
  mode: UpdateMode,
): number {
  let updatedCount = 0;

  const deps = pkgJson.dependencies as Record<string, string> | undefined;
  const devDeps = pkgJson.devDependencies as Record<string, string> | undefined;

  for (const pkgName of selectedPackages) {
    const pkgData = outdatedData[pkgName];
    const currentInPkg = deps?.[pkgName] ?? devDeps?.[pkgName] ?? '';
    const newVersion = resolveTargetVersion(
      currentInPkg || pkgData.current,
      pkgData.latest,
      mode,
      pkgData.versions,
    );

    if (deps?.[pkgName]) {
      deps[pkgName] = newVersion;
      updatedCount++;
    } else if (devDeps?.[pkgName]) {
      devDeps[pkgName] = newVersion;
      updatedCount++;
    }
  }

  return updatedCount;
}

export function getVersionFromPkgJson(
  pkgJson: Record<string, unknown>,
  pkgName: string,
): string {
  const deps = pkgJson.dependencies as Record<string, string> | undefined;
  const devDeps = pkgJson.devDependencies as Record<string, string> | undefined;

  return deps?.[pkgName] ?? devDeps?.[pkgName] ?? '';
}
