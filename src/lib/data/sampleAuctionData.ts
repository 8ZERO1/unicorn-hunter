import { Auction } from '../types/auction';

export const sampleAuctions: Auction[] = [
  {
    id: 'sample-1',
    listing_id: 'ebay-123456789',
    card_id: 1, // Mike Trout 2011
    title: '2011 Topps Update Mike Trout #US175 PSA 9 Rookie Card RC',
    current_price: 2800,
    buy_it_now_price: 3200,
    time_remaining_hours: 2.5,
    seller_username: 'carddealer99',
    seller_feedback_score: 1247,
    seller_positive_percentage: 99.2,
    url: 'https://ebay.com/itm/sample-123456789',
    grade: 'PSA 9',
    grader: 'PSA',
    grade_number: 9,
    created_at: new Date().toISOString(),
    card_info: {
      player: 'Mike Trout',
      year: 2011,
      brand: 'Topps',
      set_name: 'Update',
      priority_score: 83
    },
    price_analysis: {
      average_price: 4200,
      percent_below_avg: 33.3,
      is_hot_deal: true,
      alert_reason: 'Price 33% below average + ending in 2.5 hours'
    }
  },
  {
    id: 'sample-2',
    listing_id: 'ebay-987654321',
    card_id: 21, // Alex Rodriguez 1-of-13
    title: '2024 Topps Allen Ginter Alex Rodriguez Uniform Collection 1/13',
    current_price: 850,
    time_remaining_hours: 6.2,
    seller_username: 'vintageballcards',
    seller_feedback_score: 2156,
    seller_positive_percentage: 98.8,
    url: 'https://ebay.com/itm/sample-987654321',
    grade: 'Raw',
    created_at: new Date().toISOString(),
    card_info: {
      player: 'Alex Rodriguez',
      year: 2024,
      brand: 'Topps',
      set_name: 'Allen & Ginter',
      parallel: 'Uniform Collection 1/13',
      priority_score: 88
    },
    price_analysis: {
      average_price: 1400,
      percent_below_avg: 39.3,
      is_hot_deal: true,
      alert_reason: 'Price 39% below average for 1-of-13 parallel'
    }
  },
  {
    id: 'sample-3',
    listing_id: 'ebay-456789123',
    card_id: 8, // Shohei Ohtani
    title: '2018 Topps Chrome Shohei Ohtani #150 PSA 10 Rookie Refractor',
    current_price: 1200,
    buy_it_now_price: 1400,
    time_remaining_hours: 12.8,
    seller_username: 'moderncardsonly',
    seller_feedback_score: 856,
    seller_positive_percentage: 97.5,
    url: 'https://ebay.com/itm/sample-456789123',
    grade: 'PSA 10',
    grader: 'PSA',
    grade_number: 10,
    created_at: new Date().toISOString(),
    card_info: {
      player: 'Shohei Ohtani',
      year: 2018,
      brand: 'Topps',
      set_name: 'Chrome',
      parallel: 'Refractor',
      priority_score: 85
    },
    price_analysis: {
      average_price: 1580,
      percent_below_avg: 24.1,
      is_hot_deal: true,
      alert_reason: 'Price 24% below average PSA 10'
    }
  },
  {
    id: 'sample-4',
    listing_id: 'ebay-789123456',
    card_id: 14, // Paolo Banchero
    title: '2022 Panini Prizm Paolo Banchero #278 BGS 9 Rookie',
    current_price: 180,
    time_remaining_hours: 0.8,
    seller_username: 'basketballcardpro',
    seller_feedback_score: 432,
    seller_positive_percentage: 96.8,
    url: 'https://ebay.com/itm/sample-789123456',
    grade: 'BGS 9',
    grader: 'BGS',
    grade_number: 9,
    created_at: new Date().toISOString(),
    card_info: {
      player: 'Paolo Banchero',
      year: 2022,
      brand: 'Panini',
      set_name: 'Prizm',
      priority_score: 68
    },
    price_analysis: {
      average_price: 245,
      percent_below_avg: 26.5,
      is_hot_deal: true,
      alert_reason: 'Price 26% below average + ending in 1.2 hours'
    }
  },
  {
    id: 'sample-5',
    listing_id: 'ebay-321654987',
    card_id: 23, // Tom Brady
    title: '2000 Bowman Chrome Tom Brady #236 PSA 8 Rookie Card',
    current_price: 2400,
    buy_it_now_price: 2800,
    time_remaining_hours: 18.5,
    seller_username: 'footballlegends',
    seller_feedback_score: 1893,
    seller_positive_percentage: 99.1,
    url: 'https://ebay.com/itm/sample-321654987',
    grade: 'PSA 8',
    grader: 'PSA',
    grade_number: 8,
    created_at: new Date().toISOString(),
    card_info: {
      player: 'Tom Brady',
      year: 2000,
      brand: 'Bowman',
      set_name: 'Chrome',
      priority_score: 80
    },
    price_analysis: {
      average_price: 3100,
      percent_below_avg: 22.6,
      is_hot_deal: true,
      alert_reason: 'Price 22% below average for Brady rookie'
    }
  }
];