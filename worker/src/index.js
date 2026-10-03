/**
 * NIX Helper Telemetry & Global Usage Counter - Cloudflare Worker
 *
 * Provides:
 * 1. Global synchronized counter for the userscript UI
 * 2. Rate-limited, privacy-first telemetry (IPs are salted and hashed, no PII stored)
 * 3. Atomic D1 SQLite backend with KV/In-Memory fallback
 * 4. Realtime analytics dashboard
 */

import { renderDashboard } from './dashboard.js';

// In-memory fallback if D1 or KV are not yet bound (e.g. testing)
const MEMORY_STORE = {
    counter: 0,
    events: [],
    rateLimits: new Map()
};

const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10 seconds per increment
const MAX_REQUESTS_PER_WINDOW = 2; // Allow small burst (e.g. retry), then throttle
const BASELINE_COUNT = 0; // Baseline counter offset
const DEFAULT_LATEST_VERSION = '2.3.0';
const DEFAULT_UPDATE_URL =
    'https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js';

/**
 * Generates an anonymous salted hash of the client's IP to preserve privacy.
 * Raw IP addresses are NEVER stored in the database.
 */
async function hashIp(clientIp, salt = 'nix-telemetry-salt-2026') {
    if (!clientIp) return 'anonymous';
    const enc = new TextEncoder();
    const data = enc.encode(`${salt}:${clientIp}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 24);
}

/**
 * Parse client User-Agent into standardized OS and Browser families
 */
function parseUserAgent(ua = '') {
    const s = ua.toLowerCase();

    // 1. Detect Operating System
    let os = 'Other';
    if (
        s.includes('windows nt 10') ||
        s.includes('windows nt 11') ||
        s.includes('windows 10') ||
        s.includes('windows 11')
    ) {
        os = 'Windows 10/11';
    } else if (s.includes('windows nt 6.3') || s.includes('windows nt 6.2') || s.includes('windows nt 6.1')) {
        os = 'Windows 7/8';
    } else if (s.includes('windows')) {
        os = 'Windows';
    } else if (s.includes('android')) {
        os = 'Android';
    } else if (s.includes('iphone') || s.includes('ipad') || s.includes('ipod')) {
        os = 'iOS';
    } else if (s.includes('macintosh') || s.includes('mac os x')) {
        os = 'macOS';
    } else if (s.includes('cros')) {
        os = 'ChromeOS';
    } else if (s.includes('linux')) {
        os = 'Linux';
    }

    // 2. Detect Browser Family (Order is important because Chromium UAs contain multiple tokens)
    let browser = 'Other';
    if (s.includes('coc_coc_browser') || s.includes('coc_coc')) {
        browser = 'Cốc Cốc';
    } else if (s.includes('edg/') || s.includes('edge/')) {
        browser = 'Edge';
    } else if (s.includes('opr/') || s.includes('opera')) {
        browser = 'Opera';
    } else if (s.includes('firefox') || s.includes('fxios')) {
        browser = 'Firefox';
    } else if (s.includes('chrome') || s.includes('crios')) {
        browser = 'Chrome';
    } else if (s.includes('safari') && !s.includes('chrome')) {
        browser = 'Safari';
    }

    return { os, browser };
}

/**
 * Standard CORS headers
 */
function getCorsHeaders(request, _env) {
    const origin = request.headers.get('Origin') || '*';
    const allowedOrigins = ['https://digital.nix.edu.vn', 'http://localhost:3000', 'http://127.0.0.1:5500'];

    const isAllowed = allowedOrigins.includes(origin) || origin === 'null' || !origin;
    const allowOrigin = isAllowed && origin !== 'null' ? origin : '*';

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Version, X-Dashboard-Key',
        'Access-Control-Max-Age': '86400',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
}

/**
 * Response helper with standard headers
 */
function jsonResponse(data, status = 200, corsHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders
        }
    });
}

/**
 * Check and enforce rate limiting using IP Hash
 */
async function checkRateLimit(ipHash, env) {
    const now = Date.now();

    if (env.DB) {
        try {
            const row = await env.DB.prepare(
                'SELECT last_request_time, window_count FROM rate_limits WHERE ip_hash = ?'
            )
                .bind(ipHash)
                .first();

            if (row) {
                const elapsed = now - row.last_request_time;
                if (elapsed < RATE_LIMIT_WINDOW_MS) {
                    if (row.window_count >= MAX_REQUESTS_PER_WINDOW) {
                        return false; // Throttled
                    }
                    await env.DB.prepare('UPDATE rate_limits SET window_count = window_count + 1 WHERE ip_hash = ?')
                        .bind(ipHash)
                        .run();
                } else {
                    await env.DB.prepare(
                        'UPDATE rate_limits SET last_request_time = ?, window_count = 1 WHERE ip_hash = ?'
                    )
                        .bind(now, ipHash)
                        .run();
                }
            } else {
                await env.DB.prepare(
                    `
                    INSERT INTO rate_limits (ip_hash, last_request_time, window_count) 
                    VALUES (?, ?, 1)
                    ON CONFLICT(ip_hash) DO UPDATE SET 
                        last_request_time = excluded.last_request_time,
                        window_count = 1
                `
                )
                    .bind(ipHash, now)
                    .run();
            }
            return true;
        } catch (e) {
            console.warn('[RateLimit] D1 error, falling back to memory:', e);
        }
    }

    // In-memory fallback
    const record = MEMORY_STORE.rateLimits.get(ipHash);
    if (record) {
        const elapsed = now - record.lastTime;
        if (elapsed < RATE_LIMIT_WINDOW_MS) {
            if (record.count >= MAX_REQUESTS_PER_WINDOW) return false;
            record.count += 1;
        } else {
            record.lastTime = now;
            record.count = 1;
        }
    } else {
        MEMORY_STORE.rateLimits.set(ipHash, { lastTime: now, count: 1 });
    }
    return true;
}

/**
 * Retrieve current global counter
 */
async function getGlobalCount(env) {
    if (env.DB) {
        try {
            const row = await env.DB.prepare('SELECT value FROM counters WHERE name = ?').bind('autofill').first();
            if (row && typeof row.value === 'number') {
                return Math.max(BASELINE_COUNT, row.value);
            }
        } catch (e) {
            console.warn('[GetCount] D1 error, falling back to KV/memory:', e);
        }
    }

    if (env.KV) {
        const kvVal = await env.KV.get('autofill_count');
        if (kvVal) return Math.max(BASELINE_COUNT, Number.parseInt(kvVal, 10));
    }

    return Math.max(BASELINE_COUNT, MEMORY_STORE.counter);
}

/**
 * Increment global counter and log anonymous telemetry event
 */
async function recordUsageEvent(env, payload, metadata) {
    const { event = 'autofill', questions = 0, version = '2.3.0' } = payload;
    const { country = 'VN', city = 'Unknown', ipHash = 'unknown', userAgent = '' } = metadata;
    const { os, browser } = parseUserAgent(userAgent);

    let updatedCount = BASELINE_COUNT;

    if (env.DB) {
        try {
            // Atomic SQLite increment
            await env.DB.prepare(
                `
                INSERT INTO counters (name, value, updated_at) 
                VALUES ('autofill', ?, CURRENT_TIMESTAMP)
                ON CONFLICT(name) DO UPDATE SET 
                    value = value + 1,
                    updated_at = CURRENT_TIMESTAMP
            `
            )
                .bind(BASELINE_COUNT + 1)
                .run();

            const counterRow = await env.DB.prepare('SELECT value FROM counters WHERE name = ?')
                .bind('autofill')
                .first();

            if (counterRow) {
                updatedCount = counterRow.value;
            }

            // Log event with sanitized User-Agent, city, os, and browser
            const sanitizedUserAgent = userAgent.replace(/[^\x20-\x7E]/g, '').slice(0, 150);
            try {
                await env.DB.prepare(
                    `
                    INSERT INTO events (event_type, questions_count, version, country, city, os, browser, ip_hash, user_agent)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `
                )
                    .bind(event, questions, version, country, city, os, browser, ipHash, sanitizedUserAgent)
                    .run();
            } catch (_err) {
                // Fallback for tables without new columns
                await env.DB.prepare(
                    `
                    INSERT INTO events (event_type, questions_count, version, country, ip_hash, user_agent)
                    VALUES (?, ?, ?, ?, ?, ?)
                `
                )
                    .bind(event, questions, version, country, ipHash, sanitizedUserAgent)
                    .run();
            }

            return updatedCount;
        } catch (e) {
            console.error('[RecordEvent] D1 transaction failed:', e);
        }
    }

    if (env.KV) {
        const current = await getGlobalCount(env);
        updatedCount = current + 1;
        await env.KV.put('autofill_count', String(updatedCount));
        return updatedCount;
    }

    MEMORY_STORE.counter += 1;
    MEMORY_STORE.events.push({
        event_type: event,
        questions_count: questions,
        version,
        country,
        city,
        os,
        browser,
        ip_hash: ipHash,
        created_at: new Date().toISOString()
    });
    return MEMORY_STORE.counter;
}

/**
 * Gather aggregated metrics for dashboard & /stats endpoint
 */
async function getAggregatedStats(env) {
    const totalUsage = await getGlobalCount(env);
    let todayUsage = 0;
    let totalQuestions = 0;
    let activeUsers24h = 0;
    let activeUsers7d = 0;
    let dailyStats = [];
    let peakHours = [];
    let topCountries = [];
    let topCities = [];
    let osStats = [];
    let browserStats = [];
    let versionStats = [];
    let recentEvents = [];

    if (env.DB) {
        try {
            // Usages today (UTC)
            const todayRow = await env.DB.prepare(
                "SELECT COUNT(*) as count FROM events WHERE created_at >= date('now', 'start of day')"
            ).first();
            todayUsage = todayRow?.count || 0;

            // Total questions solved
            const qRow = await env.DB.prepare('SELECT SUM(questions_count) as total FROM events').first();
            totalQuestions = qRow?.total || 0;

            // Active unique users 24h
            const u24Row = await env.DB.prepare(
                "SELECT COUNT(DISTINCT ip_hash) as active FROM events WHERE created_at >= datetime('now', '-1 day')"
            ).first();
            activeUsers24h = u24Row?.active || 0;

            // Active unique users 7d
            const u7dRow = await env.DB.prepare(
                "SELECT COUNT(DISTINCT ip_hash) as active FROM events WHERE created_at >= datetime('now', '-7 days')"
            ).first();
            activeUsers7d = u7dRow?.active || 0;

            // Daily usage last 7 days
            try {
                const dayRows = await env.DB.prepare(
                    `SELECT date(created_at) as date, COUNT(*) as count, SUM(questions_count) as questions
                     FROM events
                     WHERE created_at >= date('now', '-7 days')
                     GROUP BY date(created_at)
                     ORDER BY date(created_at) DESC`
                ).all();
                dailyStats = dayRows.results || [];
            } catch (_e) {
                // Table without index or empty
            }

            // Peak hours (24h)
            try {
                const hourRows = await env.DB.prepare(
                    `SELECT strftime('%H', created_at) as hour, COUNT(*) as count
                     FROM events
                     GROUP BY hour
                     ORDER BY hour ASC`
                ).all();
                peakHours = hourRows.results || [];
            } catch (_e) {
                // Query error fallback
            }

            // Top countries
            const cRows = await env.DB.prepare(
                'SELECT country, COUNT(*) as count FROM events GROUP BY country ORDER BY count DESC LIMIT 5'
            ).all();
            topCountries = cRows.results || [];

            // Top cities
            try {
                const cityRows = await env.DB.prepare(
                    `SELECT city, country, COUNT(*) as count
                     FROM events
                     WHERE city IS NOT NULL AND city != '' AND city != 'Unknown'
                     GROUP BY city, country
                     ORDER BY count DESC
                     LIMIT 8`
                ).all();
                topCities = cityRows.results || [];
            } catch (_e) {
                // Legacy table fallback
            }

            // OS distribution
            try {
                const osRows = await env.DB.prepare(
                    `SELECT os, COUNT(*) as count
                     FROM events
                     WHERE os IS NOT NULL AND os != ''
                     GROUP BY os
                     ORDER BY count DESC
                     LIMIT 6`
                ).all();
                osStats = osRows.results || [];
            } catch (_e) {
                // Legacy table fallback
            }

            // Browser distribution
            try {
                const bRows = await env.DB.prepare(
                    `SELECT browser, COUNT(*) as count
                     FROM events
                     WHERE browser IS NOT NULL AND browser != ''
                     GROUP BY browser
                     ORDER BY count DESC
                     LIMIT 6`
                ).all();
                browserStats = bRows.results || [];
            } catch (_e) {
                // Legacy table fallback
            }

            // Version distribution
            const vRows = await env.DB.prepare(
                'SELECT version, COUNT(*) as count FROM events GROUP BY version ORDER BY count DESC LIMIT 5'
            ).all();
            versionStats = vRows.results || [];

            // Recent 10 events
            try {
                const eRows = await env.DB.prepare(
                    `SELECT event_type, questions_count, version, country, city, os, browser, created_at
                     FROM events
                     ORDER BY id DESC
                     LIMIT 10`
                ).all();
                recentEvents = eRows.results || [];
            } catch (_e) {
                const eRows = await env.DB.prepare(
                    'SELECT event_type, questions_count, version, country, created_at FROM events ORDER BY id DESC LIMIT 10'
                ).all();
                recentEvents = eRows.results || [];
            }
        } catch (err) {
            console.error('[AggregatedStats] D1 query error:', err);
        }
    } else {
        // In-memory calculations
        totalQuestions = MEMORY_STORE.events.reduce((sum, e) => sum + (e.questions_count || 0), 0);
        recentEvents = MEMORY_STORE.events.slice(-10).reverse();

        const countryMap = new Map();
        const cityMap = new Map();
        const osMap = new Map();
        const browserMap = new Map();
        const verMap = new Map();
        const hourMap = new Map();
        const dayMap = new Map();

        for (const e of MEMORY_STORE.events) {
            const country = e.country || 'VN';
            countryMap.set(country, (countryMap.get(country) || 0) + 1);

            if (e.city && e.city !== 'Unknown') {
                const cityKey = `${e.city}, ${country}`;
                cityMap.set(cityKey, (cityMap.get(cityKey) || 0) + 1);
            }

            const os = e.os || 'Other';
            osMap.set(os, (osMap.get(os) || 0) + 1);

            const browser = e.browser || 'Other';
            browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

            const ver = e.version || '2.3.0';
            verMap.set(ver, (verMap.get(ver) || 0) + 1);

            const dateStr = new Date(e.created_at).toISOString().split('T')[0];
            const currentDay = dayMap.get(dateStr) || { count: 0, questions: 0 };
            currentDay.count += 1;
            currentDay.questions += e.questions_count || 0;
            dayMap.set(dateStr, currentDay);

            const hour = new Date(e.created_at).getUTCHours().toString().padStart(2, '0');
            hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        }

        topCountries = Array.from(countryMap.entries()).map(([country, count]) => ({ country, count }));
        topCities = Array.from(cityMap.entries()).map(([city, count]) => ({ city, count }));
        osStats = Array.from(osMap.entries()).map(([os, count]) => ({ os, count }));
        browserStats = Array.from(browserMap.entries()).map(([browser, count]) => ({ browser, count }));
        versionStats = Array.from(verMap.entries()).map(([version, count]) => ({ version, count }));
        dailyStats = Array.from(dayMap.entries()).map(([date, data]) => ({ date, ...data }));
        peakHours = Array.from(hourMap.entries())
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => a.hour.localeCompare(b.hour));
    }

    return {
        totalUsage,
        todayUsage,
        totalQuestions,
        activeUsers24h,
        activeUsers7d,
        dailyStats,
        peakHours,
        topCountries,
        topCities,
        osStats,
        browserStats,
        versionStats,
        recentEvents,
        lastUpdated: new Date().toISOString()
    };
}

export default {
    async fetch(request, env, _ctx) {
        const corsHeaders = getCorsHeaders(request, env);

        // 1. Handle CORS Preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname.replace(/\/+$/, '') || '/';

        // 2. Health check
        if (path === '' || path === '/' || path === '/health') {
            return jsonResponse(
                {
                    status: 'operational',
                    service: 'NIX LMS Helper Telemetry API',
                    version: '2.3.0',
                    edgeRegion: request.cf?.colo || 'DEV'
                },
                200,
                corsHeaders
            );
        }

        // 3. GET /count - Retrieve current global count
        if (request.method === 'GET' && path === '/count') {
            const count = await getGlobalCount(env);
            return jsonResponse(
                {
                    success: true,
                    count,
                    latestVersion: env.LATEST_VERSION || DEFAULT_LATEST_VERSION,
                    updateUrl: env.UPDATE_URL || DEFAULT_UPDATE_URL,
                    releaseNotes: env.RELEASE_NOTES || ''
                },
                200,
                {
                    ...corsHeaders,
                    'Cache-Control': 'public, max-age=10, stale-while-revalidate=30'
                }
            );
        }

        // 4. POST /track - Record autofill usage & increment counter
        if (request.method === 'POST' && path === '/track') {
            let body;
            try {
                body = await request.json();
            } catch (_e) {
                return jsonResponse({ success: false, error: 'Invalid JSON payload' }, 400, corsHeaders);
            }

            // Schema validation & sanitization
            const event =
                typeof body.event === 'string' && ['autofill', 'open'].includes(body.event) ? body.event : 'autofill';
            const questions =
                Number.isInteger(body.questions) && body.questions >= 0 && body.questions <= 200 ? body.questions : 0;
            const version =
                typeof body.version === 'string' && /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.]+)?$/.test(body.version)
                    ? body.version.slice(0, 16)
                    : '2.3.0';

            // Anti-Replay Timestamp Check (within 15 minutes of server time)
            if (typeof body.timestamp === 'number') {
                const diff = Math.abs(Date.now() - body.timestamp);
                if (diff > 15 * 60 * 1000) {
                    return jsonResponse({ success: false, error: 'Timestamp expired or skewed' }, 400, corsHeaders);
                }
            }

            // Rate limiting check
            const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
            const ipHash = await hashIp(clientIp, env.SALT || 'nix-telemetry-salt');
            const allowed = await checkRateLimit(ipHash, env);

            if (!allowed) {
                const currentCount = await getGlobalCount(env);
                return jsonResponse(
                    {
                        success: false,
                        error: 'Rate limit exceeded. Please wait a few seconds.',
                        count: currentCount
                    },
                    429,
                    corsHeaders
                );
            }

            const metadata = {
                country: request.cf?.country || 'VN',
                city: request.cf?.city || 'Unknown',
                ipHash,
                userAgent: request.headers.get('User-Agent') || 'Unknown'
            };

            const newCount = await recordUsageEvent(env, { event, questions, version }, metadata);
            return jsonResponse(
                {
                    success: true,
                    count: newCount,
                    latestVersion: env.LATEST_VERSION || DEFAULT_LATEST_VERSION,
                    updateUrl: env.UPDATE_URL || DEFAULT_UPDATE_URL,
                    releaseNotes: env.RELEASE_NOTES || ''
                },
                200,
                corsHeaders
            );
        }

        // 5. GET /version - Retrieve latest script release info
        if (request.method === 'GET' && path === '/version') {
            return jsonResponse(
                {
                    success: true,
                    latestVersion: env.LATEST_VERSION || DEFAULT_LATEST_VERSION,
                    minRequiredVersion: env.MIN_REQUIRED_VERSION || '2.0.0',
                    updateUrl: env.UPDATE_URL || DEFAULT_UPDATE_URL,
                    releaseNotes: env.RELEASE_NOTES || 'Phiên bản mới nhất của NIX Digital LMS Helper.'
                },
                200,
                {
                    ...corsHeaders,
                    'Cache-Control': 'public, max-age=60, stale-while-revalidate=120'
                }
            );
        }

        // 6. GET /stats - Aggregated stats in JSON
        if (request.method === 'GET' && path === '/stats') {
            const stats = await getAggregatedStats(env);
            return jsonResponse(stats, 200, {
                ...corsHeaders,
                'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
            });
        }

        // 7. GET /dashboard - Aesthetic HTML Dashboard
        if (request.method === 'GET' && path === '/dashboard') {
            // Optional dashboard protection key
            if (env.DASHBOARD_SECRET) {
                const providedKey = url.searchParams.get('key') || request.headers.get('X-Dashboard-Key');
                if (providedKey !== env.DASHBOARD_SECRET) {
                    return new Response('Unauthorized. Please provide a valid ?key= parameter.', {
                        status: 401,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                }
            }

            const stats = await getAggregatedStats(env);
            const html = renderDashboard(stats);
            return new Response(html, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-Frame-Options': 'DENY',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }

        return jsonResponse({ success: false, error: 'Not Found' }, 404, corsHeaders);
    }
};
