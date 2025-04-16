// Extend Window interface for APP_INFO
declare global {
  interface Window {
    APP_INFO: {
      version: string;
      buildTimestamp: string;
      gitCommitHash: string;
      buildId: string;
    };
  }
}
// Inject build info into window.APP_INFO
window.APP_INFO = {
  version: import.meta.env.VITE_APP_VERSION,
  buildTimestamp: import.meta.env.VITE_BUILD_TIMESTAMP,
  gitCommitHash: import.meta.env.VITE_GIT_COMMIT_HASH,
  buildId: import.meta.env.VITE_BUILD_ID,
};
