export interface DbQrConfig {
  id: string;
  branch_id: string;
  organization_id: string;
  mode: 'direct' | 'landing';
  google_review_url: string | null;
  slug: string;
  show_employee_field: boolean;
  custom_message: string | null;
  scan_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbQrScan {
  id: string;
  qr_config_id: string;
  event_type: 'scan' | 'click' | 'employee_submit';
  employee_name: string | null;
  user_agent: string | null;
  created_at: string;
}
