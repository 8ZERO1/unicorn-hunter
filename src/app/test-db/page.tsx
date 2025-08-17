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
}

export default function TestDatabase() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCards() {
      try {
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .order('priority_score', { ascending: false })
          .limit(10)

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
  }, [])

  if (loading) return <div className="container"><h1>Testing Database Connection...</h1></div>
  
  if (error) {
    return (
      <div className="container">
        <h1>Database Connection Error</h1>
        <div className="card">
          <p style={{color: 'red'}}>{error}</p>
          <p>Check your .env.local file and Supabase credentials</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>✅ Database Connection Successful!</h1>
      <h2>Top 10 Priority Cards from Your Watchlist:</h2>
      
      {cards.map(card => (
        <div key={card.id} className="card">
          <h3>{card.player} - {card.year} {card.brand} {card.set_name}</h3>
          <p><strong>Sport:</strong> {card.sport}</p>
          <p><strong>Priority Score:</strong> {card.priority_score}/100</p>
          <p><strong>Monitoring:</strong> {card.monitoring_frequency}</p>
          <p><strong>Status:</strong> {card.active ? '✅ Active' : '❌ Inactive'}</p>
          {card.parallel && <p><strong>Parallel:</strong> {card.parallel}</p>}
        </div>
      ))}
      
      <div className="card">
        <h3>📊 Test Results:</h3>
        <p>✅ Database connection working</p>
        <p>✅ Cards table accessible</p>
        <p>✅ Priority scoring visible</p>
        <p>✅ Ready for eBay API integration!</p>
      </div>
    </div>
  )
}