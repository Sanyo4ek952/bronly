export type Property = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  city: string;
  district: string | null;
  address: string;
  price_per_day: number;
  max_guests: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type PropertyInput = {
  title: string;
  description: string;
  city: string;
  district: string;
  address: string;
  price_per_day: number;
  max_guests: number;
  is_active: boolean;
};
