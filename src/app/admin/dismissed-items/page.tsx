'use client';

import { useState, useEffect } from 'react';
import { getDismissedItems, restoreDismissedItem } from '../../../lib/data/dataService';

interface DismissedItem {
  id: string;
  ebay_item_id: string;
  title: string;
  current_price: number;
  dismissed_at: string;
  expires_at: string;
  card_player: string;
  card_year: string;
  card_brand: string;
  days_remaining: number;
  ebay_url: string;
  image_url: string;
}

export default function DismissedItemsAdmin() {
  const [dismissedItems, setDismissedItems] = useState<DismissedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'expiring' | 'price'>('recent');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    loadDismissedItems();
    
    // Auto-refresh every 3 minutes to update expiration times
    const interval = setInterval(() => {
      loadDismissedItems();
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(interval);
  }, []);

  const loadDismissedItems = async () => {
    try {
      setLoading(true);
      const items = await getDismissedItems();
      setDismissedItems(items);
    } catch (error) {
      console.error('Error loading dismissed items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (itemId: string) => {
    try {
      setRestoring(itemId);
      await restoreDismissedItem(itemId);
      // Remove from local state
      setDismissedItems(prev => prev.filter(item => item.id !== itemId));
      alert('Item successfully restored! It will reappear in Hot Auctions.');
    } catch (error) {
      console.error('Error restoring item:', error);
      alert('Failed to restore item. Please try again.');
    } finally {
      setRestoring(null);
    }
  };

  const handleCleanupExpired = async () => {
    try {
      setCleaningUp(true);
      
      // Calculate expired items using live calculation
      const now = new Date();
      const expiredItems = dismissedItems.filter(item => {
        const expirationDate = new Date(item.expires_at);
        return expirationDate.getTime() <= now.getTime();
      });
      
      console.log(`🧹 CLEANUP: Found ${expiredItems.length} expired items out of ${dismissedItems.length} total`);
      
      if (expiredItems.length === 0) {
        alert('No expired items to clean up!');
        return;
      }

      // Remove expired items from state (in production, this would call API)
      setDismissedItems(prev => prev.filter(item => {
        const expirationDate = new Date(item.expires_at);
        const isExpired = expirationDate.getTime() <= now.getTime();
        return !isExpired;
      }));
      
      alert(`Successfully cleaned up ${expiredItems.length} expired dismissal(s).`);
      
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
      alert('Failed to cleanup expired items. Please try again.');
    } finally {
      setCleaningUp(false);
    }
  };

  const filteredItems = dismissedItems
    .filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.card_player.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.dismissed_at).getTime() - new Date(a.dismissed_at).getTime();
        case 'expiring':
          const aDays = calculateDaysRemaining(a.expires_at);
          const bDays = calculateDaysRemaining(b.expires_at);
          return aDays - bDays;
        case 'price':
          return b.current_price - a.current_price;
        default:
          return 0;
      }
    });

  const getExpirationStatus = (daysRemaining: number) => {
    if (daysRemaining === undefined || daysRemaining === null || isNaN(daysRemaining)) {
      return 'normal';
    }
    
    if (daysRemaining <= 0) return 'expired';
    if (daysRemaining <= 3) return 'critical';
    if (daysRemaining <= 7) return 'warning';
    return 'normal';
  };

  const calculateDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Get expired count using live calculation
  const expiredCount = dismissedItems.filter(item => {
    const expirationDate = new Date(item.expires_at);
    return expirationDate.getTime() <= new Date().getTime();
  }).length;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Enhanced image URL extraction for eBay listings
  const getImageUrl = (item: DismissedItem) => {
    // If we have stored image_url, use it
    if (item.image_url && item.image_url !== '' && !item.image_url.includes('🃏')) {
      return item.image_url;
    }
    
    // Try to construct eBay image URL from item ID
    if (item.ebay_item_id) {
      // This is a common eBay image pattern, but may not always work
      return `https://i.ebayimg.com/thumbs/images/g/${item.ebay_item_id.substring(0, 12)}/s-l300.jpg`;
    }
    
    return null;
  };

  return (
    <div className="admin-container">
      {/* Premium Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-icon">🗂️</div>
          <div className="header-text">
            <h1>Dismissed Items Management</h1>
            <p>View and restore previously dismissed auction opportunities</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <div className="stat-number">{dismissedItems.length}</div>
              <div className="stat-label">Total Dismissed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {dismissedItems.filter(item => {
                  const days = calculateDaysRemaining(item.expires_at);
                  return days > 0 && days <= 7;
                }).length}
              </div>
              <div className="stat-label">Expiring Soon</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{expiredCount}</div>
              <div className="stat-label">Expired</div>
            </div>
          </div>
          <div className="header-actions">
            <button
              onClick={handleCleanupExpired}
              disabled={cleaningUp || expiredCount === 0}
              className="cleanup-button"
            >
              {cleaningUp ? (
                <>🔄 Cleaning...</>
              ) : (
                <>🧹 Cleanup Expired ({expiredCount})</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* Controls Panel */}
        <div className="controls-panel">
          <div className="search-section">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by card name or player..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="sort-section">
            <label className="sort-label">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="recent">Recently Dismissed</option>
              <option value="expiring">Expiring Soon</option>
              <option value="price">Highest Price</option>
            </select>
          </div>
        </div>

        {/* Items Table */}
        <div className="items-panel">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">🔄</div>
              <p>Loading dismissed items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✨</div>
              <h3>No Dismissed Items</h3>
              <p>
                {searchTerm 
                  ? 'No items match your search criteria.' 
                  : 'You haven\'t dismissed any auction items yet. Great job staying focused on opportunities!'
                }
              </p>
            </div>
          ) : (
            <div className="items-table">
              <div className="table-header">
                <div className="col-image">Image</div>
                <div className="col-card">Card Details</div>
                <div className="col-price">Price</div>
                <div className="col-dismissed">Dismissed</div>
                <div className="col-expires">Expires</div>
                <div className="col-actions">Actions</div>
              </div>
              
              {filteredItems.map((item) => {
                const actualDaysRemaining = calculateDaysRemaining(item.expires_at);
                const imageUrl = getImageUrl(item);
                
                return (
                  <div key={item.id} className="table-row">
                    <div className="col-image">
                      <div className="card-image-wrapper">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={item.title}
                            className="card-image"
                            onError={(e) => {
                              // Fallback to placeholder if image fails
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const placeholder = target.nextElementSibling as HTMLElement;
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                            onLoad={(e) => {
                              // Hide placeholder when image loads successfully
                              const target = e.currentTarget as HTMLImageElement;
                              const placeholder = target.nextElementSibling as HTMLElement;
                              if (placeholder) {
                                placeholder.style.display = 'none';
                              }
                            }}
                          />
                        ) : null}
                        <div className="card-placeholder" style={{display: imageUrl ? 'none' : 'flex'}}>
                          🃏
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-card">
                      <div className="card-info">
                        <div className="card-title">
                          <a 
                            href={item.ebay_url || `https://www.ebay.com/itm/${item.ebay_item_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ebay-link"
                          >
                            {item.title}
                          </a>
                        </div>
                        <div className="card-meta">
                          {item.card_player} • {item.card_year} {item.card_brand}
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-price">
                      <span className="price-value">{formatPrice(item.current_price)}</span>
                    </div>
                    
                    <div className="col-dismissed">
                      <span className="date-value">{formatDate(item.dismissed_at)}</span>
                    </div>
                    
                    <div className="col-expires">
                      <div className={`expiration-badge ${getExpirationStatus(actualDaysRemaining)}`}>
                        {actualDaysRemaining <= 0 ? 'Expired' : `${actualDaysRemaining}d remaining`}
                      </div>
                    </div>
                    
                    <div className="col-actions">
                      <button
                        onClick={() => handleRestore(item.id)}
                        disabled={restoring === item.id}
                        className="restore-button"
                      >
                        {restoring === item.id ? (
                          <>🔄 Restoring...</>
                        ) : (
                          <>↩️ Restore</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="info-panel">
          <h3>ℹ️ How Dismissal Works</h3>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">⏰</div>
              <div className="info-text">
                <h4>30-Day Auto-Expiration</h4>
                <p>Dismissed items automatically become available again after 30 days, giving you a chance to reconsider if market conditions change.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">🎯</div>
              <div className="info-text">
                <h4>Specific Item Targeting</h4>
                <p>Dismissals are tied to specific eBay listings, not card types. Similar cards from different sellers will still appear.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">↩️</div>
              <div className="info-text">
                <h4>Instant Restoration</h4>
                <p>Changed your mind? Restore any dismissed item instantly to make it appear in Hot Auctions again.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">🧹</div>
              <div className="info-text">
                <h4>Automatic Cleanup</h4>
                <p>Expired dismissals are automatically cleaned up to keep your database lean and focused on current opportunities.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-container {
          min-height: 100vh;
          background: var(--page-bg);
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .admin-header {
          background: linear-gradient(135deg, 
            rgba(99, 102, 241, 0.1) 0%, 
            rgba(168, 85, 247, 0.1) 100%);
          border-bottom: 1px solid var(--border-subtle);
          backdrop-filter: blur(20px);
          padding: 40px 0;
          margin-bottom: 40px;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .header-icon {
          font-size: 4rem;
          opacity: 0.9;
        }

        .header-text {
          flex: 1;
        }

        .header-text h1 {
          font-size: 3rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary);
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-text p {
          font-size: 1.2rem;
          color: var(--text-secondary);
          margin: 8px 0 0 0;
          font-weight: 400;
        }

        .header-stats {
          display: flex;
          gap: 32px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent-primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .cleanup-button {
          padding: 12px 20px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }

        .cleanup-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
        }

        .cleanup-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          background: var(--border-subtle);
          color: var(--text-secondary);
          box-shadow: none;
        }

        .admin-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          gap: 32px;
        }

        .controls-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 24px 32px;
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .search-section {
          flex: 1;
          min-width: 280px;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          font-size: 1.1rem;
          opacity: 0.6;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.08);
        }

        .search-input::placeholder {
          color: var(--text-secondary);
          opacity: 0.7;
        }

        .sort-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sort-label {
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .sort-select {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.95rem;
          cursor: pointer;
        }

        .sort-select option {
          background: var(--card-bg);
          color: var(--text-primary);
          padding: 8px;
        }

        .items-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          overflow: hidden;
        }

        .loading-state, .empty-state {
          padding: 80px 40px;
          text-align: center;
        }

        .loading-spinner {
          font-size: 3rem;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin: 0 0 12px 0;
        }

        .empty-state p {
          color: var(--text-secondary);
          font-size: 1.1rem;
          margin: 0;
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .items-table {
          display: grid;
        }

        .table-header {
          display: grid;
          grid-template-columns: 80px 2fr 120px 140px 180px 120px;
          gap: 16px;
          padding: 20px 32px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-subtle);
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .table-row {
          display: grid;
          grid-template-columns: 80px 2fr 120px 140px 180px 120px;
          gap: 16px;
          padding: 24px 32px;
          border-bottom: 1px solid var(--border-subtle);
          align-items: center;
          transition: background 0.2s ease;
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .col-image {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-image-wrapper {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--border-subtle);
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          transition: opacity 0.3s ease;
        }

        .card-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: var(--text-secondary);
          background: var(--border-subtle);
          border-radius: 8px;
        }

        .card-info {
          min-width: 0;
        }

        .card-title {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 1rem;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ebay-link {
          color: var(--text-primary);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .ebay-link:hover {
          color: var(--accent-primary);
          text-decoration: underline;
        }

        .card-meta {
          color: var(--text-secondary);
          font-size: 0.9rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-value {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 1.1rem;
        }

        .date-value {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .expiration-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          text-align: center;
          min-width: 120px;
        }

        .expiration-badge.normal {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .expiration-badge.warning {
          background: rgba(251, 146, 60, 0.2);
          color: #fb923c;
          border: 1px solid rgba(251, 146, 60, 0.3);
        }

        .expiration-badge.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .expiration-badge.expired {
          background: rgba(107, 114, 128, 0.2);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.3);
        }

        .restore-button {
          padding: 8px 16px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          min-width: 100px;
        }

        .restore-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .restore-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .info-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 32px;
          backdrop-filter: blur(20px);
        }

        .info-panel h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 24px 0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .info-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--accent-primary);
          transform: translateY(-2px);
        }

        .info-icon {
          font-size: 1.5rem;
          opacity: 0.9;
        }

        .info-text h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .info-text p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 1024px) {
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .col-image {
            order: 1;
            justify-content: flex-start;
          }

          .col-card {
            order: 2;
          }
          
          .col-price {
            order: 3;
          }
          
          .col-dismissed {
            order: 4;
          }
          
          .col-expires {
            order: 5;
          }
          
          .col-actions {
            order: 6;
          }

          .card-image-wrapper {
            width: 80px;
            height: 80px;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            gap: 24px;
          }

          .header-stats {
            gap: 24px;
          }

          .header-actions {
            order: 4;
          }

          .controls-panel {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .search-section {
            min-width: auto;
          }

          .sort-section {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .admin-content {
            padding: 0 20px;
          }

          .header-content {
            padding: 0 20px;
          }

          .header-text h1 {
            font-size: 2.5rem;
          }

          .header-stats {
            gap: 16px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .header-actions {
            width: 100%;
            justify-content: center;
          }

          .cleanup-button {
            padding: 10px 16px;
            font-size: 0.9rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}