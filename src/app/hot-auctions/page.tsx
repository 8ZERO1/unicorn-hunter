'use client';

import React, { useState, useEffect } from 'react';
import { getHotAuctions } from '../../lib/data/dataService';
import { Auction } from '../../lib/types/auction';
import { CountdownTimer } from '../../components/CountdownTimer';

export default function HotAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<'urgency' | 'discount' | 'priority' | 'price' | 'card' | 'grade' | 'type' | 'seller' | 'roi'>('urgency');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterBudget, setFilterBudget] = useState<number>(1000);

  // Load auctions on component mount
  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading real eBay auction data...');
      const data = await getHotAuctions();
      setAuctions(data);
      setLastRefresh(new Date());
      console.log(`✅ Loaded ${data.length} hot auctions`);
    } catch (err) {
      console.error('Error loading auctions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle column header clicks for sorting
  const handleColumnSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      // Same column clicked - reverse direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column clicked - set to desc for most columns, asc for urgency
      setSortBy(column);
      setSortDirection(column === 'urgency' ? 'asc' : 'desc');
    }
  };

  // Enhanced sorting function with ROI support
  const sortedAuctions = [...auctions].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'urgency':
        compareValue = a.time_remaining_hours - b.time_remaining_hours;
        break;
      case 'discount':
        const aPercent = a.price_analysis?.percent_below_avg || 0;
        const bPercent = b.price_analysis?.percent_below_avg || 0;
        compareValue = bPercent - aPercent; // Higher discount first by default
        break;
      case 'roi':
        const aROI = a.price_analysis?.raw_roi?.roi_percentage || 0;
        const bROI = b.price_analysis?.raw_roi?.roi_percentage || 0;
        compareValue = bROI - aROI; // Higher ROI first by default
        break;
      case 'priority':
        const aPriority = a.card_info?.priority_score || 0;
        const bPriority = b.card_info?.priority_score || 0;
        compareValue = bPriority - aPriority; // Higher priority first by default
        break;
      case 'price':
        compareValue = a.current_price - b.current_price;
        break;
      case 'card':
        const aPlayer = a.card_info?.player || '';
        const bPlayer = b.card_info?.player || '';
        compareValue = aPlayer.localeCompare(bPlayer);
        break;
      case 'grade':
        const aGrade = a.grade || 'Raw';
        const bGrade = b.grade || 'Raw';
        compareValue = aGrade.localeCompare(bGrade);
        break;
      case 'type':
        const aType = getListingTypeDisplay(a);
        const bType = getListingTypeDisplay(b);
        compareValue = aType.localeCompare(bType);
        break;
      case 'seller':
        compareValue = a.seller_username.localeCompare(b.seller_username);
        break;
      default:
        compareValue = 0;
    }
    
    return sortDirection === 'desc' ? -compareValue : compareValue;
  }).filter(auction => auction.current_price <= filterBudget);

  const getUrgencyClass = (hours: number) => {
    if (hours < 2) return 'critical-urgency';
    if (hours < 6) return 'high-urgency';
    if (hours < 24) return 'medium-urgency';
    return 'low-urgency';
  };

  const getProfitClass = (percent: number) => {
    if (percent >= 30) return 'high-profit';
    if (percent >= 20) return 'medium-profit';
    return 'low-profit';
  };

  // FIXED: Prevent emoji duplication by removing emojis from function
  const getListingTypeDisplay = (auction: Auction) => {
    // Check if it's a raw card first
    if (auction.price_analysis?.raw_roi) {
      return 'RAW';  // No emoji - CSS will add 🎯
    }
    
    // Determine listing type based on BIN price availability
    const hasBIN = auction.buy_it_now_price !== undefined && auction.buy_it_now_price !== null;
    const hasAuction = auction.time_remaining_hours > 0 && auction.time_remaining_hours < 168; // Less than a week suggests auction
    
    if (hasBIN && hasAuction && auction.current_price !== auction.buy_it_now_price) {
      return 'Auction+BIN';  // No emoji - CSS will add ⚡
    } else if (hasBIN) {
      return 'BIN';  // No emoji - CSS will add 💎
    } else {
      return 'Auction';  // No emoji - CSS will add 🔨
    }
  };

  const getListingTypeClass = (auction: Auction) => {
    const display = getListingTypeDisplay(auction);
    if (display.includes('RAW')) return 'listing-type-raw';
    if (display.includes('Auction+BIN')) return 'listing-type-auction-plus-bin';
    if (display.includes('BIN')) return 'listing-type-bin';
    return 'listing-type-auction';
  };

  // Get sort indicator for column headers
  const getSortIndicator = (column: typeof sortBy) => {
    if (sortBy !== column) return ' ↕️';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // NEW: Separate ROI display function
  const getROIDisplay = (auction: Auction) => {
    if (auction.price_analysis?.raw_roi) {
      return {
        percentage: auction.price_analysis.raw_roi.roi_percentage,
        profit: auction.price_analysis.raw_roi.potential_profit,
        hasROI: true
      };
    }
    return { percentage: 0, profit: 0, hasROI: false };
  };

  // UPDATED: Pure discount display (no ROI)
  const getDiscountDisplay = (auction: Auction) => {
    const percent = auction.price_analysis?.percent_below_avg || 0;
    return {
      main: `-${percent.toFixed(1)}%`,
      detail: `Avg: $${Math.round(auction.price_analysis?.average_price || auction.current_price * 1.3).toLocaleString()}`
    };
  };

  return (
    <div className="hot-auctions-page">
      {/* Page Header */}
{/* ENHANCED Page Header */}
      <div className="page-header-enhanced">
        {/* Main Header Section */}
        <div className="header-main-section">
          <div className="header-title-group">
            <h1 className="page-title">
              <span className="title-icon">🔥</span>
              <span className="title-text">Hot Auctions</span>
              <span className="title-badge">LIVE eBay Data</span>
            </h1>
            
            <div className="header-status-row">
              <div className="status-info">
                {isLoading ? (
                  <div className="loading-indicator">
                    <span className="loading-spinner">⚾</span>
                    <span className="status-text loading-text">Scouting the marketplace...</span>
                  </div>
                ) : error ? (
                  <div className="error-indicator">
                    <span className="error-icon">⚠️</span>
                    <span className="status-text error-text">Connection lost</span>
                  </div>
                ) : (
                  <div className="live-indicator">
                    <span className="live-dot"></span>
                    <span className="status-text">
                      <strong>{sortedAuctions.length}</strong> unicorns detected
                    </span>
                  </div>
                )}
              </div>
              
              {!isLoading && !error && (
                <div className="last-update">
                  <span className="update-label">Last Scout</span>
                  <span className="update-time">{lastRefresh.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Section */}
          <div className="header-actions-section">
            <button 
              onClick={loadAuctions} 
              disabled={isLoading}
              className={`refresh-button ${isLoading ? 'loading' : ''}`}
            >
              <span className="refresh-icon">{isLoading ? '⚾' : '🔄'}</span>
              <span className="refresh-text">
                {isLoading ? 'Hunting...' : 'Hunt Again'}
              </span>
            </button>
          </div>
        </div>
        
        {/* Controls Section */}
        <div className="header-controls-section">
          <div className="controls-grid">
            <div className="control-item">
              <label className="control-label">Sort by</label>
              <select 
                value={sortBy} 
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setSortDirection('desc');
                }}
                className="control-select"
              >
                <option value="urgency">⏰ Ending Soonest</option>
                <option value="discount">📉 Biggest Discount</option>
                <option value="roi">💰 Highest ROI</option>
                <option value="priority">⭐ Highest Priority</option>
                <option value="price">💵 Price</option>
                <option value="card">🎯 Card Name</option>
                <option value="grade">🏆 Grade</option>
                <option value="type">📊 Type</option>
                <option value="seller">👤 Seller</option>
              </select>
            </div>
            
            <div className="control-item">
              <label className="control-label">Budget Filter</label>
              <select 
                value={filterBudget} 
                onChange={(e) => setFilterBudget(Number(e.target.value))}
                className="control-select"
                >
                <option value={100}>Under $100</option>
                <option value={200}>Under $200</option>
                <option value={300}>Under $300</option>
                <option value={400}>Under $400</option>
                <option value={500}>Under $500</option>
                <option value={600}>Under $600</option>
                <option value={700}>Under $700</option>
                <option value={800}>Under $800</option>
                <option value={900}>Under $900</option>
                <option value={1000}>Under $1,000</option>
                <option value={2000}>Under $2,000</option>
                <option value={10000}>All Prices</option>
              </select>
            </div>
            
            <div className="control-item">
              <label className="control-label">Quick Actions</label>
              <div className="quick-action-buttons">
                <button className="quick-btn priority-btn" title="High Priority Only">
                  <span>🔥</span>
                </button>
                <button className="quick-btn ending-btn" title="Ending Soon">
                  <span>⏰</span>
                </button>
                <button className="quick-btn discount-btn" title="Big Discounts">
                  <span>📉</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

{/* ENHANCED Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-content">
            <div className="loading-icon baseball"></div>
            <h3>Hunting Unicorns...</h3>
            <p>Scanning eBay for undervalued cards across your 25-card watchlist</p>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
            <div className="loading-status">
              <span>🔍 Analyzing market data...</span>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED Error State */}
      {error && (
        <div className="error-state">
          <h3>Connection Timeout</h3>
          <p>Unable to connect to eBay marketplace. The cards are waiting for you!</p>
          <button onClick={loadAuctions} className="retry-btn">
            Reconnect & Hunt
          </button>
        </div>
      )}

      {/* ENHANCED No Results State */}
      {!isLoading && !error && sortedAuctions.length === 0 && (
        <div className="no-results-state">
          <div className="no-results-content">
            <div className="no-results-icon">🎯</div>
            <h3>No Unicorns Found Right Now</h3>
            <p>The hunt continues! Refresh in a few minutes - rare opportunities appear when you least expect them.</p>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <h3>❌ Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={loadAuctions} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && sortedAuctions.length === 0 && (
        <div className="no-results-state">
          <div className="no-results-content">
            <div className="no-results-icon">🎯</div>
            <h3>No Hot Deals Found</h3>
            <p>Keep monitoring - unicorn opportunities will appear!</p>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      {!isLoading && !error && sortedAuctions.length > 0 && (
        <div className="desktop-table">
          <table className="auctions-table">
            <thead>
              <tr>
                <th onClick={() => handleColumnSort('urgency')} className="sortable-header">
                  Urgency{getSortIndicator('urgency')}
                </th>
                <th onClick={() => handleColumnSort('card')} className="sortable-header">
                  Card{getSortIndicator('card')}
                </th>
                <th onClick={() => handleColumnSort('grade')} className="sortable-header">
                  Grade{getSortIndicator('grade')}
                </th>
                <th onClick={() => handleColumnSort('type')} className="sortable-header">
                  Type{getSortIndicator('type')}
                </th>
                <th onClick={() => handleColumnSort('price')} className="sortable-header">
                  Price{getSortIndicator('price')}
                </th>
                <th onClick={() => handleColumnSort('roi')} className="sortable-header">
                  ROI{getSortIndicator('roi')}
                </th>
                <th onClick={() => handleColumnSort('discount')} className="sortable-header">
                  Discount{getSortIndicator('discount')}
                </th>
                <th onClick={() => handleColumnSort('seller')} className="sortable-header">
                  Seller{getSortIndicator('seller')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAuctions.map((auction) => {
                const discountDisplay = getDiscountDisplay(auction);
                const roiDisplay = getROIDisplay(auction);
                return (
                  <tr key={auction.id} className={`auction-row ${getUrgencyClass(auction.time_remaining_hours)}`}>
                    <td className="urgency-cell">
                      <CountdownTimer 
                        initialHours={auction.time_remaining_hours}
                        size="medium"
                        showSeconds={auction.time_remaining_hours < 3}
                      />
                    </td>
                    
                    <td className="card-cell">
                      <div className="card-name">
                        {auction.card_info?.player || 'Unknown Player'}
                      </div>
                      <div className="card-details">
                        {auction.card_info?.year} {auction.card_info?.brand} {auction.card_info?.set_name}
                        {auction.card_info?.parallel && <span className="parallel"> • {auction.card_info.parallel}</span>}
                      </div>
                    </td>
                    
                    <td className="grade-cell">
                      <span className={`grade-badge ${(auction.grade || 'raw').toLowerCase().replace(' ', '-')}`}>
                        {auction.grade || 'Raw'}
                      </span>
                    </td>

                    <td className="type-cell">
                      <span className="type-emoji">
                        {auction.price_analysis?.listing_type === 'Auction' ? '🔨' : 
                         auction.price_analysis?.listing_type === 'Auction+BIN' ? '⚡' : '💎'}
                      </span>
                      <span className="type-badge">
                        {auction.price_analysis?.listing_type || 'BIN'}
                      </span>
                    </td>
                    
                    <td className="price-cell">
                      <div className="current-price">${auction.current_price.toLocaleString()}</div>
                      {auction.buy_it_now_price && auction.buy_it_now_price !== auction.current_price && (
                        <div className="bin-price">BIN: ${auction.buy_it_now_price.toLocaleString()}</div>
                      )}
                    </td>
                    
                    {/* NEW: Separate ROI Column */}
                    <td className="roi-cell">
                      {roiDisplay.hasROI ? (
                        <>
                          <div className="roi-percent roi-positive">
                            +{roiDisplay.percentage}%
                          </div>
                          <div className="roi-subtitle">ROI Potential</div>
                          <div className="roi-detail">
                            Profit: ${roiDisplay.profit.toLocaleString()}
                          </div>
                        </>
                      ) : (
                        <div className="roi-empty">—</div>
                      )}
                    </td>
                    
                    {/* UPDATED: Pure Discount Column */}
                    <td className="discount-cell">
                      <div className={`discount-percent ${getProfitClass(auction.price_analysis?.percent_below_avg || 0)}`}>
                        {discountDisplay.main}
                      </div>
                      <div className="discount-detail">
                        {discountDisplay.detail}
                      </div>
                    </td>
                    
                    <td className="seller-cell">
                      <div className="seller-name">{auction.seller_username}</div>
                      <div className="seller-rating">
                        {auction.seller_positive_percentage}% ({auction.seller_feedback_score})
                      </div>
                    </td>
                    
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <a 
                          href={auction.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                        >
                          View on eBay
                        </a>
                        <button className="btn btn-secondary">Watch</button>
                        <button className="btn btn-dismiss">Dismiss</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && !error && sortedAuctions.length > 0 && (
        <div className="mobile-cards">
          {sortedAuctions.map((auction) => {
            const discountDisplay = getDiscountDisplay(auction);
            const roiDisplay = getROIDisplay(auction);
            return (
              <div key={auction.id} className={`auction-card ${getUrgencyClass(auction.time_remaining_hours)}`}>
                <div className="card-header">
                  <div className="urgency-badge">
                    <CountdownTimer 
                      initialHours={auction.time_remaining_hours}
                      size="small"
                      showSeconds={auction.time_remaining_hours < 1}
                    />
                  </div>
                  <div className={`discount-badge ${roiDisplay.hasROI ? 'roi-positive' : getProfitClass(auction.price_analysis?.percent_below_avg || 0)}`}>
                    {roiDisplay.hasROI ? `+${roiDisplay.percentage}%` : discountDisplay.main}
                  </div>
                </div>
                
                <div className="card-content">
                  <h3 className="card-title">{auction.card_info?.player || 'Unknown Player'}</h3>
                  <p className="card-subtitle">
                    {auction.card_info?.year} {auction.card_info?.brand} {auction.card_info?.set_name}
                    {auction.card_info?.parallel && ` • ${auction.card_info.parallel}`}
                  </p>
                  
                  <div className="card-meta">
                    <span className={`grade-badge ${(auction.grade || 'raw').toLowerCase().replace(' ', '-')}`}>
                      {auction.grade || 'Raw'}
                    </span>
                    <span className={`type-badge ${getListingTypeClass(auction)}`}>
                      {getListingTypeDisplay(auction)}
                    </span>
                    <span className="price">${auction.current_price.toLocaleString()}</span>
                    {auction.buy_it_now_price && auction.buy_it_now_price !== auction.current_price && (
                      <span className="bin-price">BIN: ${auction.buy_it_now_price.toLocaleString()}</span>
                    )}
                  </div>
                  
                  {/* Enhanced mobile info display */}
                  <div className="mobile-info-grid">
                    {roiDisplay.hasROI && (
                      <div className="mobile-roi-info">
                        <div className="mobile-roi roi-positive">
                          +{roiDisplay.percentage}% ROI Potential
                        </div>
                        <div className="mobile-roi-detail">
                          Profit: ${roiDisplay.profit.toLocaleString()}
                        </div>
                      </div>
                    )}
                    <div className="mobile-discount-info">
                      <div className={`mobile-discount ${getProfitClass(auction.price_analysis?.percent_below_avg || 0)}`}>
                        {discountDisplay.main} Below Average
                      </div>
                      <div className="mobile-discount-detail">
                        {discountDisplay.detail}
                      </div>
                    </div>
                  </div>
                  
                  <div className="seller-info">
                    {auction.seller_username} • {auction.seller_positive_percentage}% ({auction.seller_feedback_score})
                  </div>
                </div>
                
                <div className="card-actions">
                  <a 
                    href={auction.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-full"
                  >
                    View on eBay
                  </a>
                  <div className="action-row">
                    <button className="btn btn-secondary">👁️ Watch</button>
                    <button className="btn btn-dismiss">✖️ Dismiss</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}