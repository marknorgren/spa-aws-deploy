import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getBuildInfo } from '../shared/build-info'; // Corrected import path

// Get build info using the shared function
const { appVersion, buildDateISO, buildTimestamp, gitCommitHash, buildId } =
  getBuildInfo(__dirname);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/app-a/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDateISO), // Keep ISO for potential machine reading
    'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(buildTimestamp), // Add Timver format
    'import.meta.env.VITE_GIT_COMMIT_HASH': JSON.stringify(gitCommitHash),
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
  },
});
