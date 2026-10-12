export type Provider = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
};

export type GameCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type Game = {
  id: string;
  title: string;
  slug: string;
  provider_id: string | null;
  category_id: string | null;
  image_url: string | null;
  rtp: string | null;
  status: 'active' | 'coming_soon' | 'inactive';
  tag: string | null;
  players_online: number;
  sort_order: number;
  created_at: string;
  provider?: Provider | null;
  category?: GameCategory | null;
};

export type Promotion = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  icon: string;
  gradient: string;
  status: 'active' | 'scheduled' | 'expired';
  sort_order: number;
  created_at: string;
};
