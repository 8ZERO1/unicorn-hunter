export interface DismissedItem {
  id: string;
  ebay_item_id: string;
  title: string;
  current_price: number;
  dismissed_at: string;
  expires_at: string;
  card_player: string;
  card_year: string;
  card_brand: string;
  days_remaining: number;
  ebay_url: string;
  image_url: string;
}