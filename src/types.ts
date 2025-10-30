export type Market = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  status: 'active' | 'resolved' | 'cancelled';
  close_time: string; // ISO
  base_token: string | null;
  created_at: string;
  updated_at: string;
};

export type Odds = {
  yes: number; // 0..1
  no: number;  // 0..1
  modelVersion: string;
};
