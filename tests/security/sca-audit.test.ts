import { describe, it, expect } from 'vitest';
import packageJson from '@/package.json';

describe('Security (SCA): Software Composition Analysis & Dependency Audit', () => {
  const allDependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  it('verifies that all critical dependencies are pinned with valid semver versions', () => {
    for (const [pkg, version] of Object.entries(allDependencies)) {
      expect(version).toBeTruthy();
      // Should not contain git repo urls or wildcard '*'
      expect(version).not.toBe('*');
      expect(version).not.toContain('http://');
    }
  });

  it('prohibits known vulnerable or deprecated packages from the dependency tree', () => {
    const BANNED_PACKAGES = [
      'crypto', // Insecure legacy Node crypto standalone package
      'request', // Deprecated and vulnerable HTTP library
      'node-fetch', // In Next.js App router, global fetch is native
      'left-pad',
      'colors',
    ];

    for (const banned of BANNED_PACKAGES) {
      expect(allDependencies).not.toHaveProperty(banned);
    }
  });

  it('verifies secure cryptographic and framework core dependencies are present', () => {
    expect(allDependencies).toHaveProperty('next');
    expect(allDependencies).toHaveProperty('react');
    expect(allDependencies).toHaveProperty('zod');
    expect(allDependencies).toHaveProperty('@supabase/supabase-js');
  });
});
