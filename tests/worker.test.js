/**
 * Unit tests for Cloudflare Worker Telemetry & Counter API
 */
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../worker/src/index.js';

describe('Cloudflare Worker Telemetry API', () => {
    let mockEnv;

    beforeEach(() => {
        mockEnv = {
            SALT: 'test-salt'
        };
    });

    it('should return operational status on GET /health', async () => {
        const req = new Request('https://telemetry.local/health', { method: 'GET' });
        const res = await worker.fetch(req, mockEnv);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.status).toBe('operational');
        expect(data.service).toContain('NIX LMS Helper');
    });

    it('should handle CORS preflight OPTIONS request', async () => {
        const req = new Request('https://telemetry.local/count', {
            method: 'OPTIONS',
            headers: {
                Origin: 'https://digital.nix.edu.vn',
                'Access-Control-Request-Method': 'POST'
            }
        });
        const res = await worker.fetch(req, mockEnv);
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://digital.nix.edu.vn');
        expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should return initial count on GET /count', async () => {
        const req = new Request('https://telemetry.local/count', { method: 'GET' });
        const res = await worker.fetch(req, mockEnv);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(typeof data.count).toBe('number');
        expect(data.count).toBeGreaterThanOrEqual(403);
    });

    it('should increment counter on valid POST /track', async () => {
        const initialReq = new Request('https://telemetry.local/count', { method: 'GET' });
        const initialRes = await worker.fetch(initialReq, mockEnv);
        const { count: initialCount } = await initialRes.json();

        const trackReq = new Request('https://telemetry.local/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CF-Connecting-IP': '192.168.1.100'
            },
            body: JSON.stringify({
                event: 'autofill',
                questions: 15,
                version: '2.3.0',
                timestamp: Date.now()
            })
        });

        const trackRes = await worker.fetch(trackReq, mockEnv);
        expect(trackRes.status).toBe(200);
        const trackData = await trackRes.json();
        expect(trackData.success).toBe(true);
        expect(trackData.count).toBe(initialCount + 1);
    });

    it('should reject invalid JSON on POST /track', async () => {
        const req = new Request('https://telemetry.local/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'not-valid-json'
        });
        const res = await worker.fetch(req, mockEnv);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
    });

    it('should reject expired or skewed timestamp on POST /track', async () => {
        const req = new Request('https://telemetry.local/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'autofill',
                timestamp: Date.now() - 30 * 60 * 1000 // 30 mins in past
            })
        });
        const res = await worker.fetch(req, mockEnv);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('Timestamp expired');
    });

    it('should rate limit excessive requests from same IP', async () => {
        const ip = '10.0.0.99';
        const makeTrackReq = () =>
            new Request('https://telemetry.local/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'CF-Connecting-IP': ip
                },
                body: JSON.stringify({
                    event: 'autofill',
                    questions: 5,
                    timestamp: Date.now()
                })
            });

        // 1st request: allowed
        const res1 = await worker.fetch(makeTrackReq(), mockEnv);
        expect(res1.status).toBe(200);

        // 2nd request: allowed (burst = 2)
        const res2 = await worker.fetch(makeTrackReq(), mockEnv);
        expect(res2.status).toBe(200);

        // 3rd request within window: rate limited (429)
        const res3 = await worker.fetch(makeTrackReq(), mockEnv);
        expect(res3.status).toBe(429);
        const data3 = await res3.json();
        expect(data3.success).toBe(false);
        expect(data3.error).toContain('Rate limit exceeded');
    });

    it('should return aggregated stats on GET /stats including geo, OS, and browser', async () => {
        const trackReq = new Request('https://telemetry.local/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CF-Connecting-IP': '10.0.0.123',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) coc_coc_browser/120.0 Chrome/120.0'
            },
            body: JSON.stringify({
                event: 'autofill',
                questions: 8,
                timestamp: Date.now()
            })
        });
        await worker.fetch(trackReq, mockEnv);

        const req = new Request('https://telemetry.local/stats', { method: 'GET' });
        const res = await worker.fetch(req, mockEnv);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toHaveProperty('totalUsage');
        expect(data).toHaveProperty('todayUsage');
        expect(data).toHaveProperty('totalQuestions');
        expect(data).toHaveProperty('activeUsers24h');
        expect(data).toHaveProperty('topCountries');
        expect(data).toHaveProperty('topCities');
        expect(data).toHaveProperty('osStats');
        expect(data).toHaveProperty('browserStats');
        expect(data).toHaveProperty('dailyStats');
        expect(data).toHaveProperty('peakHours');
        expect(Array.isArray(data.osStats)).toBe(true);
        expect(Array.isArray(data.browserStats)).toBe(true);
    });

    it('should render HTML dashboard on GET /dashboard', async () => {
        const req = new Request('https://telemetry.local/dashboard', { method: 'GET' });
        const res = await worker.fetch(req, mockEnv);
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('text/html');

        const html = await res.text();
        expect(html).toContain('NIX Helper Analytics');
        expect(html).toContain('Tổng Lượt Sử Dụng');
    });

    it('should protect dashboard if DASHBOARD_SECRET is configured', async () => {
        const protectedEnv = {
            ...mockEnv,
            DASHBOARD_SECRET: 'secret-admin-token'
        };

        // Without key: 401
        const unauthReq = new Request('https://telemetry.local/dashboard', { method: 'GET' });
        const unauthRes = await worker.fetch(unauthReq, protectedEnv);
        expect(unauthRes.status).toBe(401);

        // With valid key: 200
        const authReq = new Request('https://telemetry.local/dashboard?key=secret-admin-token', { method: 'GET' });
        const authRes = await worker.fetch(authReq, protectedEnv);
        expect(authRes.status).toBe(200);
    });

    it('should return release info on GET /version', async () => {
        const req = new Request('https://telemetry.local/version', { method: 'GET' });
        const res = await worker.fetch(req, mockEnv);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('latestVersion');
        expect(data).toHaveProperty('updateUrl');
        expect(data).toHaveProperty('releaseNotes');
    });
});
