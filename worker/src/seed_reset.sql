-- Reset Analytics Database and Seed 25 realistic autofill requests
-- Timestamps: 2026-10-03 from 12:00:25 to 12:14:46 Vietnam time (05:00:25 to 05:14:46 UTC)

DELETE FROM events;
DELETE FROM rate_limits;
INSERT OR REPLACE INTO counters (name, value, updated_at) VALUES ('autofill', 25, '2026-10-03 05:14:46');

INSERT INTO events (event_type, questions_count, version, country, city, os, browser, ip_hash, user_agent, created_at) VALUES
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:00:25'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:00:58'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:01:34'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:02:05'),
('autofill', 2, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:02:47'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:03:19'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:03:52'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:04:31'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:05:03'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:05:41'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:06:12'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:06:49'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:07:28'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:08:02'),
('autofill', 2, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:08:35'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:09:14'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:09:51'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:10:24'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:11:03'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:11:42'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:12:18'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:12:53'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:13:31'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:14:08'),
('autofill', 1, '2.3.0', 'VN', 'Quảng Hà', 'Linux', 'Chrome', 'd8f2a4e910bc731298c4a5e1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', '2026-10-03 05:14:46');
