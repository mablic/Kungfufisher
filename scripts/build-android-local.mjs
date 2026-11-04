import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const android = path.join(root, 'android');
for (const file of ['gradlew', 'keystore.properties']) {
  if (!existsSync(path.join(android, file))) {
    console.error(`Missing android/${file}. Restore the native project and existing upload-key configuration before building.`);
    process.exit(1);
  }
}
const env = { ...process.env, NODE_ENV: 'production', EXPO_PUBLIC_ADMOB_TEST_ADS: 'false' };
if (process.platform === 'darwin') {
  const java = spawnSync('/usr/libexec/java_home', ['-v', '17'], { encoding: 'utf8' });
  if (java.status !== 0) {
    console.error('Install JDK 17 before building Android locally.');
    process.exit(1);
  }
  env.JAVA_HOME = java.stdout.trim();
}
console.log('Building a locally signed production AAB. Version comes from android/app/build.gradle; it is not auto-incremented.');
const result = spawnSync('./gradlew', [':app:bundleRelease', '--max-workers=2', '-Dorg.gradle.parallel=false', ...(env.JAVA_HOME ? [`-Dorg.gradle.java.home=${env.JAVA_HOME}`] : [])], { cwd: android, env, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`AAB: ${path.join(android, 'app/build/outputs/bundle/release/app-release.aab')}`);
