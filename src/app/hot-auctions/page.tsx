'use client';

import React, { useState, useEffect } from 'react';
import { getHotAuctions, dismissAuctionItem } from '../../lib/data/dataService';
import { Auction } from '../../lib/types/auction';
import { CountdownTimer } from '../../components/CountdownTimer';

interface DismissState {
  [key: string]: 'idle' | 'confirming' | 'dismissing' | 'dismissed';
}

interface FadingState {
  [key: string]: boolean;
}

export default function HotAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<'urgency' | 'discount' | 'priority' | 'price' | 'card' | 'grade' | 'type' | 'seller' | 'roi'>('urgency');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterBudget, setFilterBudget] = useState<number>(1000);

  // NEW: Dismiss functionality state
  const [dismissStates, setDismissStates] = useState<DismissState>({});
  const [fadingItems, setFadingItems] = useState<FadingState>({});
  const [dismissErrors, setDismissErrors] = useState<{[key: string]: string}>({});

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
      
      // Reset dismiss states when new data loads
      setDismissStates({});
      setFadingItems({});
      setDismissErrors({});
    } catch (err) {
      console.error('Error loading auctions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Handle dismiss button clicks
  const handleDismissClick = async (auction: Auction) => {
    const itemId = auction.listing_id;
    const currentState = dismissStates[itemId] || 'idle';

    if (currentState === 'idle') {
      // First click: Show confirmation (green checkmark)
      setDismissStates(prev => ({
        ...prev,
        [itemId]: 'confirming'
      }));
      
      // Auto-reset confirmation after 5 seconds if no second click
      setTimeout(() => {
        setDismissStates(prev => {
          if (prev[itemId] === 'confirming') {
            return { ...prev, [itemId]: 'idle' };
          }
          return prev;
        });
      }, 5000);
      
    } else if (currentState === 'confirming') {
      // Second click: Actually dismiss the item
      setDismissStates(prev => ({
        ...prev,
        [itemId]: 'dismissing'
      }));

      try {
        console.log(`🗑️ DISMISSING: ${auction.title.substring(0, 50)}...`);
        
        const success = await dismissAuctionItem(auction, 'Dismissed from Hot Auctions interface');
        
        if (success) {
          // Start fade-out animation
          setFadingItems(prev => ({ ...prev, [itemId]: true }));
          
          // After animation completes, remove from list
          setTimeout(() => {
            setAuctions(prev => prev.filter(a => a.listing_id !== itemId));
            setFadingItems(prev => {
              const newState = { ...prev };
              delete newState[itemId];
              return newState;
            });
            setDismissStates(prev => {
              const newState = { ...prev };
              delete newState[itemId];
              return newState;
            });
          }, 500); // Match CSS animation duration
          
          console.log(`✅ Successfully dismissed: ${auction.title.substring(0, 50)}...`);
          
        } else {
          // Handle error
          setDismissErrors(prev => ({
            ...prev,
            [itemId]: 'Failed to dismiss item. Please try again.'
          }));
          setDismissStates(prev => ({
            ...prev,
            [itemId]: 'idle'
          }));
          
          // Clear error after 3 seconds
          setTimeout(() => {
            setDismissErrors(prev => {
              const newState = { ...prev };
              delete newState[itemId];
              return newState;
            });
          }, 3000);
        }
        
      } catch (error) {
        console.error('Error dismissing item:', error);
        setDismissErrors(prev => ({
          ...prev,
          [itemId]: 'Network error. Please try again.'
        }));
        setDismissStates(prev => ({
          ...prev,
          [itemId]: 'idle'
        }));
      }
    }
  };

  // NEW: Get dismiss button display
  const getDismissButtonContent = (auction: Auction) => {
    const itemId = auction.listing_id;
    const state = dismissStates[itemId] || 'idle';
    const error = dismissErrors[itemId];

    if (error) {
      return {
        text: 'Error',
        className: 'btn btn-error',
        disabled: false
      };
    }

    switch (state) {
      case 'confirming':
        return {
          text: '✓',
          className: 'btn btn-confirm',
          disabled: false
        };
      case 'dismissing':
        return {
          text: '⏳',
          className: 'btn btn-dismissing',
          disabled: true
        };
      case 'dismissed':
        return {
          text: '✓',
          className: 'btn btn-dismissed',
          disabled: true
        };
      default:
        return {
          text: 'Dismiss',
          className: 'btn btn-dismiss',
          disabled: false
        };
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
              <span className="refresh-icon">{isLoading ? '⚡' : '🔄'}</span>
              <span className="refresh-text">
                {isLoading ? 'Scanning...' : 'Refresh'}
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
                  setSortBy(e.target.value as unknown);
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
                const dismissButton = getDismissButtonContent(auction);
                const isConfirming = dismissStates[auction.listing_id] === 'confirming';
                const isFading = fadingItems[auction.listing_id];
                const dismissError = dismissErrors[auction.listing_id];
                
                return (
                  <tr 
                    key={auction.id} 
                    className={`auction-row ${getUrgencyClass(auction.time_remaining_hours)} ${isFading ? 'fading-out' : ''} ${isConfirming ? 'confirming-dismiss' : ''}`}
                  >
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
                        <button 
                          className={dismissButton.className}
                          disabled={dismissButton.disabled}
                          onClick={() => handleDismissClick(auction)}
                          title={isConfirming ? 'Click again to confirm dismissal' : 'Dismiss this item'}
                        >
                          {dismissButton.text}
                        </button>
                        {dismissError && (
                          <div className="dismiss-error">{dismissError}</div>
                        )}
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
            const dismissButton = getDismissButtonContent(auction);
            const isConfirming = dismissStates[auction.listing_id] === 'confirming';
            const isFading = fadingItems[auction.listing_id];
            const dismissError = dismissErrors[auction.listing_id];
            
            return (
              <div 
                key={auction.id} 
                className={`auction-card ${getUrgencyClass(auction.time_remaining_hours)} ${isFading ? 'fading-out' : ''} ${isConfirming ? 'confirming-dismiss' : ''}`}
              >
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
                  
                  {dismissError && (
                    <div className="mobile-dismiss-error">{dismissError}</div>
                  )}
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
                    <button 
                      className={`${dismissButton.className} mobile-dismiss`}
                      disabled={dismissButton.disabled}
                      onClick={() => handleDismissClick(auction)}
                      title={isConfirming ? 'Tap again to confirm' : 'Dismiss this item'}
                    >
                      {isConfirming ? '✓ Confirm?' : dismissButton.text === '✓' ? '✓' : '✖️ Dismiss'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW: Enhanced CSS for dismiss functionality */}
      <style jsx>{`
        /* Dismiss button states */
        .btn-dismiss {
          background: #64748b;
          color: white;
          border: 1px solid #475569;
          transition: all 0.3s ease;
        }

        .btn-dismiss:hover {
          background: #ef4444;
          border-color: #dc2626;
          transform: translateY(-1px);
        }

        .btn-confirm {
          background: #22c55e !important;
          border-color: #16a34a !important;
          color: white !important;
          animation: confirmPulse 1s ease-in-out infinite alternate;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
        }

        .btn-dismissing {
          background: #f59e0b;
          border-color: #d97706;
          color: white;
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-dismissed {
          background: #10b981;
          border-color: #059669;
          color: white;
          opacity: 0.8;
          cursor: not-allowed;
        }

        .btn-error {
          background: #ef4444;
          border-color: #dc2626;
          color: white;
          animation: errorShake 0.5s ease-in-out;
        }

        /* Row states */
        .confirming-dismiss {
          background: rgba(34, 197, 94, 0.05) !important;
          border-left: 3px solid #22c55e;
          animation: confirmGlow 2s ease-in-out infinite alternate;
        }

        .fading-out {
          opacity: 0;
          transform: translateX(-20px);
          transition: all 0.5s ease-out;
          pointer-events: none;
        }

        /* Error display */
        .dismiss-error {
          position: absolute;
          background: #ef4444;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          bottom: -25px;
          left: 0;
          white-space: nowrap;
          z-index: 10;
          animation: errorFadeIn 0.3s ease-out;
        }

        .mobile-dismiss-error {
          background: #ef4444;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.875rem;
          margin-top: 8px;
          text-align: center;
          animation: errorFadeIn 0.3s ease-out;
        }

        /* Animations */
        @keyframes confirmPulse {
          0% { 
            box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
            transform: scale(1);
          }
          100% { 
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.1);
            transform: scale(1.02);
          }
        }

        @keyframes confirmGlow {
          0% { background: rgba(34, 197, 94, 0.03); }
          100% { background: rgba(34, 197, 94, 0.08); }
        }

        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        @keyframes errorFadeIn {
          0% { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        /* Mobile specific styles */
        .mobile-dismiss {
          min-width: 80px;
          text-align: center;
        }

        /* Action buttons relative positioning for error display */
        .action-buttons {
          position: relative;
        }

        /* Enhanced button spacing and layout */
        .action-buttons .btn {
          margin-right: 8px;
        }

        .action-buttons .btn:last-child {
          margin-right: 0;
        }

        /* Responsive button sizes */
        @media (max-width: 768px) {
          .mobile-dismiss {
            font-size: 0.875rem;
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
}