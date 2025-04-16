import { describe, it, expect } from 'vitest';
import { handler } from './viewer_request_rewrite.js'; // Adjust path if needed

describe('CloudFront Viewer Request Rewrite Handler', () => {
  const createEvent = (uri, querystring = {}) => ({
    request: {
      uri: uri,
      querystring: querystring,
      // Add other request properties if your function uses them
    },
    // Add other event properties if needed
  });

  it('should rewrite /app-a to /app-a/index.html', () => {
    const event = createEvent('/app-a');
    const result = handler(event);
    expect(result.uri).toBe('/app-a/index.html');
  });

  it('should rewrite /app-a/ to /app-a/index.html', () => {
    const event = createEvent('/app-a/');
    const result = handler(event);
    expect(result.uri).toBe('/app-a/index.html');
  });

  it('should rewrite /app-b to /app-b/index.html', () => {
    const event = createEvent('/app-b');
    const result = handler(event);
    expect(result.uri).toBe('/app-b/index.html');
  });

  it('should rewrite /app-b/ to /app-b/index.html', () => {
    const event = createEvent('/app-b/');
    const result = handler(event);
    expect(result.uri).toBe('/app-b/index.html');
  });

  it('should rewrite /app-a/some/path to /app-a/index.html', () => {
    const event = createEvent('/app-a/some/path');
    const result = handler(event);
    expect(result.uri).toBe('/app-a/index.html'); // Corrected expectation
  });

  it('should rewrite /app-a/some/path/ to /app-a/index.html', () => {
    const event = createEvent('/app-a/some/path/');
    const result = handler(event);
    expect(result.uri).toBe('/app-a/index.html'); // Corrected expectation
  });

  it('should not rewrite /app-a/asset.css', () => {
    const event = createEvent('/app-a/asset.css');
    const result = handler(event);
    expect(result.uri).toBe('/app-a/asset.css');
  });

  it('should not rewrite /app-b/image.jpg', () => {
    const event = createEvent('/app-b/image.jpg');
    const result = handler(event);
    expect(result.uri).toBe('/app-b/image.jpg');
  });

  it('should not rewrite /app-a/index.html', () => {
    const event = createEvent('/app-a/index.html');
    const result = handler(event);
    expect(result.uri).toBe('/app-a/index.html');
  });

  it('should rewrite / to /index.html', () => {
    const event = createEvent('/');
    const result = handler(event);
    expect(result.uri).toBe('/index.html');
  });

  it('should rewrite path but preserve query parameters', () => {
    const event = createEvent('/app-a/some/page', {
      param1: { value: 'value1' },
      param2: { value: 'value2' },
    });
    const result = handler(event);
    expect(result.uri).toBe('/app-a/index.html'); // Corrected expectation
    // Verify querystring object is untouched (CloudFront handles appending it)
    expect(result.querystring).toEqual({
      param1: { value: 'value1' },
      param2: { value: 'value2' },
    });
  });

  it('should not rewrite file path but preserve query parameters', () => {
    const event = createEvent('/app-a/image.png', {
      search: { value: 'test' },
    });
    const result = handler(event);
    expect(result.uri).toBe('/app-a/image.png');
    expect(result.querystring).toEqual({ search: { value: 'test' } });
  });

  it('should rewrite unknown path /test to /index.html', () => {
    const event = createEvent('/test');
    const result = handler(event);
    expect(result.uri).toBe('/index.html');
  });

  it('should rewrite unknown path /some/other/path to /index.html', () => {
    const event = createEvent('/some/other/path');
    const result = handler(event);
    expect(result.uri).toBe('/index.html');
  });

  // Add more tests for edge cases if necessary
});
