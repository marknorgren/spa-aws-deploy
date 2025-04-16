import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBuildInfo } from './build-info';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as uuid from 'uuid';
import { resolve } from 'path';

// Mock the dependencies
vi.mock('fs');
vi.mock('child_process');
vi.mock('uuid');

describe('getBuildInfo', () => {
  const mockDirname = '/fake/app/dir';
  const mockPackageJsonPath = resolve(mockDirname, 'package.json');
  const mockPackageJsonContent = JSON.stringify({ version: '1.2.3' });
  const mockGitHash = 'abcdef0';
  const mockUuid = 'mock-uuid-v7';
  const mockDate = new Date(2025, 3, 15, 10, 30, 0); // April 15, 2025 10:30:00
  const mockTimestamp = '20250415.103000';
  const mockIsoDate = mockDate.toISOString();

  beforeEach(() => {
    // Reset mocks before each test
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockPackageJsonContent);
    vi.spyOn(child_process, 'execSync').mockReturnValue(
      Buffer.from(mockGitHash),
    );
    vi.spyOn(uuid, 'v7').mockImplementation(
      () => mockUuid as unknown as Uint8Array,
    );
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return build information object', () => {
    const buildInfo = getBuildInfo(mockDirname);

    expect(fs.readFileSync).toHaveBeenCalledWith(mockPackageJsonPath, 'utf-8');
    expect(child_process.execSync).toHaveBeenCalledWith(
      'git rev-parse --short HEAD',
    );
    expect(uuid.v7).toHaveBeenCalled();

    expect(buildInfo).toEqual({
      appVersion: '1.2.3',
      buildDateISO: mockIsoDate,
      buildTimestamp: mockTimestamp,
      gitCommitHash: mockGitHash,
      buildId: mockUuid,
    });
  });

  it('should handle error when getting git commit hash', () => {
    vi.spyOn(child_process, 'execSync').mockImplementation(() => {
      throw new Error('git command failed');
    });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const buildInfo = getBuildInfo(mockDirname);

    expect(buildInfo.gitCommitHash).toBe('unknown');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error getting Git commit hash:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});
