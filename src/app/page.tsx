'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Card {
  id: number
  player: string
  sport: string
  year: number
  brand: string
  set_name: string
  card_number: string | null
  parallel: string | null
  priority_score: number
  monitoring_frequency: string
  active: boolean
  rarity_factor: number
  grade_target: string | null
}

interface FilterState {
  sport: string
  priority: string
  active: boolean
  search: string
}

const SPORT_ICONS = {
  MLB: '⚾',
  NBA: '🏀', 
  NFL: '🏈',
  Soccer: '⚽'
}

const PRIORITY_COLORS = {
  high: '#EF4444',
  medium: '#F59E0B', 
  low: '#00D4AA'
}

export default function UnicornHunterDashboard() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterState>({
    sport: 'all',
    priority: 'all',
    active: true,
    search: ''
  })

  useEffect(() => {
    async function fetchCards() {
      try {
        let query = supabase.from('cards').select('*')
        
        if (filter.sport !== 'all') {
          query = query.eq('sport', filter.sport)
        }
        
        if (filter.active) {
          query = query.eq('active', true)
        }

        const { data, error } = await query.order('priority_score', { ascending: false })

        if (error) {
          setError(`Database error: ${error.message}`)
        } else {
          setCards(data || [])
        }
      } catch (err) {
        setError(`Connection error: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [filter.sport, filter.active])

  const filteredCards = cards.filter(card => {
    // Priority filter
    if (filter.priority === 'high' && card.priority_score < 80) return false
    if (filter.priority === 'medium' && (card.priority_score < 60 || card.priority_score >= 80)) return false
    if (filter.priority === 'low' && card.priority_score >= 60) return false
    
    // Search filter
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase()
      const searchableText = `${card.player} ${card.brand} ${card.set_name} ${card.sport} ${card.parallel || ''}`.toLowerCase()
      if (!searchableText.includes(searchTerm)) return false
    }
    
    return true
  })

  const stats = {
    total: filteredCards.length,
    high: filteredCards.filter(c => c.priority_score >= 80).length,
    medium: filteredCards.filter(c => c.priority_score >= 60 && c.priority_score < 80).length,
    low: filteredCards.filter(c => c.priority_score < 60).length
  }

  const getPriorityInfo = (score: number) => {
    if (score >= 80) return { color: PRIORITY_COLORS.high, label: 'HIGH PRIORITY', class: 'priority-high', icon: '🔥' }
    if (score >= 60) return { color: PRIORITY_COLORS.medium, label: 'MEDIUM PRIORITY', class: 'priority-medium', icon: '⚡' }
    return { color: PRIORITY_COLORS.low, label: 'LOW PRIORITY', class: 'priority-low', icon: '📋' }
  }

  const getMonitoringDisplay = (frequency: string) => {
    const intervals = { high: '5', medium: '15', low: '30' }
    return intervals[frequency as keyof typeof intervals] || '30'
  }

  if (loading) {
    return (
      <div className="container">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="brand-title">UNICORN HUNTER</h1>
            <p className="hero-subtitle">Initializing Strategic Monitoring System...</p>
          </div>
        </div>
        
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card loading-shimmer" style={{height: '120px'}} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="brand-title">UNICORN HUNTER</h1>
            <p className="hero-subtitle" style={{color: '#EF4444'}}>System Error Detected</p>
          </div>
        </div>
        
        <div className="glass-card">
          <div className="section-title">❌ Connection Failed</div>
          <p style={{color: '#EF4444', marginBottom: '1rem'}}>{error}</p>
          <p style={{color: '#94A3B8'}}>Please check your database connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="brand-title">UNICORN HUNTER</h1>
          <p className="hero-subtitle">Advanced Card Intelligence Platform</p>
          <p className="hero-tagline">
            Leveraging data science and real-time monitoring to identify undervalued trading cards 
            before market discovery. Built for strategic collectors and investors.
          </p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="glass-card">
        <div className="section-title">🎯 Intelligence Filters</div>
        
        <div className="filter-system">
          <div className="filter-group">
            <label className="filter-label">Sport Category</label>
            <select 
              className="filter-select"
              value={filter.sport} 
              onChange={(e) => setFilter({...filter, sport: e.target.value})}
            >
              <option value="all">All Sports</option>
              <option value="MLB">⚾ Major League Baseball</option>
              <option value="NBA">🏀 National Basketball Association</option>
              <option value="NFL">🏈 National Football League</option>
              <option value="Soccer">⚽ International Soccer</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Priority Level</label>
            <select 
              className="filter-select"
              value={filter.priority} 
              onChange={(e) => setFilter({...filter, priority: e.target.value})}
            >
              <option value="all">All Priority Levels</option>
              <option value="high">🔥 High Priority (80-100)</option>
              <option value="medium">⚡ Medium Priority (60-79)</option>
              <option value="low">📋 Low Priority (0-59)</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Search Query</label>
            <input 
              type="text"
              className="filter-input"
              placeholder="Search players, sets, brands..."
              value={filter.search}
              onChange={(e) => setFilter({...filter, search: e.target.value})}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Monitoring Status</label>
            <div className="checkbox-wrapper">
              <div 
                className={`custom-checkbox ${filter.active ? 'checked' : ''}`}
                onClick={() => setFilter({...filter, active: !filter.active})}
              />
              <span>Active Monitoring Only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="glass-card">
        <div className="section-title">📊 Portfolio Intelligence</div>
        
        <div className="stats-container">
          <div className="stat-card stat-total">
            <span className="stat-number">{stats.total}</span>
            <div className="stat-label">Total Monitored</div>
          </div>
          
          <div className="stat-card stat-high">
            <span className="stat-number">{stats.high}</span>
            <div className="stat-label">High Priority</div>
          </div>
          
          <div className="stat-card stat-medium">
            <span className="stat-number">{stats.medium}</span>
            <div className="stat-label">Medium Priority</div>
          </div>
          
          <div className="stat-card stat-low">
            <span className="stat-number">{stats.low}</span>
            <div className="stat-label">Low Priority</div>
          </div>
        </div>
      </div>

      {/* Watchlist */}
      <div className="glass-card">
        <div className="section-title">🎯 Strategic Watchlist</div>
        
        <div className="watchlist-grid">
          {filteredCards.map(card => {
            const priorityInfo = getPriorityInfo(card.priority_score)
            
            return (
              <div 
                key={card.id} 
                className="card-item"
                style={{'--priority-color': priorityInfo.color} as React.CSSProperties}
              >
                <div className="card-layout">
                  {/* Main Card Information */}
                  <div className="card-main-info">
                    <h4>{card.player}</h4>
                    <div className="card-meta">
                      <p><strong>{card.year} {card.brand} {card.set_name}</strong></p>
                      {card.parallel && (
                        <p className="card-parallel">✨ {card.parallel}</p>
                      )}
                      {card.card_number && (
                        <p>Card #{card.card_number}</p>
                      )}
                      <p>{SPORT_ICONS[card.sport as keyof typeof SPORT_ICONS]} <strong>{card.sport}</strong></p>
                    </div>
                  </div>
                  
                  {/* Monitoring Information */}
                  <div className="card-monitoring">
                    <div className="monitoring-frequency">
                      Every {getMonitoringDisplay(card.monitoring_frequency)} min
                    </div>
                    <div className="grade-target">
                      Target: {card.grade_target || 'Any Grade'}
                    </div>
                  </div>
                  
                  {/* Priority & Status */}
                  <div className="card-priority">
                    <div 
                      className="priority-score"
                      style={{color: priorityInfo.color}}
                    >
                      {card.priority_score}
                      <span style={{fontSize: '1rem', opacity: 0.6}}>/100</span>
                    </div>
                    
                    <div className={`priority-badge ${priorityInfo.class}`}>
                      {priorityInfo.icon} {priorityInfo.label}
                    </div>
                    
                    <div className={`status-badge ${card.active ? 'status-active' : 'status-inactive'}`}>
                      {card.active ? '✅ ACTIVE' : '❌ INACTIVE'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {filteredCards.length === 0 && (
          <div style={{textAlign: 'center', padding: '3rem', color: '#64748B'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🔍</div>
            <h3>No cards match your current filters</h3>
            <p>Try adjusting your search criteria or filters above.</p>
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="glass-card system-status">
        <div className="section-title">🚀 System Status</div>
        
        <div className="status-grid">
          <div className="status-item">
            <span className="status-icon">💾</span>
            <span>Database: <strong style={{color: '#00D4AA'}}>Operational</strong></span>
          </div>
          
          <div className="status-item">
            <span className="status-icon">🔌</span>
            <span>eBay API: <strong style={{color: '#F59E0B'}}>Approval Pending</strong></span>
          </div>
          
          <div className="status-item">
            <span className="status-icon">⚡</span>
            <span>Monitoring: <strong style={{color: '#00D4AA'}}>Ready</strong></span>
          </div>
          
          <div className="status-item">
            <span className="status-icon">🎯</span>
            <span>Active Cards: <strong style={{color: '#7C3AED'}}>{stats.total}</strong></span>
          </div>
          
          <div className="status-item">
            <span className="status-icon">🔥</span>
            <span>High Priority: <strong style={{color: '#EF4444'}}>{stats.high}</strong> (5-min intervals)</span>
          </div>
          
          <div className="status-item">
            <span className="status-icon">💡</span>
            <span>System: <strong style={{color: '#00D4AA'}}>Ready for Live Monitoring</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}