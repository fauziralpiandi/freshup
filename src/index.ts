#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import pc from 'picocolors';

import packageJson from '../package.json';
import { fetchOutdatedPackages } from './api';
import {
  applyUpdates,
  getVersionFromPkgJson,
  resolveTargetVersion,
  validateDependencies,
} from './core';
import {
  detectPackageManager,
  readPackageJson,
  runInstall,
  writePackageJson,
} from './io';
import { CLIOptions, UpdateMode } from './types';
import { getColorByDiff, selectPackages } from './ui';

function parseArgs(): CLIOptions {
  const modeArg = process.argv.find((arg) =>
    ['patch', 'minor', 'major', 'latest'].includes(arg),
  );

  return {
    mode: (modeArg as UpdateMode | undefined) ?? 'latest',
    dryRun: process.argv.includes('--dry-run') || process.argv.includes('-d'),
    skipPrompt: process.argv.includes('--write') || process.argv.includes('-w'),
    autoInstall:
      process.argv.includes('--install') || process.argv.includes('-i'),
  };
}

export async function main(): Promise<void> {
  const options = parseArgs();
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error(pc.red('No package.json found.'));
    process.exit(1);
  }

  const pkgJson = readPackageJson(packageJsonPath);
  const cliVersion = packageJson.version;

  console.log(
    pc.cyan(`
🌱 Freshup ${pc.dim(`v${cliVersion}`)}`),
  );

  validateDependencies(pkgJson);

  const outdatedData = await fetchOutdatedPackages(pkgJson);
  const packages = Object.keys(outdatedData);

  if (packages.length === 0) {
    console.log(pc.green('✨ Your dependencies are already fresh!'));

    return;
  }

  let selectedPackages = packages;

  if (!options.skipPrompt) {
    selectedPackages = await selectPackages(
      packages,
      outdatedData,
      options.mode,
      pkgJson,
    );

    if (selectedPackages.length === 0) return;
  } else {
    console.log(
      pc.cyan(`
Updating ${packages.length} packages:`),
    );

    const maxNameLength = Math.max(...packages.map((p) => p.length));

    for (const pkg of packages) {
      const details = outdatedData[pkg];
      const currentInPkg = getVersionFromPkgJson(pkgJson, pkg);
      const targetVersion = resolveTargetVersion(
        currentInPkg || details.current,
        details.latest,
        options.mode,
        details.versions,
      );
      const displayTarget = targetVersion.replace(/^[~^]/, '');
      const color = getColorByDiff(details.current, displayTarget);

      console.log(
        `  ${pc.bold(pkg.padEnd(maxNameLength))}  ${pc.gray(details.current)} ${pc.dim('→')} ${color(displayTarget)}`,
      );
    }
  }

  const latestPkgJson = readPackageJson(packageJsonPath);
  const updatedCount = applyUpdates(
    latestPkgJson,
    selectedPackages,
    outdatedData,
    options.mode,
  );

  if (options.dryRun) {
    console.log(
      pc.yellow(`
📋 Dry run: ${updatedCount} packages would be updated.`),
    );

    return;
  }

  writePackageJson(packageJsonPath, latestPkgJson);

  console.log(
    pc.green(`
✅ Successfully freshened ${pc.bold(String(updatedCount))} packages.`),
  );

  const pm = detectPackageManager();

  if (options.autoInstall) {
    try {
      await runInstall(pm);
    } catch {
      process.exit(1);
    }
  } else {
    console.log(
      pc.dim(`  Run 
${pm.cmd} install
 to finish.
`),
    );
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(pc.red(`Error: ${message}`));
    process.exit(1);
  });
}
