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
          
          {/* Enhanced Brand with Sports Ticker */}
          <div className="header-brand-container">
            <div className="sports-ticker">
              <div className="ticker-content">
                <span>⚾</span>
                <span>🏀</span>
                <span>🏈</span>
                <span>⚽</span>
                <span>🏒</span>
                <span>⛳</span>
                <span>🎾</span>
                <span>🏐</span>
                {/* Duplicate for seamless loop */}
                <span>⚾</span>
                <span>🏀</span>
                <span>🏈</span>
                <span>⚽</span>
                <span>🏒</span>
                <span>⛳</span>
                <span>🎾</span>
                <span>🏐</span>
              </div>
            </div>
            
            <div className="header-brand">
              <span className="brand-icon">🦄</span>
              <div className="brand-text-container">
                <span className="brand-text">Sports Card Unicorn Hunter</span>
                <div className="brand-subtitle">Advanced Intelligence Platform</div>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="notification-btn">
              <span className="notification-icon">🔔</span>
              <span className="notification-badge">3</span>
            </button>
            <div className="user-profile">
              <span className="profile-icon">👤</span>
            </div>
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
              {pathname === item.href && <div className="active-indicator" />}
            </Link>
          ))}
        </div>
        
        {/* Sidebar Footer with Sports Theme */}
        <div className="sidebar-footer">
          <div className="sports-stats">
            <div className="stat-item">
              <span className="stat-icon">⚾</span>
              <span className="stat-count">8</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🏀</span>
              <span className="stat-count">6</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🏈</span>
              <span className="stat-count">7</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚽</span>
              <span className="stat-count">4</span>
            </div>
          </div>
          <div className="footer-text">
            <span>Hunting Unicorns</span>
            <span className="pulse-dot">●</span>
          </div>
        </div>
      </nav>
    </>
  );
}