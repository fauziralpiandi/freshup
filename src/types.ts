export type UpdateMode = 'patch' | 'minor' | 'major' | 'latest';

export interface OutdatedPackage {
  current: string;
  wanted: string;
  latest: string;
  dependent: string;
  location: string;
  versions?: string[];
}

export type OutdatedOutput = Record<string, OutdatedPackage>;

export interface CLIOptions {
  mode: UpdateMode;
  dryRun: boolean;
  skipPrompt: boolean;
  autoInstall: boolean;
}

export interface PackageManager {
  cmd: string;
  args: string[];
  lockFile: string;
}
