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
  ebay_url: string;  // ✅ FIXED: Changed from 'url' to 'ebay_url' for consistency
  grade?: string;
  grader?: 'PSA' | 'BGS' | 'SGC';
  grade_number?: number;
  created_at: string;
  
  // NEW: Image support for CardImage component
  image_url?: string;        // Full-size image (800px) for modal display
  thumbnail_url?: string;    // Thumbnail image (225px) for table display
  
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
    confidence_score?: number;        // 0-100 confidence in price data
    uses_real_data?: boolean;         // true if using historical data vs mock
    listing_type?: string;            // For type column display
    raw_roi?: {
      roi_percentage: number;
      expected_value: number;
      grading_cost: number;
      potential_profit: number;
      confidence_score?: number;      // confidence in ROI calculation
      uses_real_data?: boolean;       // true if using real PSA prices
    };
  };
}

// Support interfaces for image system
export interface eBayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  currentBidPrice?: {
    value: string;
    currency: string;
  };
  buyingOptions: string[];
  itemEndDate?: string;
  seller: {
    username: string;
    feedbackPercentage?: number;
    feedbackScore?: number;
  };
  itemWebUrl: string;
  condition?: string;
  
  // NEW: Image support from eBay Browse API
  image?: {
    imageUrl: string;
  };
  additionalImages?: Array<{
    imageUrl: string;
  }>;
}

export interface DismissedItem {
  id: string;
  ebay_item_id: string;
  card_id: string;
  title: string;
  current_price: number;
  seller_username: string;
  dismissed_at: string;
  expires_at: string;
  user_notes?: string;
  card_info?: {
    player: string;
    year: number;
    brand: string;
    set_name: string;
  };
}