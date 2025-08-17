'use client';

import React, { useState } from 'react';

export default function AdminDataCleanup() {
  const [isClearing, setIsClearing] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearContaminatedData = async () => {
    setIsClearing(true);
    setLogs([]);
    addLog('🧹 Starting contaminated data cleanup...');
    
    try {
      // Call the clear function from dataService
      const response = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        addLog('✅ Contaminated price snapshots cleared successfully');
        addLog('🎯 Ready for enhanced base card data collection');
      } else {
        addLog('❌ Failed to clear contaminated data');
      }
    } catch (error) {
      addLog(`💥 Error: ${error}`);
    }
    
    setIsClearing(false);
  };

  const runEnhancedCollection = async () => {
    setIsCollecting(true);
    setProgress({ current: 0, total: 25 });
    addLog('🚀 Starting ENHANCED historical data collection...');
    addLog('📊 Using comprehensive negative keywords for base cards only');
    
    try {
      // Call the enhanced collection function
      const response = await fetch('/api/admin/collect-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        addLog('🎉 Enhanced data collection completed successfully!');
        addLog('💎 System now uses REAL base card market averages');
        addLog('📈 Raw card ROI calculations use actual PSA base prices');
        addLog('✅ Investment-grade market analysis ready');
      } else {
        addLog('❌ Enhanced data collection failed');
      }
    } catch (error) {
      addLog(`💥 Error: ${error}`);
    }
    
    setIsCollecting(false);
  };

  const runFullCleanupAndCollection = async () => {
    addLog('🎯 FULL CLEANUP AND ENHANCED COLLECTION STARTING...');
    await clearContaminatedData();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
    await runEnhancedCollection();
  };

  return (
    <div style={{ 
      padding: '40px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '2.5em',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px 0'
          }}>
            🧹 Enhanced Data Cleanup
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: '1.1em',
            margin: 0 
          }}>
            Fix contaminated market data with base card filtering
          </p>
        </div>

        {/* Problem Description */}
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>
            🚨 Current Data Contamination Issue
          </h3>
          <ul style={{ margin: 0, color: '#991b1b' }}>
            <li><strong>PSA 9 Joe Burrow:</strong> $316 average (WRONG - includes autos/parallels)</li>
            <li><strong>Should be:</strong> $35 average (base cards only)</li>
            <li><strong>Impact:</strong> Inflated ROI calculations and false opportunity alerts</li>
          </ul>
        </div>

        {/* Solution Description */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#15803d', margin: '0 0 10px 0' }}>
            ✅ Enhanced Base Card Filtering
          </h3>
          <ul style={{ margin: 0, color: '#166534' }}>
            <li><strong>50+ negative keywords:</strong> Exclude autos, patches, parallels, premium variants</li>
            <li><strong>Price sanity checks:</strong> Flag suspicious modern PSA 9s over $200</li>
            <li><strong>Conservative validation:</strong> Preserve legitimate base cards</li>
            <li><strong>Real market averages:</strong> Investment-grade calculations</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <button
            onClick={clearContaminatedData}
            disabled={isClearing || isCollecting}
            style={{
              background: isClearing ? '#9ca3af' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              fontSize: '1.1em',
              fontWeight: '600',
              cursor: isClearing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isClearing ? '🧹 Clearing...' : '🧹 Clear Contaminated Data'}
          </button>

          <button
            onClick={runEnhancedCollection}
            disabled={isCollecting || isClearing}
            style={{
              background: isCollecting ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              fontSize: '1.1em',
              fontWeight: '600',
              cursor: isCollecting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isCollecting ? '📊 Collecting...' : '📊 Enhanced Collection'}
          </button>
        </div>

        {/* Full Process Button */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button
            onClick={runFullCleanupAndCollection}
            disabled={isClearing || isCollecting}
            style={{
              background: (isClearing || isCollecting) ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '20px 40px',
              fontSize: '1.2em',
              fontWeight: '700',
              cursor: (isClearing || isCollecting) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)'
            }}
          >
            {(isClearing || isCollecting) ? '⚡ Processing...' : '⚡ Full Cleanup & Enhanced Collection'}
          </button>
        </div>

        {/* Progress Bar */}
        {isCollecting && (
          <div style={{
            background: '#f3f4f6',
            borderRadius: '8px',
            padding: '8px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              height: '8px',
              borderRadius: '4px',
              width: `${(progress.current / progress.total) * 100}%`,
              transition: 'width 0.3s'
            }} />
            <p style={{
              textAlign: 'center',
              margin: '8px 0 0 0',
              fontSize: '0.9em',
              color: '#666'
            }}>
              Processing card {progress.current} of {progress.total}
            </p>
          </div>
        )}

        {/* Live Logs */}
        <div style={{
          background: '#1f2937',
          color: '#e5e7eb',
          borderRadius: '12px',
          padding: '20px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.9em',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h4 style={{
            color: '#10b981',
            margin: '0 0 15px 0',
            fontSize: '1em'
          }}>
            📝 Live Processing Logs
          </h4>
          {logs.length === 0 ? (
            <p style={{ color: '#9ca3af', margin: 0 }}>
              Ready to start enhanced data collection...
            </p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))
          )}
        </div>

        {/* Expected Results */}
        <div style={{
          background: '#fefce8',
          border: '1px solid #fde047',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '30px'
        }}>
          <h3 style={{ color: '#a16207', margin: '0 0 10px 0' }}>
            🎯 Expected Results After Enhancement
          </h3>
          <div style={{ color: '#92400e' }}>
            <p><strong>Before:</strong> Joe Burrow PSA 9 = $316 (contaminated with autos/parallels)</p>
            <p><strong>After:</strong> Joe Burrow PSA 9 = $35 (base cards only)</p>
            <p><strong>Impact:</strong> Realistic ROI calculations for $1,000 budget optimization</p>
          </div>
        </div>
      </div>
    </div>
  );
}