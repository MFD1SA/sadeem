// ─── Database Row Types ───

export interface DbUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export interface DbOrganization {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
  country: string | null;
  city: string | null;
  smart_template_mode: boolean;
  created_at: string;
}

export interface DbMembership {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  status: string;
  created_at: string;
}

export interface DbBranch {
  id: string;
  organization_id: string;
  google_location_id: string | null;
  google_name: string | null;
  internal_name: string;
  city: string | null;
  address: string | null;
  status: string;
  created_at: string;
}

export interface DbReview {
  id: string;
  branch_id: string;
  organization_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string | null;
  source: string;
  sentiment: string | null;
  status: string;
  google_review_id: string | null;
  is_followup: boolean;
  reviewer_google_id: string | null;
  published_at: string;
  created_at: string;
}

export interface DbReplyDraft {
  id: string;
  review_id: string;
  organization_id: string;
  ai_reply: string | null;
  edited_reply: string | null;
  final_reply: string | null;
  source: string;
  status: string;
  approved_by: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface DbReplyTemplate {
  id: string;
  organization_id: string;
  name: string;
  body: string;
  category: string;
  rating_min: number;
  rating_max: number;
  is_active: boolean;
  usage_count: number;
  /** 'ar' = Arabic only, 'en' = English only, 'any' = matches both languages */
  language: 'ar' | 'en' | 'any';
  created_at: string;
}
