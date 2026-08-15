import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Helper to recursively collect source files
function getSourceFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'tests', 'coverage'].includes(entry.name)) continue;
      getSourceFiles(fullPath, fileList);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Security (SAST): Static Application Security Testing', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const sourceFiles = [
    ...getSourceFiles(path.join(rootDir, 'app')),
    ...getSourceFiles(path.join(rootDir, 'lib')),
    ...getSourceFiles(path.join(rootDir, 'components')),
  ];

  describe('Secret & Credential Leakage Scanner', () => {
    // Regex for actual hardcoded live secret patterns (excluding env lookups or dummy samples)
    const SECRET_PATTERNS = [
      { name: 'Live OpenAI Secret Key', regex: /sk-[a-zA-Z0-9]{32,}/ },
      { name: 'Live Resend API Key', regex: /re_[a-zA-Z0-9]{24,}/ },
      { name: 'Live Stripe Secret Key', regex: /sk_live_[a-zA-Z0-9]{24,}/ },
      { name: 'Hardcoded Private Key Header', regex: /-----BEGIN PRIVATE KEY-----/ },
    ];

    it('scans all app, lib, and component files for hardcoded production secrets', () => {
      const violations: { file: string; secretType: string; line: number }[] = [];

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          // Ignore commented examples or process.env fallbacks
          if (line.includes('process.env') || line.includes('example') || line.includes('mock-')) return;

          for (const pattern of SECRET_PATTERNS) {
            if (pattern.regex.test(line)) {
              violations.push({
                file: path.relative(rootDir, file),
                secretType: pattern.name,
                line: idx + 1,
              });
            }
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Dangerous Sinks & Insecure Execution Functions', () => {
    it('detects and disallows dangerous eval() or Function constructor in app & lib code', () => {
      const dangerousSinks = [
        { name: 'eval() sink', regex: /\beval\s*\(/ },
        { name: 'new Function() sink', regex: /new\s+Function\s*\(/ },
        { name: 'document.write() sink', regex: /document\.write\s*\(/ },
      ];

      const sinkViolations: { file: string; sink: string }[] = [];

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        for (const sink of dangerousSinks) {
          if (sink.regex.test(content)) {
            sinkViolations.push({
              file: path.relative(rootDir, file),
              sink: sink.name,
            });
          }
        }
      }

      expect(sinkViolations).toEqual([]);
    });
  });
});
