import { exec } from 'child_process';
import { createSpinner } from 'nanospinner';
import semver from 'semver';
import { promisify } from 'util';

import { OutdatedOutput } from './types';

const execAsync = promisify(exec);

interface NpmViewOutput {
  version: string;
  versions: string[];
}

export async function fetchOutdatedPackages(
  pkgJson: Record<string, unknown>,
): Promise<OutdatedOutput> {
  const spinner = createSpinner('Checking registry...').start();
  const deps = {
    ...((pkgJson.dependencies as Record<string, string>) || {}),
    ...((pkgJson.devDependencies as Record<string, string>) || {}),
  };
  const validPkgs = Object.entries(deps).filter(([, version]) => {
    return (
      semver.validRange(version) &&
      !version.includes('/') &&
      !version.includes(':')
    );
  });
  const outdated: OutdatedOutput = {};

  await Promise.all(
    validPkgs.map(async ([pkg, versionRange]) => {
      try {
        const { stdout } = await execAsync(
          `npm view ${pkg} version versions --json`,
        );
        const data = JSON.parse(stdout.trim()) as
          | string
          | string[]
          | NpmViewOutput;

        let latest: string;
        let versions: string[];

        if (typeof data === 'string') {
          latest = data;
          versions = [data];
        } else if (Array.isArray(data)) {
          latest = data[data.length - 1];
          versions = data;
        } else {
          latest = data.version;
          versions = data.versions;
        }

        const current = semver.minVersion(versionRange)?.version ?? '0.0.0';

        if (latest && semver.gt(latest, current)) {
          outdated[pkg] = {
            current,
            wanted: latest,
            latest,
            dependent: 'workspace',
            location: 'node_modules',
            versions,
          };
        }
      } catch {
        // Ignore errors from registry checks (e.g., private packages or network issues)
      }
    }),
  );

  spinner.success({ text: 'Checked!' });

  return outdated;
}
