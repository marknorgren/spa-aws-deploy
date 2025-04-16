import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getBuildInfo } from '../shared/build-info';

const { appVersion, buildDateISO, buildTimestamp, gitCommitHash, buildId } =
  getBuildInfo(__dirname);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/app-b/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDateISO),
    'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(buildTimestamp),
    'import.meta.env.VITE_GIT_COMMIT_HASH': JSON.stringify(gitCommitHash),
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
  },
});
