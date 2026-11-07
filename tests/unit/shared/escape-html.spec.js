import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../../src/shared/domain/escape-html';

describe('Printable customer content', () => {
    it('prints user text without injecting executable markup into the report', () => {
        const output = escapeHtml('<img src=x onerror="alert(1)"> & taller');
        expect(output).not.toContain('<img');
        expect(output).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; taller');
    });
    it('supports missing and numeric data', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(2026)).toBe('2026');
    });
});
