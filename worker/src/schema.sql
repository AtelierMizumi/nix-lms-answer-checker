-- Cloudflare D1 Database Schema for NIX LMS Helper Analytics
-- Execute with: npx wrangler d1 execute nix-helper-db --file=src/schema.sql

-- 1. Counter table for high-performance aggregate numbers
CREATE TABLE IF NOT EXISTS counters (
    name TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize autofill counter baseline (starts at 0)
INSERT OR IGNORE INTO counters (name, value) VALUES ('autofill', 0);

-- 2. Anonymous event log for analytics
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    questions_count INTEGER DEFAULT 0,
    version TEXT DEFAULT '2.3.0',
    country TEXT DEFAULT 'VN',
    city TEXT DEFAULT '',
    os TEXT DEFAULT 'Other',
    browser TEXT DEFAULT 'Other',
    ip_hash TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_ip_hash ON events(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_os ON events(os);
CREATE INDEX IF NOT EXISTS idx_events_browser ON events(browser);

-- 3. Rate limiting table to prevent spam & abuse
CREATE TABLE IF NOT EXISTS rate_limits (
    ip_hash TEXT PRIMARY KEY,
    last_request_time INTEGER NOT NULL,
    window_count INTEGER DEFAULT 1
);
