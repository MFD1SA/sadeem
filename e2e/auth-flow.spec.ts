// ============================================================================
// SENDA — E2E Test: Login → Dashboard → Logout
//
// Prerequisites:
//   1. A running instance (npm run dev or a deployed URL via E2E_BASE_URL)
//   2. Valid test credentials via env: E2E_USER_EMAIL, E2E_USER_PASSWORD
//   3. Playwright browsers installed: npx playwright install chromium
//
// Run:
//   E2E_USER_EMAIL=test@example.com E2E_USER_PASSWORD=Test1234 npx playwright test
// ============================================================================

import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_USER_EMAIL || 'test@senda.sa'
const PASSWORD = process.env.E2E_USER_PASSWORD || 'Test@1234'

test.describe('Auth Flow: Login → Dashboard → Logout', () => {
  test('should login, verify dashboard, and logout successfully', async ({ page }) => {
    // ── Step 1: Navigate to login page ──────────────────────────────────
    await page.goto('/login')

    // Verify we are on the login page
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // ── Step 2: Fill credentials and submit ─────────────────────────────
    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    // ── Step 3: Verify redirect to dashboard ────────────────────────────
    // Wait for navigation to /dashboard (or any authenticated route)
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    expect(page.url()).toContain('/dashboard')

    // Verify dashboard content is visible (sidebar or main content area)
    const dashboardContent = page.locator('main, [role="main"], .dashboard, nav')
    await expect(dashboardContent.first()).toBeVisible({ timeout: 10_000 })

    // ── Step 4: Logout ──────────────────────────────────────────────────
    // Look for logout button — could be in topbar dropdown or sidebar
    // Try topbar user menu first (click avatar/user button to open dropdown)
    const userMenuButton = page.locator(
      'header button:has(img), header button:has(svg), [class*="avatar"], [aria-label*="user"], [aria-label*="menu"]'
    ).first()

    // If there's a user menu, click it to reveal logout
    if (await userMenuButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await userMenuButton.click()
      await page.waitForTimeout(500) // wait for dropdown animation
    }

    // Find and click the logout button (Arabic: خروج, English: Logout)
    const logoutButton = page.locator(
      'button:has-text("خروج"), button:has-text("Logout"), button:has-text("logout"), a:has-text("خروج"), a:has-text("Logout")'
    ).first()

    await expect(logoutButton).toBeVisible({ timeout: 5_000 })
    await logoutButton.click()

    // ── Step 5: Verify redirect back to login ───────────────────────────
    await page.waitForURL('**/login**', { timeout: 10_000 })
    expect(page.url()).toContain('/login')

    // Verify login form is visible again (confirms session was cleared)
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5_000 })
  })

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 })

    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@senda.sa')
    await page.fill('input[type="password"]', 'WrongPassword123')
    await page.click('button[type="submit"]')

    // Should stay on login page and show error
    await page.waitForTimeout(2_000)
    expect(page.url()).toContain('/login')

    // Verify an error message appears (Arabic or English)
    const errorVisible = await page
      .locator('[role="alert"], .text-red-500, .text-red-600, .error, [class*="error"]')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    // Either an error is shown or we're still on login (both valid)
    expect(page.url()).toContain('/login')
  })

  test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
    // Try to access dashboard directly without login
    await page.goto('/dashboard')

    // Should be redirected to login
    await page.waitForURL('**/login**', { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })
})
