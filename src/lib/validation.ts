// ============================================================================
// SENDA — Zod validation schemas for frontend input validation
// ============================================================================

import { z } from 'zod';

// ── Auth schemas ────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(320),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
});

// ── Contact form ────────────────────────────────────────────────────────────
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').max(320),
  phone: z.string().max(20).optional().or(z.literal('')),
  company: z.string().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Message is required').max(5000),
});

// ── Support ticket ──────────────────────────────────────────────────────────
export const ticketSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(500),
  message: z.string().trim().min(1, 'Message is required').max(10000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

// ── Organization onboarding ─────────────────────────────────────────────────
export const onboardingSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required').max(200),
  industry: z.string().min(1, 'Industry is required').max(100),
  language: z.string().max(10).optional(),
  tone: z.string().max(50).optional(),
});

// ── Branch ──────────────────────────────────────────────────────────────────
export const branchSchema = z.object({
  name: z.string().trim().min(1, 'Branch name is required').max(200),
  google_place_id: z.string().max(500).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
});

// ── Template ────────────────────────────────────────────────────────────────
export const templateSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required').max(200),
  content: z.string().trim().min(1, 'Content is required').max(5000),
  rating: z.number().int().min(1).max(5).optional(),
  tone: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
});

// ── Utility: safe parse with error message ──────────────────────────────────
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return { success: false, error: firstError?.message || 'Invalid input' };
}
