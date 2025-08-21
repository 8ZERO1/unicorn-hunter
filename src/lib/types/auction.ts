export interface Auction {
  id: string;
  listing_id: string;
  card_id: number;
  title: string;
  current_price: number;
  buy_it_now_price?: number;
  time_remaining_hours: number;
  seller_username: string;
  seller_feedback_score: number;
  seller_positive_percentage: number;
  ebay_url: string;  // ✅ FIXED: Changed from 'url' to 'ebay_url'
  grade?: string;
  grader?: 'PSA' | 'BGS' | 'SGC';
  grade_number?: number;
  created_at: string;
  
  // Card information
  card_info?: {
    player: string;
    year: number;
    brand: string;
    set_name: string;
    parallel?: string;
    priority_score: number;
  };
  
  // Enhanced price analysis with raw card ROI support
  price_analysis?: {
    average_price: number;
    percent_below_avg: number;
    is_hot_deal: boolean;
    alert_reason: string;
    confidence_score?: number;        // Confidence in price data (0-100)
    uses_real_data?: boolean;         // true if using historical data vs mock
    raw_roi?: {
      roi_percentage: number;
      expected_value: number;
      grading_cost: number;
      potential_profit: number;
      confidence_score?: number;      // Confidence in ROI calculation
      uses_real_data?: boolean;       // true if using real PSA prices
    };
  };
  
  // Additional fields for image system and enhanced functionality
  image_url?: string;              // Primary eBay item image
  thumbnail_url?: string;          // Smaller version for table display
  search_type?: 'auction' | 'bin' | 'raw';  // Type of search that found this item
}