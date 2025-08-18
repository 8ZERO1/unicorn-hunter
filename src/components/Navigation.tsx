'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/hot-auctions', label: 'Hot Auctions', icon: '🔥' },
    { href: '/alerts', label: 'Alerts', icon: '🚨' },
    { href: '/watchlist', label: 'Watchlist', icon: '👁️' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  const adminItems = [
    { href: '/admin/historical-data', label: 'Historical Data', icon: '📊' },
    { href: '/admin/dismissed-items', label: 'Dismissed Items', icon: '🗂️' },
    { href: '/admin/calculator', label: 'Card Calculator', icon: '🧮' },
    { href: '/admin/system', label: 'System Status', icon: '⚙️' },
  ];

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button 
            className="menu-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            ☰
          </button>
          <div className="header-brand">
            <span className="brand-icon">🦄</span>
            <div className="brand-content">
              <span className="brand-text">Sports Card Unicorn Hunter</span>
              <div className="sports-ticker">
                <span className="sports-emoji">⚾</span>
                <span className="sports-emoji">🏀</span>
                <span className="sports-emoji">🏈</span>
                <span className="sports-emoji">⚽</span>
                <span className="sports-emoji">⛳</span>
                <span className="sports-emoji">🏒</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="notification-btn">🔔</button>
            <div className="user-profile">👤</div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="nav-items">
          {/* Main Navigation */}
          <div className="nav-section">
            <div className="nav-section-title">Main</div>
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Admin Section */}
          <div className="nav-section">
            <div className="nav-section-title">Admin</div>
            {adminItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <style jsx>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: var(--card-bg);
          border-bottom: 1px solid var(--border-subtle);
          backdrop-filter: blur(20px);
          z-index: 1000;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0 20px;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .menu-toggle:hover {
          background: var(--card-hover);
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .brand-icon {
          font-size: 1.8rem;
        }

        .brand-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .brand-text {
          font-size: 1.1rem;
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
        }

        .sports-ticker {
          display: flex;
          gap: 8px;
          overflow: hidden;
          white-space: nowrap;
        }

        .sports-emoji {
          font-size: 0.9rem;
          opacity: 0.7;
          animation: bounce 2s ease-in-out infinite;
          animation-delay: var(--delay, 0s);
        }

        .sports-emoji:nth-child(1) { --delay: 0s; }
        .sports-emoji:nth-child(2) { --delay: 0.3s; }
        .sports-emoji:nth-child(3) { --delay: 0.6s; }
        .sports-emoji:nth-child(4) { --delay: 0.9s; }
        .sports-emoji:nth-child(5) { --delay: 1.2s; }
        .sports-emoji:nth-child(6) { --delay: 1.5s; }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
          60% { transform: translateY(-2px); }
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notification-btn, .user-profile {
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .notification-btn:hover, .user-profile:hover {
          background: var(--card-hover);
        }

        .sidebar {
          position: fixed;
          top: 60px;
          left: 0;
          width: 240px;
          height: calc(100vh - 60px);
          background: var(--card-bg);
          border-right: 1px solid var(--border-subtle);
          backdrop-filter: blur(20px);
          transition: transform 0.3s ease;
          z-index: 999;
          overflow-y: auto;
        }

        .sidebar.collapsed {
          transform: translateX(-240px);
        }

        .nav-items {
          padding: 20px 0;
        }

        .nav-section {
          margin-bottom: 24px;
        }

        .nav-section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          padding: 0 20px 8px 20px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 12px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }

        .nav-item:hover {
          background: var(--card-hover);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--card-hover);
          color: var(--accent-primary);
          border-left-color: var(--accent-primary);
        }

        .nav-icon {
          font-size: 1.1rem;
          min-width: 20px;
        }

        .nav-label {
          font-weight: 500;
          font-size: 0.95rem;
        }

        .main-content {
          margin-left: 240px;
          margin-top: 60px;
          min-height: calc(100vh - 60px);
        }

        @media (max-width: 768px) {
          .menu-toggle {
            display: block;
          }

          .brand-text {
            font-size: 0.95rem;
          }

          .sports-ticker {
            gap: 6px;
          }

          .sports-emoji {
            font-size: 0.8rem;
          }

          .sidebar {
            transform: translateX(-240px);
          }

          .sidebar:not(.collapsed) {
            transform: translateX(0);
          }

          .main-content {
            margin-left: 0;
          }

          .header-actions {
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .brand-text {
            display: none;
          }

          .sports-ticker {
            display: none;
          }

          .header-content {
            padding: 0 15px;
          }
        }
      `}</style>
    </>
  );
}