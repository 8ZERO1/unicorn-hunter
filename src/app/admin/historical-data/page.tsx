'use client';

import { useState, useEffect } from 'react';
import { initializeHistoricalData } from '../../../lib/data/dataService';

export default function HistoricalDataAdmin() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

const addLog = (message: string) => {
  setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
};

// Add this new useEffect hook here:
useEffect(() => {
  if (logs.length > 0) {
    setTimeout(() => {
      const logsContainer = document.querySelector('.logs-container');
      if (logsContainer) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
    }, 100);
  }
}, [logs]);

const startCollection = async () => {
  // Your existing function stays the same
    setIsCollecting(true);
    setLogs([]);
    setIsComplete(false);
    
    addLog('🚀 Starting historical data collection...');
    addLog('📊 This will collect 90 days of completed sales for all 25 cards');
    addLog('⏱️ Estimated time: 5-10 minutes');
    
    try {
      // Capture console logs
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        addLog(args.join(' '));
        originalConsoleLog(...args);
      };

      const success = await initializeHistoricalData();

      // Add this to the addLog function
      const addLog = (message: string) => {
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    
      // Auto-scroll to bottom after a brief delay
      setTimeout(() => {
          const logsContainer = document.querySelector('.logs-container');
          if (logsContainer) {
          logsContainer.scrollTop = logsContainer.scrollHeight;
          }
      }, 100);
      };
      
      // Restore console
      console.log = originalConsoleLog;
      
      if (success) {
        addLog('🎉 HISTORICAL DATA COLLECTION COMPLETE!');
        addLog('✅ Your system now uses REAL market averages');
        addLog('💎 Raw card ROI calculations use actual PSA prices');
        addLog('📈 "Below average" reflects true market conditions');
        setIsComplete(true);
      } else {
        addLog('❌ Collection failed - check console for errors');
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="admin-container">
      {/* Premium Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-icon">📊</div>
          <div className="header-text">
            <h1>Historical Data Collection</h1>
            <p>Transform mock calculations into investment-grade market analysis</p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="admin-content">
        {/* Info Panel */}
        <div className="info-panel">
          <h3>🎯 What This Accomplishes</h3>
          <div className="feature-grid">
            <div className="feature-item">
              <div className="feature-icon">🔍</div>
              <div className="feature-text">
                <h4>Real Market Data</h4>
                <p>90 days of completed eBay sales for all 25 cards</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📈</div>
              <div className="feature-text">
                <h4>IQR Outlier Filtering</h4>
                <p>Statistical analysis removes extreme prices for clean averages</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💎</div>
              <div className="feature-text">
                <h4>Actual PSA Multipliers</h4>
                <p>Raw card ROI uses real PSA grade sale prices vs estimates</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <div className="feature-text">
                <h4>Confidence Scoring</h4>
                <p>Investment risk assessment based on transaction volume</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="action-panel">
          <div className="action-content">
            <h3>🚀 Initialize Real Data Collection</h3>
            <p>One-time process to replace mock calculations with market reality</p>
            
            <button
              onClick={startCollection}
              disabled={isCollecting}
              className={`action-button ${isCollecting ? 'collecting' : 'ready'}`}
            >
              <span className="button-icon">
                {isCollecting ? '🔄' : '🚀'}
              </span>
              <span className="button-text">
                {isCollecting ? 'Collecting Historical Data...' : 'Start Data Collection'}
              </span>
            </button>

            {isCollecting && (
              <div className="progress-indicator">
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
                <p>Processing market data from eBay Finding API...</p>
              </div>
            )}
          </div>
        </div>

        {/* Logs Panel */}
        {logs.length > 0 && (
          <div className="logs-panel">
            <h3>🔍 Collection Progress</h3>
            <div className="logs-container">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Panel */}
        {isComplete && (
          <div className="success-panel">
            <div className="success-content">
              <div className="success-icon">🎉</div>
              <div className="success-text">
                <h3>Data Collection Complete!</h3>
                <p>Your Unicorn Hunter system now uses real market data for accurate investment decisions.</p>
              </div>
              <div className="success-actions">
                <a href="/hot-auctions" className="success-button">
                  View Hot Auctions with Real Data →
                </a>
              </div>
            </div>
          </div>
        )}
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
        padding: 60px 0;
        margin-bottom: 40px;
        text-align: center; /* Center everything */
        }

        .header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 40px;
        display: flex;
        flex-direction: column; /* Stack vertically */
        align-items: center; /* Center horizontally */
        gap: 20px;
        }

        .header-icon {
        font-size: 5rem; /* Slightly larger for impact */
        opacity: 0.9;
        animation: float 3s ease-in-out infinite; /* Subtle floating animation */
        }

        @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
        }.header-text {
        text-align: center; /* Ensure text is centered */
        }

        .header-text h1 {
        font-size: 3.5rem; /* Slightly larger since it's centered */
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
        background: linear-gradient(135deg, #6366f1, #a855f7);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.02em; /* Tighter letter spacing for modern look */
        }

        .header-text p {
        font-size: 1.3rem; /* Slightly larger subtitle */
        color: var(--text-secondary);
        margin: 12px 0 0 0;
        font-weight: 400;
        max-width: 600px; /* Constrain width for better readability */
        margin-left: auto;
        margin-right: auto;
        }

        .admin-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          gap: 32px;
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

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .feature-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--accent-primary);
          transform: translateY(-2px);
        }

        .feature-icon {
          font-size: 2rem;
          opacity: 0.9;
        }

        .feature-text h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .feature-text p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .action-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 32px;
          backdrop-filter: blur(20px);
          text-align: center;
        }

        .action-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 16px 0;
        }

        .action-content p {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin: 0 0 32px 0;
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          font-size: 1.1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          min-width: 280px;
          justify-content: center;
        }

        .action-button.ready {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }

        .action-button.ready:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .action-button.collecting {
          background: var(--border-subtle);
          color: var(--text-secondary);
          cursor: not-allowed;
        }

        .button-icon {
          font-size: 1.2rem;
        }

        .progress-indicator {
          margin-top: 24px;
          text-align: center;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: var(--border-subtle);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 2px;
          animation: progress 2s ease-in-out infinite;
        }

        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        .progress-indicator p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin: 0;
        }

        .logs-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 32px;
          backdrop-filter: blur(20px);
        }

        .logs-panel h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 20px 0;
        }

        .logs-container {
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          height: 400px;
          overflow-y: auto;
          font-family: 'JetBrains Mono', 'Consolas', monospace;
        }

        .log-entry {
          color: #e5e5e5;
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 8px;
          word-break: break-word;
        }

        .success-panel {
          background: linear-gradient(135deg, 
            rgba(34, 197, 94, 0.1) 0%, 
            rgba(59, 130, 246, 0.1) 100%);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 16px;
          padding: 32px;
          backdrop-filter: blur(20px);
        }

        .success-content {
          display: flex;
          align-items: center;
          gap: 24px;
          text-align: left;
        }

        .success-icon {
          font-size: 4rem;
          opacity: 0.9;
        }

        .success-text h3 {
          font-size: 1.8rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 12px 0;
        }

        .success-text p {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .success-actions {
          margin-left: auto;
        }

        .success-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #22c55e, #3b82f6);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .success-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
        }

        @media (max-width: 768px) {
          .admin-header {
            padding: 40px 0;
          }

          .admin-content {
            padding: 0 20px;
          }

          .header-content {
            padding: 0 20px;
            gap: 16px;
          }

          .header-icon {
            font-size: 4rem;
          }

          .header-text h1 {
            font-size: 2.5rem;
          }

          .header-text p {
            font-size: 1.1rem;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .success-content {
            flex-direction: column;
            text-align: center;
          }

          .success-actions {
            margin-left: 0;
            margin-top: 20px;
          }
        }
      `}</style>
    </div>
  );
}