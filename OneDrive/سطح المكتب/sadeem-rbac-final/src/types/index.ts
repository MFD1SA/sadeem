// ─── Core Entities ───

export interface Organization {
  id: string;
  name: string;
  nameEn: string;
  industry: string;
  logo?: string;
  plan: PlanTier;
  status: 'active' | 'trial' | 'suspended' | 'expired';
  createdAt: string;
}

export type PlanTier = 'starter' | 'growth' | 'enterprise';

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'manager' | 'member';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  internalName: string;
  googleName: string;
  city: string;
  address: string;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  reviewsCount: number;
  googlePlaceId?: string;
  createdAt: string;
}

// ─── Reviews & Responses ───

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';
export type ReviewStatus = 'new' | 'replied' | 'pending_reply' | 'auto_replied' | 'flagged' | 'ignored';

export interface Review {
  id: string;
  organizationId: string;
  branchId: string;
  branchName: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  text: string;
  sentiment: ReviewSentiment;
  status: ReviewStatus;
  googleReviewId?: string;
  publishedAt: string;
  repliedAt?: string;
  suggestedReply?: string;
  actualReply?: string;
  assignedTo?: string;
  tags: string[];
}

export type ResponseStatus = 'pending_approval' | 'approved' | 'sent' | 'auto_sent' | 'rejected' | 'deferred';

export interface Response {
  id: string;
  reviewId: string;
  organizationId: string;
  branchName: string;
  reviewerName: string;
  reviewRating: number;
  reviewText: string;
  responseText: string;
  status: ResponseStatus;
  source: 'ai' | 'template' | 'manual';
  createdAt: string;
  sentAt?: string;
  approvedBy?: string;
  rejectedReason?: string;
}

// ─── Templates ───

export interface ReplyTemplate {
  id: string;
  organizationId: string;
  name: string;
  nameEn?: string;
  body: string;
  bodyEn?: string;
  category: 'positive' | 'negative' | 'neutral' | 'general';
  ratingRange: [number, number];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

// ─── Analytics ───

export interface AnalyticsSnapshot {
  averageRating: number;
  totalReviews: number;
  newReviewsToday: number;
  unrepliedCount: number;
  responseRate: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  ratingDistribution: { [key: number]: number };
  trendData: TrendPoint[];
  branchPerformance: BranchPerformance[];
}

export interface TrendPoint {
  date: string;
  rating: number;
  reviewsCount: number;
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  rating: number;
  reviewsCount: number;
  responseRate: number;
  sentiment: ReviewSentiment;
}

// ─── Team ───

export interface TeamMember extends User {
  repliesCount: number;
  avgResponseTime: string;
  assignedReviews: number;
}

// ─── Integrations ───

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface Integration {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  status: IntegrationStatus;
  connectedAt?: string;
  lastSync?: string;
  errorMessage?: string;
  category: 'google' | 'messaging' | 'api';
}

// ─── Tasks ───

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  relatedReviewId?: string;
  createdAt: string;
  completedAt?: string;
}

// ─── Notifications ───

export type NotificationType = 'review' | 'reply' | 'system' | 'alert' | 'team';

export interface Notification {
  id: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

// ─── Billing ───

export interface BillingInfo {
  plan: PlanTier;
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  monthlyPrice: number;
  currency: string;
  paymentMethod?: string;
  invoices: Invoice[];
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  pdfUrl?: string;
}

// ─── Support ───

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicket {
  id: string;
  organizationId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: 'customer' | 'support';
  senderName: string;
  message: string;
  createdAt: string;
}

// ─── Settings ───

export interface OrganizationSettings {
  autoReplyEnabled: boolean;
  autoReplyDelay: number;
  useCustomerName: boolean;
  replyTone: 'professional' | 'friendly' | 'formal';
  notificationsEmail: boolean;
  notificationsSms: boolean;
  notificationsNewReview: boolean;
  notificationsNegativeReview: boolean;
  language: 'ar' | 'en';
  timezone: string;
}

// ─── Filters ───

export interface ReviewFilters {
  search: string;
  branchId: string;
  rating: number | null;
  sentiment: ReviewSentiment | null;
  status: ReviewStatus | null;
  dateFrom: string;
  dateTo: string;
}

// ─── Page State ───

export interface PageState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
}
