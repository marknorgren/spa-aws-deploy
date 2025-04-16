import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { v7 as uuidv7 } from 'uuid';

export function getBuildInfo(dirname: string) {
  // Read version from package.json relative to the calling config file
  const packageJsonPath = resolve(dirname, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const appVersion = packageJson.version;

  // Get current build date
  const buildDate = new Date();
  const buildDateISO = buildDate.toISOString();

  // Format timestamp as YYYYMMDD.HHMMSS (UTC)
  const year = buildDate.getUTCFullYear();
  const month = (buildDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = buildDate.getUTCDate().toString().padStart(2, '0');
  const hours = buildDate.getUTCHours().toString().padStart(2, '0');
  const minutes = buildDate.getUTCMinutes().toString().padStart(2, '0');
  const seconds = buildDate.getUTCSeconds().toString().padStart(2, '0');
  const buildTimestamp = `${year}${month}${day}.${hours}${minutes}${seconds}`;

  // Get Git commit hash
  let gitCommitHash = 'unknown';
  try {
    // Run git command from the workspace root for consistency
    gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    console.error('Error getting Git commit hash:', error);
  }

  // Generate UUIDv7 build ID
  const buildId = uuidv7();

  return {
    appVersion,
    buildDateISO,
    buildTimestamp,
    gitCommitHash,
    buildId,
  };
}

// // Print build info if run directly
// if (require.main === module) {
//   // Use current working directory as dirname
//   console.log(getBuildInfo(process.cwd()));
// }
