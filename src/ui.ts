import pc from 'picocolors';
import prompts from 'prompts';
import semver from 'semver';

import { getVersionFromPkgJson, resolveTargetVersion } from './core';
import { OutdatedOutput, UpdateMode } from './types';

export function getModeDescription(mode: UpdateMode): string {
  const descriptions: Record<UpdateMode, string> = {
    latest: 'latest',
    major: 'major (breaking)',
    minor: 'minor (feature)',
    patch: 'patch (fix)',
  };

  return descriptions[mode];
}

export function getColorByDiff(
  from: string,
  to: string,
): (str: string) => string {
  const f = semver.coerce(from);
  const t = semver.coerce(to);

  if (!f || !t) return pc.green;
  if (f.major !== t.major) return pc.red;
  if (f.minor !== t.minor) return pc.cyan;

  return pc.green;
}

export async function selectPackages(
  packages: string[],
  outdatedData: OutdatedOutput,
  mode: UpdateMode,
  pkgJson: Record<string, unknown>,
): Promise<string[]> {
  const maxNameLength = Math.max(...packages.map((p) => p.length));
  const createChoice = (pkg: string) => {
    const details = outdatedData[pkg];
    const currentInPkg = getVersionFromPkgJson(pkgJson, pkg);
    const targetVersion = resolveTargetVersion(
      currentInPkg || details.current,
      details.latest,
      mode,
    );
    const displayTarget = targetVersion.replace(/^[~^]/, '');
    const color = getColorByDiff(details.current, displayTarget);

    return {
      title: `${pkg.padEnd(maxNameLength)}  ${pc.gray(details.current)} ${pc.dim('→')} ${color(displayTarget)}`,
      value: pkg,
      selected: true,
    };
  };
  const deps = Object.keys(
    (pkgJson.dependencies as Record<string, unknown>) || {},
  ).filter((p) => packages.includes(p));
  const devDeps = Object.keys(
    (pkgJson.devDependencies as Record<string, unknown>) || {},
  ).filter((p) => packages.includes(p));
  const choices: prompts.Choice[] = [];

  if (deps.length > 0) {
    choices.push({ title: pc.blue(`\n  dependencies`), disabled: true });
    choices.push(...deps.map(createChoice));
  }

  if (devDeps.length > 0) {
    choices.push({ title: pc.blue(`\n  devDependencies`), disabled: true });
    choices.push(...devDeps.map(createChoice));
  }

  const response = await prompts({
    type: 'multiselect',
    name: 'packages',
    message: `Update ${pc.dim(`(${getModeDescription(mode)})`)}`,
    choices,
    hint: '- Space to toggle, Enter to confirm',
    instructions: false,
  });

  return (response.packages as string[] | undefined) ?? [];
}
