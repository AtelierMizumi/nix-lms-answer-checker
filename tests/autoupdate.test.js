/**
 * Unit tests for Auto-Update mechanism
 * Tests version comparison, update banner trigger, and worker version endpoint
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../worker/src/index.js';

// Extract compareSemver logic as implemented in paste-to-console.js
function compareSemver(v1, v2) {
    const parse = v => {
        const [core, pre] = String(v).split('-');
        const parts = core.split('.').map(Number);
        return { parts, isPre: Boolean(pre) };
    };

    const p1 = parse(v1);
    const p2 = parse(v2);

    for (let i = 0; i < Math.max(p1.parts.length, p2.parts.length); i++) {
        const num1 = p1.parts[i] || 0;
        const num2 = p2.parts[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    if (p1.isPre && !p2.isPre) return -1;
    if (!p1.isPre && p2.isPre) return 1;
    return 0;
}

describe('Auto-Update Mechanism', () => {
    describe('compareSemver', () => {
        it('should correctly identify newer versions', () => {
            expect(compareSemver('2.4.0', '2.3.0')).toBe(1);
            expect(compareSemver('2.3.1', '2.3.0')).toBe(1);
            expect(compareSemver('3.0.0', '2.3.0')).toBe(1);
            expect(compareSemver('10.0.0', '9.9.9')).toBe(1);
        });

        it('should correctly identify same versions', () => {
            expect(compareSemver('2.3.0', '2.3.0')).toBe(0);
            expect(compareSemver('1.0', '1.0.0')).toBe(0);
        });

        it('should correctly identify older versions', () => {
            expect(compareSemver('2.2.0', '2.3.0')).toBe(-1);
            expect(compareSemver('2.3.0', '2.4.0')).toBe(-1);
            expect(compareSemver('2.3.0-beta.1', '2.3.0')).toBe(-1);
        });
    });

    describe('Worker Version Endpoint', () => {
        it('should return valid semver and update URL on GET /version', async () => {
            const req = new Request('https://telemetry.local/version', { method: 'GET' });
            const res = await worker.fetch(req, {});
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.latestVersion).toMatch(/^\d+\.\d+\.\d+$/);
            expect(data.updateUrl).toContain('.user.js');
        });

        it('should return version information in /count and /track responses', async () => {
            const req = new Request('https://telemetry.local/count', { method: 'GET' });
            const res = await worker.fetch(req, {});
            const data = await res.json();

            expect(data).toHaveProperty('latestVersion');
            expect(data).toHaveProperty('updateUrl');
            expect(data.updateUrl).toContain('.user.js');
        });
    });

    describe('Client Update Banner Logic', () => {
        let mockSessionStorage;
        let bannerShown;
        let openedUrl;

        beforeEach(() => {
            mockSessionStorage = new Map();
            bannerShown = null;
            openedUrl = null;
        });

        function handleVersionCheck(data, currentVersion) {
            if (!data?.latestVersion) return;
            if (compareSemver(data.latestVersion, currentVersion) > 0) {
                if (mockSessionStorage.get('nix-helper-dismissed-update') === data.latestVersion) {
                    return; // Dismissed for this session
                }
                bannerShown = {
                    version: data.latestVersion,
                    url: data.updateUrl,
                    notes: data.releaseNotes || ''
                };
            }
        }

        it('should trigger update banner when latestVersion > currentVersion', () => {
            const serverData = {
                latestVersion: '2.4.0',
                updateUrl: 'https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js',
                releaseNotes: 'Fixed dropdown answer matching'
            };

            handleVersionCheck(serverData, '2.3.0');
            expect(bannerShown).not.toBeNull();
            expect(bannerShown.version).toBe('2.4.0');
        });

        it('should NOT trigger update banner when version is up to date', () => {
            const serverData = {
                latestVersion: '2.3.0',
                updateUrl: 'https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js'
            };

            handleVersionCheck(serverData, '2.3.0');
            expect(bannerShown).toBeNull();
        });

        it('should NOT trigger update banner if user dismissed the update in current session', () => {
            mockSessionStorage.set('nix-helper-dismissed-update', '2.4.0');

            const serverData = {
                latestVersion: '2.4.0',
                updateUrl: 'https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js'
            };

            handleVersionCheck(serverData, '2.3.0');
            expect(bannerShown).toBeNull();
        });
    });
});
