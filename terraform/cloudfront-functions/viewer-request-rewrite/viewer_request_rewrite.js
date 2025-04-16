// terraform/cloudfront-functions/viewer-request-rewrite/viewer_request_rewrite.js
function handler(event) {
  const request = event.request;
  const uri = request.uri;

  // Log the initial request details as JSON
  console.log(
    JSON.stringify({
      type: 'RequestReceived',
      originalUri: uri,
    }),
  );

  // Check if the URI contains a file extension in the last segment
  const hasFileExtension = /\.[^./]+$/.test(uri.split('/').pop());

  // Check if the URI is for the root or a known app prefix directory/subpath
  const isRoot = uri === '/';
  const knownAppMatch = uri.match(/^(\/app-[a-c])(?:\/|$)/); // Matches /app-a, /app-a/, /app-b/subpath etc.

  let rewrittenUri = uri; // Default to original URI

  if (!hasFileExtension) {
    if (isRoot) {
      // Request for the root, rewrite to /index.html
      rewrittenUri = '/index.html';
      console.log(
        JSON.stringify({
          type: 'RewriteSPARoot',
          originalUri: uri,
          rewrittenUri: rewrittenUri,
        }),
      );
    } else if (knownAppMatch) {
      // Request for a known sub-app, rewrite to /app-prefix/index.html
      const rewritePrefix = knownAppMatch[1] + '/'; // Ensure trailing slash, e.g., /app-a/
      rewrittenUri = rewritePrefix + 'index.html';
      console.log(
        JSON.stringify({
          type: 'RewriteSPASubApp',
          originalUri: uri,
          rewrittenUri: rewrittenUri,
        }),
      );
    } else {
      // Request for an unknown path (not root, not known app, no extension)
      // Rewrite to the root app's index.html
      rewrittenUri = '/index.html';
      console.log(
        JSON.stringify({
          type: 'RewriteUnknownToRoot',
          originalUri: uri,
          rewrittenUri: rewrittenUri,
        }),
      );
    }
    request.uri = rewrittenUri;
  } else {
    // Log that no rewrite was needed as JSON
    console.log(
      JSON.stringify({
        type: 'NoRewriteNeeded',
        originalUri: uri,
        reason: 'HasFileExtension',
      }),
    );
  }

  return request;
}

// Conditionally export for testing environments like Node.js/Vitest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handler };
}
