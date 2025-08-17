'use client';

import { useState } from 'react';

interface eBayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  condition: string;
  seller: {
    username: string;
    feedbackPercentage: string;
    feedbackScore: number;
  };
  itemWebUrl: string;
  image?: {
    imageUrl: string;
  };
}

interface eBaySearchResponse {
  itemSummaries?: eBayItem[];
  total?: number;
  warnings?: any[];
  errors?: any[];
  multipleCards?: boolean;
  testResults?: {
    query: string;
    success: boolean;
    total?: number;
    items?: eBayItem[];
    error?: string;
  }[];
  totalTests?: number;
}

export default function ApiTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<eBaySearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testEbayApi = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/ebay-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Mike Trout 2011 Topps Update PSA 10',
          limit: 5
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testMultipleCards = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    // Test cards from your 25-card database
    const testCards = [
      'Mike Trout 2011 Topps Update PSA 10',
      'Alex Rodriguez 2024 Allen Ginter Raw',
      'Shohei Ohtani 2018 Topps Chrome PSA 10', 
      'Paolo Banchero 2022 Panini Prizm BGS 9',
      'Tom Brady 2000 Bowman Chrome PSA 8'
    ];

    try {
      const allResults = [];
      
      for (const query of testCards) {
        console.log(`🔍 Testing: ${query}`);
        
        const response = await fetch('/api/ebay-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            limit: 3
          }),
        });

        if (response.ok) {
          const data = await response.json();
          allResults.push({
            query,
            success: true,
            total: data.total || 0,
            items: data.itemSummaries?.slice(0, 2) || [] // Show 2 items per card
          });
        } else {
          allResults.push({
            query,
            success: false,
            error: `${response.status} ${response.statusText}`
          });
        }

        // Rate limit friendly - small delay between calls
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setResults({ 
        multipleCards: true, 
        testResults: allResults,
        totalTests: testCards.length 
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2em' }}>
          🔧 eBay API Test - Unicorn Hunter
        </h1>
        <p style={{ margin: 0, fontSize: '1.1em', opacity: 0.9 }}>
          Testing OAuth connection with Mike Trout 2011 Topps Update PSA 10
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button
          onClick={testEbayApi}
          disabled={isLoading}
          style={{
            background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '16px',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {isLoading ? '🔄 Testing...' : '🚀 Test Mike Trout'}
        </button>

        <button
          onClick={testMultipleCards}
          disabled={isLoading}
          style={{
            background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '16px',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {isLoading ? '🔄 Testing Multiple...' : '🎯 Test 5 Database Cards'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          color: '#dc2626',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>❌ Error</h3>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {results && !results.multipleCards && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#16a34a' }}>
            ✅ API Connection Successful!
          </h3>
          <p style={{ margin: '0 0 10px 0', color: '#166534' }}>
            <strong>Total Results Found:</strong> {results.total || 0}
          </p>
          <p style={{ margin: 0, color: '#166534' }}>
            <strong>Results Returned:</strong> {results.itemSummaries?.length || 0}
          </p>
        </div>
      )}

      {results && results.multipleCards && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#16a34a' }}>
            🎯 Database Cards Test Results
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
            {results.testResults?.map((test, index) => (
              <div key={index} style={{
                background: test.success ? '#dcfce7' : '#fef2f2',
                padding: '10px',
                borderRadius: '6px',
                border: `1px solid ${test.success ? '#bbf7d0' : '#fca5a5'}`
              }}>
                <strong style={{ color: test.success ? '#15803d' : '#dc2626' }}>
                  {test.success ? '✅' : '❌'} {test.query}
                </strong>
                <br />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {test.success ? `Found: ${test.total} results` : `Error: ${test.error}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {results?.itemSummaries && results.itemSummaries.length > 0 && (
        <div>
          <h2 style={{ 
            color: '#1f2937',
            marginBottom: '20px',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '10px'
          }}>
            🎯 Mike Trout Cards Found
          </h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            {results.itemSummaries.map((item, index) => (
              <div
                key={item.itemId}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {item.image?.imageUrl && (
                    <img
                      src={item.image.imageUrl}
                      alt={item.title}
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 10px 0',
                      color: '#1f2937',
                      fontSize: '1.1em',
                      lineHeight: '1.4'
                    }}>
                      {item.title}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div>
                        <strong style={{ color: '#059669' }}>Price:</strong>
                        <span style={{ marginLeft: '8px', fontSize: '1.1em', fontWeight: 'bold' }}>
                          ${item.price?.value} {item.price?.currency}
                        </span>
                      </div>
                      
                      <div>
                        <strong style={{ color: '#7c3aed' }}>Condition:</strong>
                        <span style={{ marginLeft: '8px' }}>{item.condition}</span>
                      </div>
                      
                      <div>
                        <strong style={{ color: '#dc2626' }}>Seller:</strong>
                        <span style={{ marginLeft: '8px' }}>{item.seller?.username}</span>
                      </div>
                      
                      <div>
                        <strong style={{ color: '#ea580c' }}>Feedback:</strong>
                        <span style={{ marginLeft: '8px' }}>
                          {item.seller?.feedbackPercentage}% ({item.seller?.feedbackScore})
                        </span>
                      </div>
                    </div>
                    
                    <a
                      href={item.itemWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        background: '#1d4ed8',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'background 0.3s ease'
                      }}
                    >
                      🔗 View on eBay
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results?.multipleCards && results.testResults && (
        <div>
          <h2 style={{ 
            color: '#1f2937',
            marginBottom: '20px',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '10px'
          }}>
            🎯 Sample Cards from Database Tests
          </h2>
          
          <div style={{ display: 'grid', gap: '30px' }}>
            {results.testResults.map((test, testIndex) => (
              test.success && test.items && test.items.length > 0 && (
                <div key={testIndex} style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{ 
                    margin: '0 0 15px 0',
                    color: '#1f2937',
                    fontSize: '1.3em',
                    borderBottom: '1px solid #d1d5db',
                    paddingBottom: '10px'
                  }}>
                    {test.query} ({test.total} total found)
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {test.items.map((item, itemIndex) => (
                      <div
                        key={`${testIndex}-${itemIndex}`}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '15px',
                          display: 'flex',
                          gap: '15px',
                          alignItems: 'flex-start'
                        }}
                      >
                        {item.image?.imageUrl && (
                          <img
                            src={item.image.imageUrl}
                            alt={item.title}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb'
                            }}
                          />
                        )}
                        
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            margin: '0 0 8px 0',
                            color: '#1f2937',
                            fontSize: '0.95em',
                            lineHeight: '1.3'
                          }}>
                            {item.title}
                          </h4>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                            <div>
                              <strong style={{ color: '#059669' }}>Price:</strong>
                              <span style={{ marginLeft: '6px', color: '#1f2937', fontWeight: 'bold' }}>
                                ${item.price?.value}
                              </span>
                            </div>
                            
                            <div>
                              <strong style={{ color: '#7c3aed' }}>Condition:</strong>
                              <span style={{ marginLeft: '6px', color: '#1f2937' }}>{item.condition}</span>
                            </div>
                          </div>
                          
                          <a
                            href={item.itemWebUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              background: '#1d4ed8',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              fontSize: '12px',
                              marginTop: '8px'
                            }}
                          >
                            🔗 View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {results?.warnings && results.warnings.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fbbf24',
          color: '#92400e',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>⚠️ Warnings</h4>
          <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(results.warnings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}