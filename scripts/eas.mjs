import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// This app lives in a larger Git repository. Upload only this app's directory,
// and read its .easignore rather than collecting unrelated sibling projects.
const projectRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const result = spawnSync('eas', process.argv.slice(2), {
  cwd: projectRoot,
  env: { ...process.env, EAS_NO_VCS: '1', EAS_PROJECT_ROOT: projectRoot },
  stdio: 'inherit',
});
if (result.error) {
  console.error(result.error.code === 'ENOENT'
    ? 'EAS CLI not found. Install it with: npm install --global eas-cli'
    : result.error.message);
}
process.exit(result.status ?? 1);
