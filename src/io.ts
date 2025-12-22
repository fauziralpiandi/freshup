import { spawn } from 'child_process';
import * as fs from 'fs';
import { createSpinner } from 'nanospinner';
import * as path from 'path';

import { PackageManager } from './types';

export function readPackageJson(
  packageJsonPath: string,
): Record<string, unknown> {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    return JSON.parse(content) as Record<string, unknown>;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to read package.json: ${message}`);
  }
}

export function writePackageJson(
  packageJsonPath: string,
  content: Record<string, unknown>,
): void {
  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(content, null, 2) + '\n');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to write package.json: ${message}`);
  }
}

export function detectPackageManager(): PackageManager {
  const lockFileMap: [string, string, string[]][] = [
    ['yarn.lock', 'yarn', []],
    ['pnpm-lock.yaml', 'pnpm', ['install']],
    ['bun.lockb', 'bun', ['install']],
    ['bun.lock', 'bun', ['install']],
  ];

  for (const [file, cmd, args] of lockFileMap) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      return { cmd, args, lockFile: file };
    }
  }

  return { cmd: 'npm', args: ['install'], lockFile: 'package-lock.json' };
}

export async function runInstall(pm: PackageManager): Promise<void> {
  const spinner = createSpinner(`${pm.cmd} install...`).start();

  return new Promise((resolve, reject) => {
    const child = spawn(pm.cmd, pm.args, { stdio: 'ignore', shell: true });

    child.on('close', (code) => {
      if (code === 0) {
        spinner.success({ text: 'Installed.' });
        resolve();
      } else {
        spinner.error({ text: 'Install failed.' });
        reject(new Error(`${pm.cmd} exit ${String(code)}`));
      }
    });
    child.on('error', (err) => {
      spinner.error({ text: 'Install failed.' });
      reject(err);
    });
  });
}
