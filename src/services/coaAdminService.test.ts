import { describe, expect, it } from 'vitest';
import { formatCoaFileSize, validateCoaFile } from './coaAdminService';

describe('COA file validation', () => {
  it('accepts supported PDF and image documents', () => {
    expect(validateCoaFile(new File(['pdf'], 'report.pdf', { type: 'application/pdf' }))).toBeNull();
    expect(validateCoaFile(new File(['png'], 'report.png', { type: 'image/png' }))).toBeNull();
  });

  it('rejects unsupported formats', () => {
    expect(validateCoaFile(new File(['text'], 'report.txt', { type: 'text/plain' }))).toMatch(/PDF/);
  });

  it('formats file sizes for the admin interface', () => {
    expect(formatCoaFileSize(2048)).toBe('2 KB');
    expect(formatCoaFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});
