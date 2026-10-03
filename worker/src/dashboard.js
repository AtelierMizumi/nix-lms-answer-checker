/**
 * Renders an aesthetic, responsive dark-mode analytics dashboard for NIX Helper.
 * Designed with vanilla CSS tokens, glassmorphism, and responsive grid layouts.
 *
 * @param {Object} stats
 * @returns {string} HTML string
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function renderDashboard(stats) {
    const {
        totalUsage = 403,
        todayUsage = 0,
        totalQuestions = 0,
        activeUsers24h = 0,
        activeUsers7d = 0,
        dailyStats = [],
        peakHours = [],
        topCountries = [],
        topCities = [],
        osStats = [],
        browserStats = [],
        versionStats = [],
        recentEvents = [],
        lastUpdated = new Date().toISOString()
    } = stats;

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NIX Helper Analytics Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-base: #090d16;
            --bg-surface: #0f172a;
            --bg-card: rgba(15, 23, 42, 0.75);
            --border-card: rgba(51, 65, 85, 0.6);
            --border-hover: rgba(14, 165, 233, 0.4);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --primary: #0ea5e9;
            --primary-glow: rgba(14, 165, 233, 0.25);
            --accent-teal: #14b8a6;
            --accent-emerald: #10b981;
            --accent-amber: #f59e0b;
            --accent-purple: #8b5cf6;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-base);
            background-image: 
                radial-gradient(at 15% 10%, rgba(14, 165, 233, 0.12) 0px, transparent 50%),
                radial-gradient(at 85% 80%, rgba(20, 184, 166, 0.1) 0px, transparent 50%);
            background-attachment: fixed;
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            padding: 2.5rem 1.5rem;
            line-height: 1.5;
        }

        .container {
            max-width: 1240px;
            margin: 0 auto;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1.5rem;
            margin-bottom: 2.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid rgba(51, 65, 85, 0.4);
        }

        .brand-title {
            display: flex;
            align-items: center;
            gap: 0.875rem;
        }

        .brand-icon {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #0ea5e9, #0f766e);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1.25rem;
            color: #fff;
            box-shadow: 0 4px 20px var(--primary-glow);
        }

        .brand-text h1 {
            font-size: 1.45rem;
            font-weight: 750;
            letter-spacing: -0.02em;
            background: linear-gradient(to right, #f8fafc, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .brand-text p {
            font-size: 0.825rem;
            color: var(--text-muted);
        }

        .header-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .badge-live {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.35rem 0.85rem;
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 999px;
            font-size: 0.775rem;
            font-weight: 600;
            color: #34d399;
        }

        .badge-dot {
            width: 7px;
            height: 7px;
            background: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 10px #10b981;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
        }

        .refresh-btn {
            background: var(--bg-surface);
            border: 1px solid var(--border-card);
            color: var(--text-secondary);
            padding: 0.45rem 1rem;
            border-radius: 8px;
            font-size: 0.825rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
        }

        .refresh-btn:hover {
            border-color: var(--primary);
            color: var(--text-primary);
            background: rgba(14, 165, 233, 0.1);
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.25rem;
            margin-bottom: 2rem;
        }

        .card {
            background: var(--bg-card);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--border-card);
            border-radius: 16px;
            padding: 1.5rem;
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
            position: relative;
            overflow: hidden;
        }

        .card:hover {
            transform: translateY(-2px);
            border-color: var(--border-hover);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        .card-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }

        .card-label {
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
        }

        .card-icon {
            font-size: 1.15rem;
            opacity: 0.85;
        }

        .card-value {
            font-size: 2.25rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            color: var(--text-primary);
            font-family: 'JetBrains Mono', monospace;
            line-height: 1.2;
        }

        .card-subtext {
            margin-top: 0.5rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
        }

        .glow-cyan::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #0ea5e9, #38bdf8);
        }

        .glow-emerald::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #10b981, #34d399);
        }

        .glow-purple::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6, #a78bfa);
        }

        .glow-amber::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }

        .content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        @media (max-width: 960px) {
            .content-grid {
                grid-template-columns: 1fr;
            }
        }

        .section-title {
            font-size: 1.05rem;
            font-weight: 700;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-primary);
        }

        .table-wrapper {
            overflow-x: auto;
            border-radius: 12px;
            border: 1px solid var(--border-card);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.825rem;
            text-align: left;
        }

        th {
            background: rgba(30, 41, 59, 0.7);
            color: var(--text-secondary);
            font-weight: 600;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border-card);
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.05em;
        }

        td {
            padding: 0.85rem 1rem;
            border-bottom: 1px solid rgba(51, 65, 85, 0.3);
            color: var(--text-secondary);
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background: rgba(30, 41, 59, 0.4);
            color: var(--text-primary);
        }

        .badge {
            display: inline-block;
            padding: 0.2rem 0.55rem;
            border-radius: 6px;
            font-size: 0.725rem;
            font-weight: 600;
            font-family: 'JetBrains Mono', monospace;
        }

        .badge-event {
            background: rgba(14, 165, 233, 0.15);
            color: #38bdf8;
            border: 1px solid rgba(14, 165, 233, 0.3);
        }

        .badge-country {
            background: rgba(139, 92, 246, 0.15);
            color: #c084fc;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .badge-city {
            background: rgba(20, 184, 166, 0.15);
            color: #2dd4bf;
            border: 1px solid rgba(20, 184, 166, 0.3);
        }

        .badge-os {
            background: rgba(59, 130, 246, 0.15);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .badge-browser {
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .list-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid rgba(51, 65, 85, 0.3);
            font-size: 0.85rem;
        }

        .list-row:last-child {
            border-bottom: none;
        }

        .list-name {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .list-value {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 600;
            color: var(--text-primary);
        }

        .side-stack {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        /* Peak Hours Bar Chart */
        .hours-grid {
            display: grid;
            grid-template-columns: repeat(24, 1fr);
            gap: 2px;
            align-items: end;
            height: 90px;
            padding: 0.75rem 0.25rem 0.25rem;
            margin-top: 0.5rem;
            border-bottom: 1px solid rgba(51, 65, 85, 0.4);
        }

        .hour-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
            justify-content: flex-end;
            position: relative;
        }

        .hour-bar {
            width: 100%;
            background: linear-gradient(180deg, #0ea5e9, #0f766e);
            border-radius: 3px 3px 0 0;
            min-height: 4px;
            transition: height 0.3s ease;
        }

        .hour-bar:hover {
            background: #38bdf8;
        }

        .hour-label {
            font-size: 0.65rem;
            color: var(--text-muted);
            margin-top: 0.4rem;
            font-family: 'JetBrains Mono', monospace;
        }

        footer {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid rgba(51, 65, 85, 0.4);
            font-size: 0.775rem;
            color: var(--text-muted);
        }

        footer a {
            color: var(--primary);
            text-decoration: none;
        }

        footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="brand-title">
                <div class="brand-icon">N</div>
                <div class="brand-text">
                    <h1>NIX Helper Analytics</h1>
                    <p>Edge Telemetry & Comprehensive Usage Tracker</p>
                </div>
            </div>
            <div class="header-meta">
                <div class="badge-live">
                    <span class="badge-dot"></span>
                    <span>Edge Network Online</span>
                </div>
                <button class="refresh-btn" onclick="window.location.reload()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    Làm mới
                </button>
            </div>
        </header>

        <!-- Metric Cards -->
        <div class="metrics-grid">
            <div class="card glow-cyan">
                <div class="card-top">
                    <span class="card-label">Tổng Lượt Sử Dụng</span>
                    <span class="card-icon">⚡</span>
                </div>
                <div class="card-value">${Number(totalUsage).toLocaleString()}</div>
                <div class="card-subtext">Đồng bộ tức thời với popup userscript</div>
            </div>

            <div class="card glow-emerald">
                <div class="card-top">
                    <span class="card-label">Lượt Sử Dụng Hôm Nay</span>
                    <span class="card-icon">📈</span>
                </div>
                <div class="card-value">${Number(todayUsage).toLocaleString()}</div>
                <div class="card-subtext">Phiên giải quiz diễn ra trong ngày</div>
            </div>

            <div class="card glow-purple">
                <div class="card-top">
                    <span class="card-label">Active Users (24h / 7d)</span>
                    <span class="card-icon">👥</span>
                </div>
                <div class="card-value">${Number(activeUsers24h).toLocaleString()} <span style="font-size: 1.25rem; font-weight: 500; color: var(--text-muted);">/ ${Number(activeUsers7d).toLocaleString()}</span></div>
                <div class="card-subtext">Người dùng ẩn danh duy nhất</div>
            </div>

            <div class="card glow-amber">
                <div class="card-top">
                    <span class="card-label">Câu Hỏi Đã Giải</span>
                    <span class="card-icon">🎯</span>
                </div>
                <div class="card-value">${Number(totalQuestions).toLocaleString()}</div>
                <div class="card-subtext">Tổng số câu hỏi được tự động hoàn thành</div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
            <!-- Left Column: Recent Events & Daily Timeline -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- Recent Events Table -->
                <div class="card">
                    <h2 class="section-title">
                        <span>🕒</span> Lịch sử hoạt động gần đây
                    </h2>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Sự kiện</th>
                                    <th>Số câu</th>
                                    <th>Vị trí</th>
                                    <th>Môi trường</th>
                                    <th>Phiên bản</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    recentEvents.length === 0
                                        ? '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">Chưa có sự kiện nào được ghi nhận</td></tr>'
                                        : recentEvents
                                              .map(
                                                  e => `
                                    <tr>
                                        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">${new Date(e.created_at).toLocaleString('vi-VN')}</td>
                                        <td><span class="badge badge-event">${escapeHtml(e.event_type)}</span></td>
                                        <td><strong style="color: var(--text-primary); font-family: 'JetBrains Mono', monospace;">${Number(e.questions_count) || 0}</strong></td>
                                        <td>
                                            <span class="badge badge-country">${escapeHtml(e.country || 'VN')}</span>
                                            ${e.city && e.city !== 'Unknown' ? `<span class="badge badge-city" style="margin-left: 4px;">${escapeHtml(e.city)}</span>` : ''}
                                        </td>
                                        <td>
                                            <span class="badge badge-os">${escapeHtml(e.os || 'Other')}</span>
                                            <span class="badge badge-browser" style="margin-left: 4px;">${escapeHtml(e.browser || 'Other')}</span>
                                        </td>
                                        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.775rem;">v${escapeHtml(e.version || '2.3.0')}</td>
                                    </tr>
                                `
                                              )
                                              .join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Daily Usage Timeline -->
                <div class="card">
                    <h2 class="section-title">
                        <span>📅</span> Thống kê 7 ngày gần nhất
                    </h2>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ngày (UTC)</th>
                                    <th>Lượt sử dụng</th>
                                    <th>Số câu hỏi đã điền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    dailyStats.length === 0
                                        ? '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Chưa có dữ liệu thống kê theo ngày</td></tr>'
                                        : dailyStats
                                              .map(
                                                  d => `
                                    <tr>
                                        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 500;">${escapeHtml(d.date)}</td>
                                        <td><strong style="color: var(--primary); font-family: 'JetBrains Mono', monospace;">${Number(d.count).toLocaleString()}</strong></td>
                                        <td style="font-family: 'JetBrains Mono', monospace;">${Number(d.questions || 0).toLocaleString()} câu</td>
                                    </tr>
                                `
                                              )
                                              .join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Peak Hours Breakdown -->
                ${
                    peakHours.length > 0
                        ? `
                <div class="card">
                    <h2 class="section-title">
                        <span>⏰</span> Khung giờ hoạt động cao điểm (24h)
                    </h2>
                    <div class="hours-grid">
                        ${Array.from({ length: 24 })
                            .map((_, i) => {
                                const hStr = i.toString().padStart(2, '0');
                                const found = peakHours.find(p => p.hour === hStr);
                                const count = found ? found.count : 0;
                                const maxCount = Math.max(...peakHours.map(p => p.count), 1);
                                const heightPct = Math.max(6, Math.round((count / maxCount) * 100));
                                return `
                                <div class="hour-col" title="${hStr}:00 UTC - ${count} lượt">
                                    <div class="hour-bar" style="height: ${heightPct}%;"></div>
                                    <span class="hour-label">${i % 4 === 0 ? hStr : ''}</span>
                                </div>
                            `;
                            })
                            .join('')}
                    </div>
                    <p style="font-size: 0.725rem; color: var(--text-muted); margin-top: 0.6rem; text-align: center;">Múi giờ máy chủ UTC (Giờ VN = UTC + 7)</p>
                </div>
                `
                        : ''
                }
            </div>

            <!-- Right Column: Geo, OS, Browser, Version -->
            <div class="side-stack">
                <!-- Geo Location: Cities & Countries -->
                <div class="card">
                    <h2 class="section-title">
                        <span>📍</span> Vị trí địa lý (Geo-Location)
                    </h2>
                    <div style="margin-bottom: 1rem;">
                        <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Thành phố phổ biến</span>
                        <div style="margin-top: 0.5rem;">
                            ${
                                topCities.length === 0
                                    ? '<p style="color: var(--text-muted); font-size: 0.825rem;">Chưa có dữ liệu thành phố</p>'
                                    : topCities
                                          .map(
                                              c => `
                                <div class="list-row">
                                    <span class="list-name"><span class="badge badge-city">${escapeHtml(c.city)}</span> ${escapeHtml(c.country)}</span>
                                    <span class="list-value">${Number(c.count).toLocaleString()}</span>
                                </div>
                            `
                                          )
                                          .join('')
                            }
                        </div>
                    </div>

                    <div>
                        <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Quốc gia</span>
                        <div style="margin-top: 0.5rem;">
                            ${
                                topCountries.length === 0
                                    ? '<p style="color: var(--text-muted); font-size: 0.825rem;">Chưa có dữ liệu quốc gia</p>'
                                    : topCountries
                                          .map(
                                              c => `
                                <div class="list-row">
                                    <span class="list-name"><span class="badge badge-country">${escapeHtml(c.country)}</span> ${c.country === 'VN' ? 'Việt Nam' : escapeHtml(c.country)}</span>
                                    <span class="list-value">${Number(c.count).toLocaleString()}</span>
                                </div>
                            `
                                          )
                                          .join('')
                            }
                        </div>
                    </div>
                </div>

                <!-- Operating System -->
                <div class="card">
                    <h2 class="section-title">
                        <span>💻</span> Hệ điều hành (OS)
                    </h2>
                    <div>
                        ${
                            osStats.length === 0
                                ? '<p style="color: var(--text-muted); font-size: 0.825rem;">Chưa có dữ liệu hệ điều hành</p>'
                                : osStats
                                      .map(
                                          o => `
                            <div class="list-row">
                                <span class="list-name"><span class="badge badge-os">${escapeHtml(o.os)}</span></span>
                                <span class="list-value">${Number(o.count).toLocaleString()}</span>
                            </div>
                        `
                                      )
                                      .join('')
                        }
                    </div>
                </div>

                <!-- Browsers -->
                <div class="card">
                    <h2 class="section-title">
                        <span>🌐</span> Trình duyệt
                    </h2>
                    <div>
                        ${
                            browserStats.length === 0
                                ? '<p style="color: var(--text-muted); font-size: 0.825rem;">Chưa có dữ liệu trình duyệt</p>'
                                : browserStats
                                      .map(
                                          b => `
                            <div class="list-row">
                                <span class="list-name"><span class="badge badge-browser">${escapeHtml(b.browser)}</span></span>
                                <span class="list-value">${Number(b.count).toLocaleString()}</span>
                            </div>
                        `
                                      )
                                      .join('')
                        }
                    </div>
                </div>

                <!-- Versions -->
                <div class="card">
                    <h2 class="section-title">
                        <span>📦</span> Phiên bản Script
                    </h2>
                    <div>
                        ${
                            versionStats.length === 0
                                ? '<p style="color: var(--text-muted); font-size: 0.825rem;">Chưa có dữ liệu phiên bản</p>'
                                : versionStats
                                      .map(
                                          v => `
                            <div class="list-row">
                                <span class="list-name">v${escapeHtml(v.version)}</span>
                                <span class="list-value">${Number(v.count).toLocaleString()}</span>
                            </div>
                        `
                                      )
                                      .join('')
                        }
                    </div>
                </div>
            </div>
        </div>

        <footer>
            <p>NIX Helper Edge Telemetry • Dữ liệu hoàn toàn ẩn danh, không lưu trữ thông tin cá nhân hay nội dung bài làm.</p>
            <p style="margin-top: 0.35rem;">Cập nhật lần cuối: ${new Date(lastUpdated).toLocaleString('vi-VN')} • <a href="https://github.com/AtelierMizumi/nix-lms-answer-checker" target="_blank" rel="noopener">GitHub Repository</a></p>
        </footer>
    </div>
</body>
</html>`;
}
