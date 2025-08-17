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
            <span className="brand-text">Unicorn Hunter</span>
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
      </nav>
    </>
  );
}